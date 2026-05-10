/**
 * verify_answers_v2.js
 * 精確版：從官方考古題 PDF 解析標準答案，與 Firestore 題庫進行比對
 *
 * Firestore 試卷代碼對應：
 *   1301 = 刑法+刑訴+法律倫理  ← PDF 0301
 *   2301 = 憲法+行政法+國際公私法 ← PDF 0101
 *   3301 = 民法+民事訴訟法      ← PDF 0201
 *   4301 = 公司法+保險+票據+證交+強執+英文 ← PDF 0202
 *
 * 題號問題：
 *   Firestore 的 questionNumber 就是該試卷的題號（1開始）
 *   直接對應 PDF 的題號
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');

// ─────────────────────────────────────────────
// Firebase 初始化
// ─────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─────────────────────────────────────────────
// 試卷對應表（PDF 代碼 → Firestore 代碼）
// ─────────────────────────────────────────────
const PAPER_MAP = {
  '0101': '2301',  // 憲法+行政法+國際公私法
  '0201': '3301',  // 民法+民事訴訟法
  '0202': '4301',  // 公司法等
  '0301': '1301',  // 刑法+刑訴+法律倫理
};

const PDF_FILES = {
  111: {
    '0101': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0101_綜合法學(一)(憲法).pdf',
    '0201': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0301_綜合法學(一)(刑法.pdf',
  },
  112: {
    '0101': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0101_綜合法學(一)(憲法.pdf',
    '0201': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0301_綜合法學(一)(刑法.pdf',
  },
  113: {
    '0101': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0101_綜合法學(一)(憲法.pdf',
    '0201': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',
    '0202': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0202_綜合法學(二)(公司.pdf',
    '0301': 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0301_綜合法學(一)(刑法.pdf',
  },
};

// ─────────────────────────────────────────────
// PDF 答案解析（精確版）
// 格式：第1題答案單獨一行，後面接連續字母串（每10題一組）
// ─────────────────────────────────────────────
async function parsePdfAnswers(pdfPath) {
  const data = fs.readFileSync(pdfPath);
  const result = await pdfParse(data);
  const text = result.text;
  
  const lines = text.split('\n').map(l => l.trim());
  
  // 找第1題的答案位置
  let q1Idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '第1題' && i + 1 < lines.length && /^[A-D#]$/.test(lines[i+1])) {
      q1Idx = i;
      break;
    }
  }
  
  if (q1Idx === -1) {
    throw new Error(`無法找到第1題答案標記`);
  }
  
  const q1Answer = lines[q1Idx + 1];
  
  // 從第1題後面找所有答案字串
  // 期望格式：
  // - 第1題 → 單一字母
  // - 第2~10題 → 9個字母連在一起
  // - 第11~20題 → 10個字母
  // - ... 以此類推
  // - 最後幾題可能也是單個字母
  
  // 先收集所有在第1題之後出現的字母串（長度>=2的連續字母）
  let allAnswerStr = '';
  let collectingAnswers = false;
  let singleLetterBuffer = '';
  
  for (let i = q1Idx + 2; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-D#]{2,}$/.test(line)) {
      // 如果有單個字母緩衝，先加進去
      allAnswerStr += singleLetterBuffer + line;
      singleLetterBuffer = '';
      collectingAnswers = true;
    } else if (/^[A-D#]$/.test(line) && (collectingAnswers || i > q1Idx + 3)) {
      // 單個字母（可能是末尾幾題）
      singleLetterBuffer += line;
    } else if (line === '複選題數：' || line.includes('複選題數')) {
      // 已到答案表結尾
      allAnswerStr += singleLetterBuffer;
      break;
    } else {
      // 非答案行，若已開始收集，把單字母緩衝加進去
      if (collectingAnswers && singleLetterBuffer) {
        allAnswerStr += singleLetterBuffer;
        singleLetterBuffer = '';
      }
    }
  }
  if (singleLetterBuffer) allAnswerStr += singleLetterBuffer;
  
  // 建立題號→答案的對應
  // 結構：第1題單獨，然後：
  //   answerStr[0..8]  = 題2~10（9題）
  //   answerStr[9..18] = 題11~20（10題）
  //   answerStr[19..28] = 題21~30
  //   ... etc.
  const answers = {};
  answers[1] = q1Answer;
  
  let pos = 0;
  // 題2~10（9題）
  for (let q = 2; q <= 10; q++) {
    if (pos < allAnswerStr.length) {
      answers[q] = allAnswerStr[pos++];
    }
  }
  // 題11以後（每10題一組）
  let q = 11;
  while (pos < allAnswerStr.length) {
    answers[q] = allAnswerStr[pos++];
    q++;
  }
  
  return answers;
}

// ─────────────────────────────────────────────
// 主程式
// ─────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  司律一試考古題答案驗證工具 v2 (111-113年)        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 從 Firestore 讀取所有題目
  console.log('📡 從 Firestore 讀取所有題目...');
  const snapshot = await db.collection('questions').get();
  console.log(`✅ 共 ${snapshot.size} 題\n`);
  
  // 建立索引：{year}-{fsCode}-{qNum} → {id, answer}
  const fsIndex = {};
  const noAnswerDocs = []; // 追蹤哪些沒有 answer 欄位
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const parts = id.split('-');
    const year = parseInt(parts[0]);
    const fsCode = parts[1]; // e.g. '2301', '1301' etc.
    const qNum = data.questionNumber || parseInt(parts[parts.length - 1]);
    
    const key = `${year}-${fsCode}-${qNum}`;
    fsIndex[key] = { id, answer: data.answer, subject: data.subject, questionText: data.questionText };
    
    if (!data.answer) {
      noAnswerDocs.push({ id, subject: data.subject, qNum });
    }
  });
  
  // 驗證結果
  const mismatches = [];
  const matched = [];
  const notFound = [];
  const amendedInPdf = [];

  // 逐年、逐試卷處理
  for (const year of [111, 112, 113]) {
    for (const [pdfCode, fsCode] of Object.entries(PAPER_MAP)) {
      const pdfFile = PDF_FILES[year][pdfCode];
      const label = `${year}年-${pdfCode}(→Firestore:${fsCode})`;
      
      process.stdout.write(`\n📄 ${label}... `);
      
      if (!fs.existsSync(pdfFile)) {
        console.log('⚠️  PDF 不存在，跳過');
        continue;
      }
      
      let pdfAnswers;
      try {
        pdfAnswers = await parsePdfAnswers(pdfFile);
      } catch (e) {
        console.log(`❌ 解析失敗: ${e.message}`);
        continue;
      }
      
      const parsedCount = Object.keys(pdfAnswers).length;
      console.log(`PDF解析${parsedCount}題`);
      
      // 前10題答案預覽
      const preview = [1,2,3,4,5,6,7,8,9,10].map(n => pdfAnswers[n] || '?').join('');
      console.log(`    前10題: ${preview}`);
      
      // 比對每一題
      for (const [qNumStr, pdfAnswer] of Object.entries(pdfAnswers)) {
        const qNum = parseInt(qNumStr);
        const key = `${year}-${fsCode}-${qNum}`;
        const fsDoc = fsIndex[key];
        
        // 標記為 '#' 表示官方曾更正
        if (pdfAnswer === '#' || pdfAnswer === 'AMENDED') {
          amendedInPdf.push({ year, pdfCode, fsCode, qNum, key });
          continue;
        }
        
        if (!fsDoc) {
          // 在 Firestore 中找不到這題
          notFound.push({ year, pdfCode, fsCode, qNum, key, pdfAnswer });
          continue;
        }
        
        if (!fsDoc.answer) {
          // Firestore 有這題但沒有 answer 欄位
          continue; // 已在 noAnswerDocs 統計
        }
        
        if (fsDoc.answer.toUpperCase() === pdfAnswer.toUpperCase()) {
          matched.push({ id: fsDoc.id, qNum, answer: pdfAnswer });
        } else {
          mismatches.push({
            id: fsDoc.id,
            year,
            pdfCode,
            fsCode,
            qNum,
            subject: fsDoc.subject,
            firestoreAnswer: fsDoc.answer,
            officialAnswer: pdfAnswer,
            questionText: (fsDoc.questionText || '').substring(0, 100),
          });
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // 輸出報告
  // ─────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(65));
  console.log('📊 驗證結果總覽');
  console.log('═'.repeat(65));
  console.log(`✅ 答案正確: ${matched.length} 題`);
  console.log(`❌ 答案不符（需修正）: ${mismatches.length} 題`);
  console.log(`🔍 Firestore 無對應題目: ${notFound.length} 題（題目ID可能格式不同）`);
  console.log(`⚠️  Firestore 無 answer 欄位: ${noAnswerDocs.length} 題`);
  console.log(`📝 PDF中標記有更正: ${amendedInPdf.length} 題`);

  if (mismatches.length > 0) {
    console.log('\n' + '─'.repeat(65));
    console.log('❌ 以下題目 Firebase 中的答案與官方不符（需要修正）：');
    console.log('─'.repeat(65));
    
    // 按年份+試卷分組
    const grouped = {};
    for (const m of mismatches) {
      const gkey = `${m.year}年-${m.pdfCode}`;
      if (!grouped[gkey]) grouped[gkey] = [];
      grouped[gkey].push(m);
    }
    
    for (const [gkey, items] of Object.entries(grouped).sort()) {
      console.log(`\n【${gkey}】`);
      for (const m of items.sort((a,b) => a.qNum - b.qNum)) {
        console.log(`  第${String(m.qNum).padStart(2,'0')}題 [${m.id}]`);
        console.log(`    科目: ${m.subject}`);
        console.log(`    Firebase答案: ❌ ${m.firestoreAnswer}  →  官方正解: ✅ ${m.officialAnswer}`);
        if (m.questionText) console.log(`    題目: ${m.questionText}...`);
      }
    }
  }
  
  if (notFound.length > 0 && notFound.length < 50) {
    console.log('\n' + '─'.repeat(65));
    console.log('🔍 PDF中有答案但Firestore無對應的題目（ID格式可能不同）：');
    for (const n of notFound.sort((a,b) => a.year - b.year || a.qNum - b.qNum).slice(0, 30)) {
      console.log(`  ${n.year}-${n.fsCode}-${n.qNum} (答案:${n.pdfAnswer})`);
    }
  }

  // 儲存 JSON 報告
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      matched: matched.length,
      mismatches: mismatches.length,
      notFoundInFirestore: notFound.length,
      noAnswerField: noAnswerDocs.length,
      amendedInPdf: amendedInPdf.length,
    },
    mismatches: mismatches.map(m => ({
      ...m,
      fix: `db.collection('questions').doc('${m.id}').update({ answer: '${m.officialAnswer}' })`
    })),
    notFoundInFirestore: notFound,
  };
  
  const reportPath = path.join(__dirname, 'verify_report_v2.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n\n📄 JSON 報告已儲存: ${reportPath}`);
  
  // 如果有不符，生成修正腳本
  if (mismatches.length > 0) {
    let fixScript = `/**\n * fix_answers.js - 自動修正 Firestore 中答案錯誤的題目\n * 生成時間: ${new Date().toISOString()}\n */\nconst admin = require('firebase-admin');\nconst serviceAccount = require('./serviceAccountKey.json');\nadmin.initializeApp({ credential: admin.credential.cert(serviceAccount) });\nconst db = admin.firestore();\n\nconst fixes = [\n`;
    for (const m of mismatches) {
      fixScript += `  { id: '${m.id}', oldAnswer: '${m.firestoreAnswer}', newAnswer: '${m.officialAnswer}', subject: '${m.subject}', qNum: ${m.qNum} },\n`;
    }
    fixScript += `];\n\nasync function fix() {\n  console.log('開始修正 ' + fixes.length + ' 題答案...');\n  let count = 0;\n  for (const f of fixes) {\n    await db.collection('questions').doc(f.id).update({ answer: f.newAnswer });\n    count++;\n    console.log(\`✅ [\${count}/\${fixes.length}] \${f.id}: \${f.oldAnswer} → \${f.newAnswer}\`);\n  }\n  console.log('\\n🎉 全部修正完成！');\n  process.exit(0);\n}\nfix().catch(e => { console.error(e); process.exit(1); });\n`;
    
    const fixPath = path.join(__dirname, 'fix_answers.js');
    fs.writeFileSync(fixPath, fixScript, 'utf-8');
    console.log(`🔧 修正腳本已生成: ${fixPath}`);
    console.log(`   執行 node fix_answers.js 即可自動修正 Firestore 中的錯誤答案`);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 執行錯誤:', err);
  process.exit(1);
});
