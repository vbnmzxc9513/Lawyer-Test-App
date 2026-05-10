/**
 * fix_all_answers.js - 綜合修正腳本
 * 
 * 策略：
 *  - 使用本地官方答案PDF (Method 1解析) 作為唯一真相來源
 *  - 對-3301民法試卷執行全量覆寫（因確認整體偏移1題）
 *  - 對其他試卷僅修正有差異的題目
 *  - DRY RUN 模式：先顯示所有修改，不實際寫入
 * 
 * 用法：
 *   node fix_all_answers.js --dry-run   (只看報告，不寫入)
 *   node fix_all_answers.js --confirm   (確認後寫入)
 *   node fix_all_answers.js --paper 111-0201 --confirm (只修正指定試卷)
 */
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const isDryRun = !process.argv.includes('--confirm');
const targetPaper = process.argv.includes('--paper')
  ? process.argv[process.argv.indexOf('--paper') + 1]
  : null;

const PDF_FILES = {
  '111-0101': 'PastExam/111/考畢題答/111120_ANS0101_綜合法學(一)(憲法).pdf',
  '111-0201': 'PastExam/111/考畢題答/111120_ANS0201_綜合法學(二)(民法.pdf',
  '111-0202': 'PastExam/111/考畢題答/111120_ANS0202_綜合法學(二)(公司.pdf',
  '111-0301': 'PastExam/111/考畢題答/111120_ANS0301_綜合法學(一)(刑法.pdf',
  '112-0101': 'PastExam/112/考畢題答/112120_ANS0101_綜合法學(一)(憲法.pdf',
  '112-0201': 'PastExam/112/考畢題答/112120_ANS0201_綜合法學(二)(民法.pdf',
  '112-0202': 'PastExam/112/考畢題答/112120_ANS0202_綜合法學(二)(公司.pdf',
  '112-0301': 'PastExam/112/考畢題答/112120_ANS0301_綜合法學(一)(刑法.pdf',
  '113-0101': 'PastExam/113/考畢題答/113110_ANS0101_綜合法學(一)(憲法.pdf',
  '113-0201': 'PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',
  '113-0202': 'PastExam/113/考畢題答/113110_ANS0202_綜合法學(二)(公司.pdf',
  '113-0301': 'PastExam/113/考畢題答/113110_ANS0301_綜合法學(一)(刑法.pdf',
};

const FS_CODE = { '0101': '2301', '0201': '3301', '0202': '4301', '0301': '1301' };
const TOTAL_Q = { '0101': 75, '0201': 80, '0202': 70, '0301': 75 };

