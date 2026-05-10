/**
 * debug_alignment.js - 診斷 PDF 解析序列與 Firestore 的完整對照
 * 只讀不寫，安全診斷工具
 */
const pdfParse = require('pdf-parse');
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function analyzeOnePaper(year, pdfCode, fsCode, pdfPath, totalQ) {
  console.log(`\n${'='.repeat(55)}`);
  console.log(`${year}年 ${pdfCode} → Firestore ${fsCode} (共${totalQ}題)`);
  console.log('='.repeat(55));

  // 1. 讀 Firestore
  const snap = await db.collection('questions').where('year', '==', year).get();
  const fsAns = {};
  snap.forEach(doc => {
    if (!doc.id.includes(`-${fsCode}-`)) return;
    const d = doc.data();
    if (d.answer && d.questionNumber) fsAns[d.questionNumber] = d.answer;
  });
  console.log(`Firestore 已載入: ${Object.keys(fsAns).length} 題有答案`);

  // 2. 解析 PDF — 完整逐行分析
  const buf = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buf);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 找所有純字母行（答案序列）
  const answerLines = [];
  let inAnswerZone = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^[A-D#]{2,}$/.test(lines[i])) {
      answerLines.push(lines[i]);
      inAnswerZone = true;
    } else if (/^[A-D#]$/.test(lines[i])) {
      if (inAnswerZone || answerLines.length > 0) {
        answerLines.push(lines[i]);
      }
    } else if (inAnswerZone && lines[i].includes('複選')) {
      break;
    }
  }

  // 找第1題答案（在答案塊之前的單字母行）
  let q1Answer = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '第1題' && i + 1 < lines.length && /^[A-D]$/.test(lines[i + 1])) {
      q1Answer = lines[i + 1];
      break;
    }
  }

  console.log(`\n第1題答案: ${q1Answer}`);
  console.log(`答案塊 (${answerLines.length}行):`);
  answerLines.forEach((l, i) => console.log(`  [${i}] "${l}" (${l.length}字)`));

  // 建立正確的序列
  // 結構: Q1單獨, 然後是所有塊的序列, 最後1-2個單字母可能是Q13和Q(totalQ)
  // 安全策略: Q13的答案排在最後,倒數第2是Q(totalQ)
  const allBlocks = answerLines.filter(l => l.length >= 2);
  const singles = answerLines.filter(l => l.length === 1);

  // 把所有塊串接
  const blockSeq = allBlocks.join('');
  console.log(`\n塊串接長度: ${blockSeq.length}`);
  console.log(`末尾單字母: [${singles.join(', ')}]`);

  // 預期: 塊序列 = Q2到Q(totalQ)的連續答案，但Q13跳過，Q13在singles最後
  // 所以塊+singles前n-1個 = Q2..Q(totalQ-1)，最後single = Q13
  // 或: 塊長度+singles = (totalQ-1) 如果Q13在末尾

  const expectedBlockLen = totalQ - 2; // Q2~Q(totalQ) minus Q13 (which is separate)
  const expectedTotal = totalQ - 1;    // Q2~Q(totalQ) = totalQ-1 letters

  console.log(`期望塊長度: ${expectedBlockLen} (不含Q1和Q13)`);
  console.log(`實際塊長度: ${blockSeq.length}, singles: ${singles.length}`);

  // 建立最終答案序列
  // 正確做法: Q1=q1Answer, Q2-Q(n-1 excluding Q13 slot)=from blocks, Q(n)=singles[0], Q13=singles[1]
  // 但實際: Q13可能在blocks中間某位置，或在最後

  // 最安全的做法: 把所有 blocks+singles (除了最後的Q13) 按序分配 Q2...Qtotal
  // 然後把最後的single覆寫到Q13位置
  
  // 嘗試：全部串接(blockSeq + singles), 共totalQ-1個字母, 對應Q2~Qtotal
  // 其中Q13的正確位置需要特別處理
  const fullSeq = blockSeq + singles.join('');
  console.log(`全部串接長度: ${fullSeq.length} (期望: ${totalQ - 1})`);

  // 分配方式1: Q1=q1, Q2...Qtotal由fullSeq分配(順序)
  const pdfAns1 = { 1: q1Answer };
  for (let i = 0; i < Math.min(fullSeq.length, totalQ - 1); i++) {
    pdfAns1[i + 2] = fullSeq[i];
  }

  // 分析Q13特殊處理：如果fullSeq最後一個single是Q13
  // 則: pdfAns1[totalQ+1]是Q13(不對)，應覆寫到Q13位置
  // 正確的Q13 = 如果blocks代表Q2~Q(totalQ) (跳過Q13), 那Q13=singles的最後1個
  if (singles.length >= 1) {
    const q13 = singles[singles.length - 1];
    const qLast = singles.length >= 2 ? singles[singles.length - 2] : blockSeq[blockSeq.length - 1];
    
    // 分配方式2: 塊序列代表Q2~Q12, Q14~Q(totalQ), 末尾single=Q13
    // 意思是在位置11(0-indexed)後面插入Q13
    const pdfAns2 = { 1: q1Answer, [totalQ]: singles.length >= 2 ? singles[0] : blockSeq.slice(-1) };
    let pos = 0;
    for (let q = 2; q <= totalQ; q++) {
      if (q === 13) { pdfAns2[13] = q13; continue; }
      if (q === totalQ) continue; // 已設定
      if (pos < blockSeq.length) pdfAns2[q] = blockSeq[pos++];
    }
    
    // 比較兩種方式與FS的吻合度
    let match1 = 0, match2 = 0, total = 0;
    for (let q = 1; q <= totalQ; q++) {
      if (!fsAns[q]) continue;
      total++;
      if (pdfAns1[q] === fsAns[q]) match1++;
      if (pdfAns2[q] === fsAns[q]) match2++;
    }
    console.log(`\n【方式1-直接串接】 吻合: ${match1}/${total}`);
    console.log(`【方式2-Q13單獨】  吻合: ${match2}/${total}`);
    
    // 顯示Q20-Q40的比較
    console.log('\nQ20-Q40 詳細比較(方式1):');
    console.log('Q   PDF1 PDF2  FS   1=FS? 2=FS?');
    for (let q = 20; q <= 40; q++) {
      const p1 = pdfAns1[q] || '?', p2 = pdfAns2[q] || '?', fs = fsAns[q] || '--';
      console.log(`Q${String(q).padStart(2,'0')}  ${p1}    ${p2}    ${fs}    ${p1===fs?'OK':'--'}    ${p2===fs?'OK':'--'}`);
    }
  }
}

async function main() {
  // 只診斷 113-0201 (民法，有最多誤差的那份)
  await analyzeOnePaper(
    113, '0201', '3301',
    'PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',
    80
  );
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
