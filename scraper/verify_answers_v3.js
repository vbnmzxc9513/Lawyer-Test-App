/**
 * verify_answers_v3.js
 * 最終版：正確解析 PDF 答案 + 與 Firestore 比對 + 生成修正腳本
 *
 * PDF 格式說明：
 *   - 第1題答案：單獨一行（第一個單字母行）
 *   - 第2~totalQ題：按順序排列在多個字母塊中
 *   - 字母塊長度不固定（有9、10、甚至8），直接串接即可
 *   - 最後兩個單字母行：倒數第2個=倒數第2題，最後=最後1題(如Q75/Q80)
 *   - Q13單獨出現在題號列中，但答案仍在字母塊的連續序列中
 *
 * Firestore 試卷代碼對應：
 *   PDF 0101 → FS 2301 (憲法+行政法+國際公私法) 75題
 *   PDF 0201 → FS 3301 (民法+民事訴訟法)         80題
 *   PDF 0202 → FS 4301 (公司法等)                80題
 *   PDF 0301 → FS 1301 (刑法+刑訴+法律倫理)      75題
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');

admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const TOTAL_Q = { '0101': 75, '0201': 80, '0202': 80, '0301': 75 };
const FS_CODE  = { '0101': '2301', '0201': '3301', '0202': '4301', '0301': '1301' };

const PDF_FILES = {
  111: {
    '0101': 'PastExam/111/考畢題答/111120_ANS0101_綜合法學(一)(憲法).pdf',
    '0201': 'PastExam/111/考畢題答/111120_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'PastExam/111/考畢題答/111120_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'PastExam/111/考畢題答/111120_ANS0301_綜合法學(一)(刑法.pdf',
  },
  112: {
    '0101': 'PastExam/112/考畢題答/112120_ANS0101_綜合法學(一)(憲法.pdf',
    '0201': 'PastExam/112/考畢題答/112120_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'PastExam/112/考畢題答/112120_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'PastExam/112/考畢題答/112120_ANS0301_綜合法學(一)(刑法.pdf',
  },
  113: {
    '0101': 'PastExam/113/考畢題答/113110_ANS0101_綜合法學(一)(憲法.pdf',
    '0201': 'PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'PastExam/113/考畢題答/113110_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'PastExam/113/考畢題答/113110_ANS0301_綜合法學(一)(刑法.pdf',
  },
};

/**
 * 解析答案 PDF → { 1:'A', 2:'B', ... }
 * 策略：用原始文字直接 regex 抓所有 [A-D#]+ 序列，按出現順序串接
 */