// Method 1: 從PDF解析所有答案（已確認為正確方法）
async function parsePdfMethod1(pdfPath, totalQ) {
  const buf = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buf);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 找第1題答案
  let q1 = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '第1題' && i + 1 < lines.length && /^[A-D]$/.test(lines[i + 1])) {
      q1 = lines[i + 1];
      break;
    }
  }

  // 收集所有答案塊（2個字母以上的純字母行）
  const blocks = [];
  let inZone = false;
  for (const line of lines) {
    if (/^[A-D#]{2,}$/.test(line)) { blocks.push(line); inZone = true; }
    else if (/^[A-D#]$/.test(line) && (inZone || blocks.length > 0)) blocks.push(line);
    else if (inZone && line.includes('複選')) break;
  }

  // 串接：Q1 + 所有塊
  const seq = (q1 || '') + blocks.join('');
  const answers = {};
  for (let i = 0; i < Math.min(seq.length, totalQ); i++) {
    const ch = seq[i];
    answers[i + 1] = (ch === '#') ? null : ch; // # 表示更正，暫時跳過
  }
  return answers;
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(isDryRun
    ? '🔍 DRY RUN 模式 - 只顯示差異，不修改資料庫'
    : '⚡ EXECUTE 模式 - 將修改 Firestore');
  if (targetPaper) console.log(`📌 只處理試卷: ${targetPaper}`);
  console.log('═'.repeat(60));

  // 讀取 Firestore
  console.log('\n📡 讀取 Firestore...');
  const snap = await db.collection('questions').get();
  console.log(`✅ 共 ${snap.size} 題\n`);

  const fsIdx = {};
  snap.forEach(doc => {
    const d = doc.data();
    const parts = doc.id.split('-');
    const year = parseInt(parts[0]), fsCode = parts[1];
    const qNum = d.questionNumber || parseInt(parts[parts.length - 1]);
    fsIdx[`${year}-${fsCode}-${qNum}`] = { id: doc.id, answer: d.answer };
  });

  // 整理要修改的清單
  const toFix = []; // { id, oldAnswer, newAnswer, year, paper, qNum }

  const papers = Object.keys(PDF_FILES);
  for (const paperKey of papers) {
    if (targetPaper && paperKey !== targetPaper) continue;

    const [yearStr, pdfCode] = paperKey.split('-');
    const year = parseInt(yearStr);
    const fsCode = FS_CODE[pdfCode];
    const totalQ = TOTAL_Q[pdfCode];

    process.stdout.write(`📄 ${paperKey}... `);
    const pdfAns = await parsePdfMethod1(PDF_FILES[paperKey], totalQ);
    const got = Object.keys(pdfAns).filter(k => pdfAns[k]).length;
    process.stdout.write(`PDF解析${got}題 `);

    let diffCount = 0;
    for (let q = 1; q <= totalQ; q++) {
      const pdfAnswer = pdfAns[q];
      if (!pdfAnswer) continue; // 跳過 # 題

      const key = `${year}-${fsCode}-${q}`;
      const fsDoc = fsIdx[key];
      if (!fsDoc) continue; // 題目不在Firestore，跳過（不是修正任務）
      if (!fsDoc.answer) continue; // 沒有answer欄位

      if (fsDoc.answer.toUpperCase() !== pdfAnswer.toUpperCase()) {
        toFix.push({ id: fsDoc.id, oldAnswer: fsDoc.answer, newAnswer: pdfAnswer, year, paper: paperKey, qNum: q });
        diffCount++;
      }
    }
    console.log(`→ 差異${diffCount}題`);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 總計需修正: ${toFix.length} 題`);

  // 按試卷分組顯示
  const grouped = {};
  toFix.forEach(f => { (grouped[f.paper] = grouped[f.paper] || []).push(f); });
  for (const [paper, items] of Object.entries(grouped).sort()) {
    console.log(`\n【${paper}】 ${items.length}題`);
    items.sort((a, b) => a.qNum - b.qNum).forEach(f => {
      console.log(`  Q${String(f.qNum).padStart(2, '0')} [${f.id}]: ${f.oldAnswer} → ${f.newAnswer}`);
    });
  }

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN 完成。執行以下指令實際修改:');
    if (targetPaper) {
      console.log(`   node fix_all_answers.js --paper ${targetPaper} --confirm`);
    } else {
      console.log(`   node fix_all_answers.js --confirm`);
    }
    console.log('\n💡 建議先逐一試卷確認，例如：');
    console.log('   node fix_all_answers.js --paper 111-0101 --confirm');
    process.exit(0);
  }

  // ── 實際寫入 ──
  console.log(`\n⚠️  即將修正 ${toFix.length} 題答案...`);
  console.log('5秒後自動執行（Ctrl+C 取消）');
  await new Promise(r => setTimeout(r, 5000));

  let count = 0;
  // Batch write (每次最多500筆)
  let batch = db.batch();
  let batchCount = 0;

  for (const f of toFix) {
    const ref = db.collection('questions').doc(f.id);
    batch.update(ref, { answer: f.newAnswer });
    batchCount++;
    count++;

    if (batchCount === 400) {
      await batch.commit();
      console.log(`  ✅ 已提交 ${count}/${toFix.length} 題...`);
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 完成！共修正 ${count} 題答案`);

  // 儲存修正紀錄
  const log = { executedAt: new Date().toISOString(), fixes: toFix };
  fs.writeFileSync('fix_log.json', JSON.stringify(log, null, 2));
  console.log('📄 修正紀錄: fix_log.json');

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
