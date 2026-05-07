/**
 * parse.js - PDF 解析 & 分批 Prompt 生成器
 * 
 * 用法：
 *   node parse.js --year 113           解析指定年份並生成 Prompt
 *   node parse.js --year 113 --batch 30 指定每批題數 (預設 30)
 */
const fs = require('fs');
const path = require('path');

const registry = require('./exam-registry.json');

// 解析命令列參數
const args = process.argv.slice(2);
let targetYear = null;
let batchSize = 30;

if (args.includes('--year')) {
  targetYear = parseInt(args[args.indexOf('--year') + 1]);
}
if (args.includes('--batch')) {
  batchSize = parseInt(args[args.indexOf('--batch') + 1]);
}

if (!targetYear) {
  console.log('用法：node parse.js --year 113 [--batch 30]');
  process.exit(0);
}

/**
 * 使用 pdfjs-dist 解析 PDF 文字
 */
async function extractPdfText(pdfPath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    // 用換行符分隔每一頁
    const pageText = textContent.items.map(item => item.str).join('');
    fullText += pageText + '\n\n';
  }
  return fullText;
}

/**
 * 產生 Gemini Prompt 的共用指令前綴
 */
function getSystemPrompt(rocYear, paperName, batchNum, totalBatches) {
  return `你是一位精通台灣法律的法學專家與工程師。
以下是 ${rocYear} 年司律一試「${paperName}」的考題與官方標準答案。
這是第 ${batchNum}/${totalBatches} 批。

**你的任務：**
1. 閱讀以下的【原始試題文字】與【官方解答文字】。
2. 將每一題正確對應上官方答案（注意：解答區的格式是以 10 題一組排列的英文字母，例如「ADDDADDDA」代表第 2~10 題的答案）。
3. 為每一題加上 1~3 個「法學觀念標籤 (tags)」（例如："言論自由", "權力分立", "傳聞法則" 等具體法理概念）。
4. 為每一題生成 50~100 字的精確「詳解 (explanation)」，引用具體法規或大法官解釋。
5. 輸出為「單一陣列的 JSON 格式」。

**JSON 格式 (嚴格遵守)：**
\`\`\`json
[
  {
    "id": "${rocYear}-paperCode-subject-01",
    "year": ${rocYear},
    "subject": "constitutional",
    "questionNumber": 1,
    "questionText": "完整題目文字...",
    "options": {
      "A": "選項A完整文字",
      "B": "選項B完整文字",
      "C": "選項C完整文字",
      "D": "選項D完整文字"
    },
    "answer": "C",
    "explanation": "依據釋字第744號...",
    "tags": ["言論自由", "事前審查"]
  }
]
\`\`\`

**科目代碼對照表 (subject 欄位)：**
- constitutional = 憲法
- administrative = 行政法
- criminal = 刑法
- criminal_procedure = 刑事訴訟法
- civil = 民法
- civil_procedure = 民事訴訟法
- company = 公司法
- insurance = 保險法
- negotiable_instruments = 票據法
- securities = 證券交易法
- enforcement = 強制執行法
- international_public = 國際公法
- international_private = 國際私法
- legal_ethics = 法律倫理
- legal_english = 法學英文

**注意事項：**
- id 格式：年度-試卷代碼-科目-兩位數題號（如 ${rocYear}-301-constitutional-01）
- 請根據題目內容判斷科目（subject），而非試卷名稱
- 只輸出 JSON 陣列，不要其他文字！

`;
}