async function parsePdfAnswers(pdfPath, totalQ) {
  const buf = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buf);

  // 在「第100題」題號列之後，到「複選題數」之前，抓所有答案字母
  // 題號列最後一行包含「第91題...第100題」
  const afterHeaders = text.replace(/[\s\S]*?第91題[^\n]*\n/, '');  // 移除題號列前的所有內容
  const beforeFooter = afterHeaders.split(/複選題數/)[0];

  // 從清理後的區域抓所有 [A-D#] 序列（含單字母和多字母塊）
  const allLetters = (beforeFooter.match(/[A-D#]+/g) || []).join('');

  if (allLetters.length < totalQ - 2) {
    // 備用：直接從全文最後區域抓
    const fallback = text.split(/第91題/)[1] || text.slice(-800);
    const letters = (fallback.match(/[A-D#]+/g) || []).join('');
    return buildAnswerMap(letters, totalQ);
  }

  return buildAnswerMap(allLetters, totalQ);
}

function buildAnswerMap(letters, totalQ) {
  const answers = {};
  for (let i = 0; i < Math.min(letters.length, totalQ); i++) {
    answers[i + 1] = letters[i] === '#' ? 'AMENDED' : letters[i];
  }
  return answers;
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  司律一試答案驗證 v3 (111-113年)         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 讀取 Firestore 全部題目
  console.log('📡 讀取 Firestore...');
  const snap = await db.collection('questions').get();
  console.log(`✅ 共 ${snap.size} 題\n`);

  // 建立索引 key = `${year}-${fsCode}-${qNum}`
  const fsIdx = {};
  snap.forEach(doc => {
    const d = doc.data();
    const parts = doc.id.split('-');
    const year = parseInt(parts[0]);
    const fsCode = parts[1];
    const qNum = d.questionNumber || parseInt(parts[parts.length - 1]);
    if (year && fsCode && qNum) {
      fsIdx[`${year}-${fsCode}-${qNum}`] = { id: doc.id, answer: d.answer, subject: d.subject, questionText: d.questionText };
    }
  });

  const mismatches = [], matched = [], notInFS = [];

  for (const year of [111, 112, 113]) {
    for (const pdfCode of ['0101', '0201', '0202', '0301']) {
      const pdfFile = PDF_FILES[year][pdfCode];
      const totalQ = TOTAL_Q[pdfCode];
      const fsCode = FS_CODE[pdfCode];
      const label = `${year}年 ${pdfCode}(→${fsCode})`;

      process.stdout.write(`📄 ${label}... `);

      let pdfAns;
      try {
        pdfAns = await parsePdfAnswers(pdfFile, totalQ);
      } catch(e) {
        console.log(`❌ ${e.message}`); continue;
      }

      const got = Object.keys(pdfAns).length;
      console.log(`PDF解析${got}/${totalQ}題，前10: ${[1,2,3,4,5,6,7,8,9,10].map(n=>pdfAns[n]||'?').join('')}`);

      for (let q = 1; q <= totalQ; q++) {
        const pdfAnswer = pdfAns[q];
        if (!pdfAnswer) continue;
        if (pdfAnswer === 'AMENDED') continue;

        const key = `${year}-${fsCode}-${q}`;
        const doc = fsIdx[key];

        if (!doc) {
          notInFS.push({ year, pdfCode, fsCode, qNum: q, pdfAnswer });
          continue;
        }
        if (!doc.answer) continue; // 沒 answer 欄位，跳過

        if (doc.answer.toUpperCase() === pdfAnswer) {
          matched.push(key);
        } else {
          mismatches.push({
            id: doc.id, year, pdfCode, qNum: q,
            subject: doc.subject,
            firestoreAnswer: doc.answer,
            officialAnswer: pdfAnswer,
            questionText: (doc.questionText||'').substring(0,80),
          });
        }
      }
    }
  }

  // ── 輸出 ──
  console.log('\n' + '═'.repeat(55));
  console.log('📊 驗證結果');
  console.log('═'.repeat(55));
  console.log(`✅ 答案正確: ${matched.length} 題`);
  console.log(`❌ 答案不符（需修正）: ${mismatches.length} 題`);
  console.log(`🔍 Firestore 無對應: ${notInFS.length} 題`);

  // 按試卷分組顯示不符
  if (mismatches.length > 0) {
    console.log('\n❌ 答案不符明細：');
    const grouped = {};
    mismatches.forEach(m => {
      const k = `${m.year}年-${m.pdfCode}`;
      (grouped[k] = grouped[k]||[]).push(m);
    });
    for (const [g, items] of Object.entries(grouped).sort()) {
      console.log(`\n【${g}】 ${items.length}題`);
      items.sort((a,b)=>a.qNum-b.qNum).forEach(m => {
        console.log(`  Q${String(m.qNum).padStart(2,'0')} [${m.id}] FS:${m.firestoreAnswer} → 官方:${m.officialAnswer}  (${m.subject})`);
      });
    }
  }

  if (notInFS.length > 0) {
    console.log(`\n🔍 Firestore 無對應（共${notInFS.length}題，前30筆）：`);
    const byPaper = {};
    notInFS.forEach(n => {
      const k = `${n.year}-${n.fsCode}`;
      (byPaper[k]=byPaper[k]||[]).push(n.qNum);
    });
    for (const [k,nums] of Object.entries(byPaper).sort()) {
      console.log(`  ${k}: Q${nums.sort((a,b)=>a-b).join(',Q')}`);
    }
  }

  // ── 存報告 ──
  const report = {
    generatedAt: new Date().toISOString(),
    summary: { matched: matched.length, mismatches: mismatches.length, notInFirestore: notInFS.length },
    mismatches,
    notInFirestore: notInFS,
  };
  fs.writeFileSync('verify_report_v3.json', JSON.stringify(report, null, 2));
  console.log('\n📄 報告已存: verify_report_v3.json');

  // ── 生成修正腳本 ──
  if (mismatches.length > 0) {
    const fixes = mismatches.map(m =>
      `  { id:'${m.id}', old:'${m.firestoreAnswer}', ans:'${m.officialAnswer}' },`
    ).join('\n');
    const script = `// fix_answers.js - 自動修正 ${mismatches.length} 題答案
// 生成於 ${new Date().toISOString()}
const admin=require('firebase-admin');
admin.initializeApp({credential:admin.credential.cert(require('./serviceAccountKey.json'))});
const db=admin.firestore();
const fixes=[\n${fixes}\n];
async function run(){
  for(const f of fixes){
    await db.collection('questions').doc(f.id).update({answer:f.ans});
    console.log('✅',f.id,f.old,'→',f.ans);
  }
  console.log('完成！共修正',fixes.length,'題');
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});`;
    fs.writeFileSync('fix_answers.js', script);
    console.log('🔧 修正腳本: fix_answers.js (執行 node fix_answers.js 即可)');
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
