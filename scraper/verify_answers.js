/**
 * verify_answers.js
 * 從官方考古題 PDF 解析標準答案，與 Firestore 題庫進行比對，找出答案有誤的題目
 *
 * 用法：node verify_answers.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');

// ─────────────────────────────────────────────
// 1. Firebase 初始化
// ─────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ 找不到 serviceAccountKey.json');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─────────────────────────────────────────────
// 2. PDF 答案檔案對應表
//    key = Firestore subject 值
//    pdfCode = ANS PDF 檔名中的代碼部分
//    paperCode = 用於比對題目 ID 的試卷代碼
// ─────────────────────────────────────────────
const EXAM_MAP = [
  // 111 年
  {
    year: 111,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0101_綜合法學(一)(憲法).pdf',
    subjects: ['constitutional', 'administrative', 'international_public', 'international_private'],
    subjectQCounts: { constitutional: 25, administrative: 25, international_public: 15, international_private: 10 },
    totalQ: 75,
    paperCode: '0101',
    idPrefix: '111-0101',
  },
  {
    year: 111,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0201_綜合法學(二)(民法.pdf',
    subjects: ['civil', 'civil_procedure'],
    subjectQCounts: { civil: 50, civil_procedure: 30 },
    totalQ: 80,
    paperCode: '0201',
    idPrefix: '111-0201',
  },
  {
    year: 111,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0202_綜合法學(二)(公司.pdf',
    subjects: ['company', 'insurance', 'negotiable_instruments', 'securities', 'enforcement', 'legal_english'],
    subjectQCounts: {},
    totalQ: 80,
    paperCode: '0202',
    idPrefix: '111-0202',
  },
  {
    year: 111,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/111/考畢題答/111120_ANS0301_綜合法學(一)(刑法.pdf',
    subjects: ['criminal', 'criminal_procedure', 'legal_ethics'],
    subjectQCounts: {},
    totalQ: 75,
    paperCode: '0301',
    idPrefix: '111-0301',
  },
  // 112 年
  {
    year: 112,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0101_綜合法學(一)(憲法.pdf',
    subjects: ['constitutional', 'administrative', 'international_public', 'international_private'],
    totalQ: 75,
    paperCode: '0101',
    idPrefix: '112-0101',
  },
  {
    year: 112,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0201_綜合法學(二)(民法.pdf',
    subjects: ['civil', 'civil_procedure'],
    totalQ: 80,
    paperCode: '0201',
    idPrefix: '112-0201',
  },
  {
    year: 112,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0202_綜合法學(二)(公司.pdf',
    subjects: ['company', 'insurance', 'negotiable_instruments', 'securities', 'enforcement', 'legal_english'],
    totalQ: 80,
    paperCode: '0202',
    idPrefix: '112-0202',
  },
  {
    year: 112,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/112/考畢題答/112120_ANS0301_綜合法學(一)(刑法.pdf',
    subjects: ['criminal', 'criminal_procedure', 'legal_ethics'],
    totalQ: 75,
    paperCode: '0301',
    idPrefix: '112-0301',
  },
  // 113 年
  {
    year: 113,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0101_綜合法學(一)(憲法.pdf',
    subjects: ['constitutional', 'administrative', 'international_public', 'international_private'],
    totalQ: 75,
    paperCode: '0101',
    idPrefix: '113-0101',
  },
  {
    year: 113,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',
    subjects: ['civil', 'civil_procedure'],
    totalQ: 80,
    paperCode: '0201',
    idPrefix: '113-0201',
  },
  {
    year: 113,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0202_綜合法學(二)(公司.pdf',
    subjects: ['company', 'insurance', 'negotiable_instruments', 'securities', 'enforcement', 'legal_english'],
    totalQ: 80,
    paperCode: '0202',
    idPrefix: '113-0202',
  },
  {
    year: 113,
    pdfFile: 'D:/AI_Project/Lawyer_test_first/scraper/PastExam/113/考畢題答/113110_ANS0301_綜合法學(一)(刑法.pdf',
    subjects: ['criminal', 'criminal_procedure', 'legal_ethics'],
    totalQ: 75,
    paperCode: '0301',
    idPrefix: '113-0301',
  },
];

// ─────────────────────────────────────────────
// 3. PDF 答案解析函式
//    PDF 格式特點：
//    - 第1題答案單獨在一行
//    - 第2~10 題答案連在一起（9個字母，無空白）
//    - 然後是第11~20（10個字母），以此類推
//    - 最後幾題可能是個別字母
// ─────────────────────────────────────────────
async function parsePdfAnswers(pdfPath, totalQ) {
  const data = fs.readFileSync(pdfPath);
  const result = await pdfParse(data);
  const text = result.text;

  // 找到答案區塊：一般在 "第100題" 之後
  // 策略：抓取所有單獨的 A/B/C/D 字母串
  // 因為格式是：第1題答案單獨，然後每10題一組的答案字串

  const answers = {};

  // 先找第1題的答案（格式：\n第1題\n[ABCD]\n）
  const q1Match = text.match(/第1題\s*\n([ABCD#])\n/);
  if (!q1Match) {
    console.warn(`  ⚠️ 無法找到第1題答案，嘗試備用解析...`);
    return parseFallback(text, totalQ);
  }
  answers[1] = q1Match[1] === '#' ? 'AMENDED' : q1Match[1];

  // 找第13題（如果存在，格式特殊，可能是第13題單獨出現）
  const q13Match = text.match(/第13題\s*\n([ABCD#])\n/);
  if (q13Match) {
    answers[13] = q13Match[1] === '#' ? 'AMENDED' : q13Match[1];
  }

  // 抓取剩餘的連續答案字串（2~12, 14~10的倍數, 末尾）
  // 在 PDF 中，答案連在一起，每組約9或10個字母
  // 策略：抓所有 5個以上連續 [A-D#] 的字串（排除標題和備註）
  const answerBlocks = [];
  const blockPattern = /\n([A-D#]{5,})\n/g;
  let match;
  while ((match = blockPattern.exec(text)) !== null) {
    answerBlocks.push(match[1]);
  }

  // 重組答案序列
  // 第1題 + 第2~10(9個) + 第11~20(10個) + ... + 最後幾題
  // 先合併所有連續字串
  let answerSeq = answerBlocks.join('');
  
  // 處理單獨字母（最後幾題）
  // 找到最後一個答案塊之後的單獨字母
  const lastBlockEnd = text.lastIndexOf(answerBlocks[answerBlocks.length - 1] || '');
  if (lastBlockEnd !== -1 && answerBlocks.length > 0) {
    const afterLastBlock = text.substring(lastBlockEnd + (answerBlocks[answerBlocks.length - 1]?.length || 0));
    const singleLetters = afterLastBlock.match(/\n([A-D#])\n/g);
    if (singleLetters) {
      answerSeq += singleLetters.map(l => l.trim()).join('');
    }
  }

  // 分配題號
  // 題2~10 = answerSeq[0..8] (9個)
  // 題11~20 = answerSeq[9..18] (10個)
  // 以此類推
  let pos = 0;
  // 題2到10（9題）
  for (let q = 2; q <= 10 && pos < answerSeq.length; q++, pos++) {
    answers[q] = answerSeq[pos] === '#' ? 'AMENDED' : answerSeq[pos];
  }
  // 題13（已單獨處理），但如果沒找到，跳過
  // 題11~20（10題，但第13題可能已處理）
  for (let q = 11; q <= 20 && pos < answerSeq.length; q++, pos++) {
    if (q === 13 && answers[13]) continue; // 已單獨處理
    answers[q] = answerSeq[pos] === '#' ? 'AMENDED' : answerSeq[pos];
  }
  // 題21~totalQ（每組10題）
  for (let q = 21; q <= totalQ && pos < answerSeq.length; q++, pos++) {
    answers[q] = answerSeq[pos] === '#' ? 'AMENDED' : answerSeq[pos];
  }

  return answers;
}

// ─────────────────────────────────────────────
// 4. 備用解析：直接從文字中按順序排列所有 A/B/C/D
// ─────────────────────────────────────────────
function parseFallback(text, totalQ) {
  const answers = {};
  // 找到答案區域（在「第100題」出現後的文字）
  const markerIdx = text.search(/第100題|第80題|第75題/);
  const answerRegion = markerIdx !== -1 ? text.substring(markerIdx) : text;
  
  // 提取所有單獨字母行
  const letterPattern = /^\s*([ABCD#])\s*$/gm;
  const letters = [];
  let m;
  while ((m = letterPattern.exec(answerRegion)) !== null) {
    letters.push(m[1]);
  }
  
  // 提取所有連續字母塊
  const blockPat = /([A-D#]{4,})/g;
  const blocks = [];
  while ((m = blockPat.exec(answerRegion)) !== null) {
    blocks.push(m[1]);
  }
  
  // 合併並分配
  const allAnswers = (letters.join('') + blocks.join(''));
  for (let i = 0; i < Math.min(allAnswers.length, totalQ); i++) {
    answers[i + 1] = allAnswers[i] === '#' ? 'AMENDED' : allAnswers[i];
  }
  
  return answers;
}

// ─────────────────────────────────────────────
// 5. 更精確的解析器（基於觀察到的 PDF 格式）
// ─────────────────────────────────────────────
async function parseAnswersAccurate(pdfPath, totalQ) {
  const data = fs.readFileSync(pdfPath);
  const result = await pdfParse(data);
  const text = result.text;
  
  // 找到答案表格開始位置（在題號列表之後）
  // 格式：最後一個 "第100題" 後面跟著連續的答案字串
  
  // 步驟1：找第1題答案（緊接在「第1題」後面單獨一行）
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let q1Answer = null;
  let answerSeqStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '第1題' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (/^[A-D#]$/.test(nextLine)) {
        q1Answer = nextLine;
        // 答案序列從後面的連續字串開始
        // 找第一個長度 >= 5 的全字母行（在 "第100題" 之後附近）
        for (let j = i + 2; j < lines.length; j++) {
          if (/^[A-D#]{5,}$/.test(lines[j])) {
            answerSeqStart = j;
            break;
          }
        }
        break;
      }
    }
  }
  
  if (!q1Answer) {
    console.warn(`  ⚠️ ${path.basename(pdfPath)}: 無法找到第1題答案`);
    q1Answer = '?';
  }

  // 收集所有答案字串塊
  let collectedAnswers = '';
  if (answerSeqStart !== -1) {
    for (let j = answerSeqStart; j < lines.length; j++) {
      if (/^[A-D#]+$/.test(lines[j])) {
        collectedAnswers += lines[j];
      } else if (/^[A-D#]$/.test(lines[j])) {
        collectedAnswers += lines[j];
      }
    }
  }
  
  // 同時找第13題（如果有單獨標記）
  let q13Answer = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '第13題' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (/^[A-D#]$/.test(nextLine)) {
        q13Answer = nextLine;
        break;
      }
    }
  }
  
  // 組合最終答案陣列
  // 格式說明（基於觀察）：
  // 第1題: 單獨
  // 第2-10題: 9個連續字母
  // 第11-20題: 10個連續字母（其中第13題可能單獨出現）
  // 第21-30題: 10個連續字母
  // ...以此類推
  
  const answers = {};
  answers[1] = q1Answer === '#' ? 'AMENDED' : q1Answer;
  
  let pos = 0;
  // 題2~10
  for (let q = 2; q <= 10 && pos < collectedAnswers.length; q++, pos++) {
    answers[q] = collectedAnswers[pos] === '#' ? 'AMENDED' : collectedAnswers[pos];
  }
  // 題11~20（10個，第13題可能重複）
  for (let q = 11; q <= 20 && pos < collectedAnswers.length; q++, pos++) {
    answers[q] = collectedAnswers[pos] === '#' ? 'AMENDED' : collectedAnswers[pos];
  }
  // 覆寫第13題（如果有單獨解析）
  if (q13Answer) {
    answers[13] = q13Answer === '#' ? 'AMENDED' : q13Answer;
  }
  // 題21~totalQ
  for (let q = 21; q <= totalQ && pos < collectedAnswers.length; q++, pos++) {
    answers[q] = collectedAnswers[pos] === '#' ? 'AMENDED' : collectedAnswers[pos];
  }
  
  // 驗證解析結果
  const parsed = Object.keys(answers).length;
  if (parsed < totalQ * 0.9) {
    console.warn(`  ⚠️ 只解析了 ${parsed}/${totalQ} 題答案，結果可能不完整`);
  }
  
  return answers;
}

// ─────────────────────────────────────────────
// 6. 從 Firestore 讀取所有題目
// ─────────────────────────────────────────────
async function fetchAllFirestoreQuestions() {
  console.log('📡 從 Firestore 讀取所有題目...');
  const snapshot = await db.collection('questions').get();
  console.log(`✅ 讀取完成，共 ${snapshot.size} 題`);
  
  const questions = {};
  snapshot.forEach(doc => {
    questions[doc.id] = doc.data();
  });
  return questions;
}

// ─────────────────────────────────────────────
// 7. 主程式：比對答案
// ─────────────────────────────────────────────

// Firestore ID 的各種可能格式
// 例如: 111-2301-civil-1, 111-0101-constitutional-01, etc.
function buildPossibleIds(year, paperCode, questionNum) {
  const num2 = String(questionNum).padStart(2, '0');
  const num = String(questionNum);
  
  // 常見的 ID 格式（根據觀察到的腳本）
  return [
    // 格式1：年份-試卷4碼-科目-題號（不補零）
    // e.g. 111-2301-civil-1
    // 格式2：年份-試卷4碼-科目-題號（補零）
    // 需要試卷碼的不同組合
    
    // 舊式ID（從 data/*.json 推測）：年份-紙碼-科目-題號
    // 試卷碼 0101 -> 2301（憲法+行政法+國際公私法）
    // 試卷碼 0201 -> 2301（民法+民事訴訟法）但代號可能是 3301
    // 試卷碼 0202 -> 3302（公司法等）  
    // 試卷碼 0301 -> 4301（刑法+刑事訴訟法+法律倫理）
  ];
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    司律一試考古題答案驗證工具 (111-113年)         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 先從 Firestore 取得所有題目
  const firestoreQuestions = await fetchAllFirestoreQuestions();
  
  // 建立 ID 索引（依年份+科目+題號）
  const byYearSubjectNum = {};
  for (const [id, q] of Object.entries(firestoreQuestions)) {
    const year = q.year || parseInt(id.split('-')[0]);
    const subject = q.subject || id.split('-')[2];
    const qNum = q.questionNumber || parseInt(id.split('-')[id.split('-').length - 1]);
    
    if (year && subject && qNum) {
      const key = `${year}-${subject}-${qNum}`;
      if (!byYearSubjectNum[key]) byYearSubjectNum[key] = [];
      byYearSubjectNum[key].push({ id, data: q });
    }
  }
  
  // 列出所有 Firestore ID 格式
  const sampleIds = Object.keys(firestoreQuestions).slice(0, 20);
  console.log('📋 Firestore 題目 ID 樣本:');
  sampleIds.forEach(id => console.log(`   ${id}`));
  console.log();

  // 統計結果
  const results = {
    matched: [],
    mismatch: [],
    notInFirestore: [],
    noAnswerInFirestore: [],
  };

  // 處理每個考試的答案 PDF
  for (const exam of EXAM_MAP) {
    console.log(`\n📄 處理 ${exam.year} 年 ${exam.paperCode} 試卷...`);
    
    if (!fs.existsSync(exam.pdfFile)) {
      console.warn(`  ⚠️ 找不到 PDF: ${exam.pdfFile}`);
      continue;
    }

    // 解析 PDF 答案
    let pdfAnswers;
    try {
      pdfAnswers = await parseAnswersAccurate(exam.pdfFile, exam.totalQ);
      const count = Object.keys(pdfAnswers).length;
      console.log(`  ✅ 從 PDF 解析了 ${count}/${exam.totalQ} 題答案`);
      
      // 顯示前10題的答案
      console.log(`  題1-10: ${[1,2,3,4,5,6,7,8,9,10].map(n => pdfAnswers[n] || '?').join('')}`);
    } catch (e) {
      console.error(`  ❌ PDF 解析失敗: ${e.message}`);
      continue;
    }

    // 與 Firestore 比對（用年份直接搜尋）
    const yearStr = String(exam.year);
    
    for (const [id, q] of Object.entries(firestoreQuestions)) {
      const parts = id.split('-');
      if (parts[0] !== yearStr) continue;
      
      // 嘗試提取題號
      const qNum = q.questionNumber || parseInt(parts[parts.length - 1]);
      if (!qNum || qNum < 1 || qNum > exam.totalQ) continue;
      
      // 嘗試匹配到試卷
      // 從 ID 的第2段判斷試卷代碼
      const idPaperCode = parts[1]; // e.g. "2301", "3301", "3302", "4301"
      
      // 試卷碼對應
      const paperCodeMap = {
        '0101': ['2301', '0101'],
        '0201': ['3301', '0201'],
        '0202': ['3302', '0202'],
        '0301': ['4301', '0301'],
      };
      
      const allowedCodes = paperCodeMap[exam.paperCode] || [];
      if (!allowedCodes.includes(idPaperCode)) continue;
      
      const pdfAnswer = pdfAnswers[qNum];
      const firestoreAnswer = q.answer;
      
      if (!pdfAnswer) continue;
      if (pdfAnswer === 'AMENDED') {
        // 官方有更正此題答案，特別標記
        results.matched.push({
          id, qNum, note: '官方曾更正此題答案'
        });
        continue;
      }
      
      if (!firestoreAnswer) {
        results.noAnswerInFirestore.push({ id, qNum, pdfAnswer });
        continue;
      }
      
      if (firestoreAnswer.toUpperCase() === pdfAnswer.toUpperCase()) {
        results.matched.push({ id, qNum, answer: pdfAnswer });
      } else {
        results.mismatch.push({
          id,
          qNum,
          year: exam.year,
          paperCode: exam.paperCode,
          firestoreAnswer,
          pdfAnswer,
          questionText: (q.questionText || '').substring(0, 80) + '...',
        });
      }
    }
  }

  // ─────────────────────────────────────────────
  // 8. 輸出結果報告
  // ─────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 驗證結果報告');
  console.log('═'.repeat(60));
  
  console.log(`\n✅ 答案正確: ${results.matched.length} 題`);
  console.log(`❌ 答案不符: ${results.mismatch.length} 題`);
  console.log(`⚠️  Firestore 無答案欄位: ${results.noAnswerInFirestore.length} 題`);
  
  if (results.mismatch.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('❌ 答案不符的題目（需要修正）：');
    console.log('─'.repeat(60));
    for (const m of results.mismatch) {
      console.log(`\n📌 ID: ${m.id}`);
      console.log(`   題號: 第 ${m.qNum} 題`);
      console.log(`   Firebase 答案: ${m.firestoreAnswer}   官方答案: ${m.pdfAnswer}  ← 應改為 ${m.pdfAnswer}`);
      console.log(`   題目: ${m.questionText}`);
    }
  }
  
  if (results.noAnswerInFirestore.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('⚠️  Firestore 中無 answer 欄位（這些題目PDF答案供參考）：');
    console.log('─'.repeat(60));
    for (const m of results.noAnswerInFirestore) {
      console.log(`  ${m.id} (題${m.qNum}): 官方答案=${m.pdfAnswer}`);
    }
  }

  // 輸出 JSON 報告
  const reportPath = path.join(__dirname, 'verify_report.json');
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMatched: results.matched.length,
      totalMismatch: results.mismatch.length,
      totalNoAnswer: results.noAnswerInFirestore.length,
    },
    mismatches: results.mismatch,
    noAnswer: results.noAnswerInFirestore,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 詳細報告已儲存: ${reportPath}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 執行錯誤:', err);
  process.exit(1);
});