async function main() {
  const examInfo = registry.exams.find(e => e.rocYear === targetYear);
  if (!examInfo) {
    console.error(`❌ 找不到 ${targetYear} 年的考試資料`);
    process.exit(1);
  }

  const yearDir = path.join(__dirname, 'pdfs', String(targetYear));
  const promptDir = path.join(__dirname, 'prompts', String(targetYear));

  if (!fs.existsSync(yearDir)) {
    console.error(`❌ 找不到 ${yearDir}，請先執行 download.js`);
    process.exit(1);
  }
  if (!fs.existsSync(promptDir)) {
    fs.mkdirSync(promptDir, { recursive: true });
  }

  console.log(`🔍 開始解析 ${targetYear} 年考題...\n`);

  let totalPrompts = 0;

  for (const paper of examInfo.papers) {
    const qFile = path.join(yearDir, `${paper.code}_questions.pdf`);
    const aFile = path.join(yearDir, `${paper.code}_answers.pdf`);

    if (!fs.existsSync(qFile)) {
      console.warn(`⚠️ 找不到試題 PDF: ${paper.code}_questions.pdf，跳過`);
      continue;
    }

    console.log(`📄 解析試卷 ${paper.code}: ${paper.name}`);

    // 解析試題 PDF
    let questionText = '';
    try {
      questionText = await extractPdfText(qFile);
      console.log(`  ✅ 試題文字萃取成功 (${questionText.length} 字)`);
    } catch (e) {
      console.error(`  ❌ 試題 PDF 解析失敗: ${e.message}`);
      continue;
    }

    // 解析答案 PDF
    let answerText = '（無答案檔案）';
    if (fs.existsSync(aFile)) {
      try {
        answerText = await extractPdfText(aFile);
        console.log(`  ✅ 答案文字萃取成功 (${answerText.length} 字)`);
      } catch (e) {
        console.warn(`  ⚠️ 答案 PDF 解析失敗: ${e.message}`);
      }
    }

    // 解析更正答案 PDF (如果存在)
    const mFile = path.join(yearDir, `${paper.code}_corrected.pdf`);
    let correctedText = '';
    if (fs.existsSync(mFile)) {
      try {
        correctedText = await extractPdfText(mFile);
        console.log(`  ℹ️ 有更正答案`);
      } catch (e) { /* 忽略 */ }
    }

    // 將文字按大致題數切分成批次
    // 粗略估計：每題約 200-400 字，30 題約 6000-12000 字
    const chunkSize = batchSize * 400; // 每批最多約 12000 字
    const totalChunks = Math.max(1, Math.ceil(questionText.length / chunkSize));

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, questionText.length);
      
      // 嘗試在題目邊界上切分（找最近的題號標記）
      let actualEnd = end;
      if (end < questionText.length) {
        // 從 end 位置往前找題號模式，避免切在題目中間
        const searchRegion = questionText.substring(Math.max(0, end - 200), end + 200);
        const match = searchRegion.match(/\d{1,3}\s*[關於依下列有關]/);
        if (match) {
          actualEnd = end - 200 + searchRegion.indexOf(match[0]);
        }
      }

      const chunkText = questionText.substring(start, actualEnd);
      const batchNum = i + 1;

      const prompt = getSystemPrompt(targetYear, paper.name, batchNum, totalChunks)
        + `--- 以下是原始資料 ---\n\n`
        + `>>> 【官方解答文字】 <<<\n${answerText}\n`
        + (correctedText ? `\n>>> 【更正答案】 <<<\n${correctedText}\n` : '')
        + `\n>>> 【原始試題文字 - 第 ${batchNum}/${totalChunks} 批】 <<<\n${chunkText}\n`;

      const promptFile = path.join(promptDir, `${paper.code}_batch${batchNum}.txt`);
      fs.writeFileSync(promptFile, prompt, 'utf-8');
      totalPrompts++;
      console.log(`  📝 生成 Prompt: ${paper.code}_batch${batchNum}.txt (${(prompt.length/1024).toFixed(1)} KB)`);
    }
  }

  console.log(`\n🎉 ${targetYear} 年解析完成！共生成 ${totalPrompts} 個 Prompt 檔案`);
  console.log(`📁 位置: ${promptDir}`);
  console.log(`\n👉 下一步：`);
  console.log(`   1. 開啟 prompts/${targetYear}/ 目錄`);
  console.log(`   2. 依序將每個 .txt 的內容複製貼上到 Gemini Web (https://gemini.google.com/app?hl=zh-TW)`);
  console.log(`   3. 將 Gemini 回傳的 JSON 存到 ai_results/${targetYear}/ 目錄（檔名對應 batch 名）`);
  console.log(`   4. 執行 node merge.js --year ${targetYear} 彙整結果`);
}

main().catch(console.error);
