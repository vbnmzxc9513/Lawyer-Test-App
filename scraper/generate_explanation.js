/**
 * generate_explanation.js - AI 詳解生成器
 * 
 * 使用 Gemini 3 Pro 為已建檔的考題生成「由核心理念出發」的結構化詳解。
 * 
 * 用法：
 *   node generate_explanation.js --id 113-2301-constitutional-01   生成單題詳解（測試用）
 *   node generate_explanation.js --year 113                         生成整年詳解
 *   node generate_explanation.js --year 113 --subject constitutional 生成特定科目詳解
 *   node generate_explanation.js --year 113 --upload                生成後直接上傳 Firestore
 */
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// ---- 設定 ----
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash'; // 額度充裕的模型，正式生成建議改回 gemini-2.5-pro

if (!GEMINI_API_KEY) {
  console.error('❌ 請設定環境變數 GEMINI_API_KEY');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---- 解析命令列參數 ----
const args = process.argv.slice(2);
let targetId = null;
let targetYear = null;
let targetSubject = null;
let shouldUpload = args.includes('--upload');

if (args.includes('--id')) {
  targetId = args[args.indexOf('--id') + 1];
}
if (args.includes('--year')) {
  targetYear = parseInt(args[args.indexOf('--year') + 1]);
}
if (args.includes('--subject')) {
  targetSubject = args[args.indexOf('--subject') + 1];
}

if (!targetId && !targetYear) {
  console.log('用法：');
  console.log('  node generate_explanation.js --id 113-2301-constitutional-01   單題測試');
  console.log('  node generate_explanation.js --year 113                         整年生成');
  console.log('  node generate_explanation.js --year 113 --subject constitutional 特定科目');
  console.log('  加上 --upload 可在生成後直接上傳 Firestore');
  process.exit(0);
}

/**
 * 核心 Prompt：引導 AI 以「底層法理教學」的方式撰寫詳解
 */
function buildExplanationPrompt(question) {
  return `你是一位資深的台灣司律考試補習班名師，擅長引導考生從「核心法理」出發，真正理解每一題背後的邏輯，而非死記硬背。

## 你的教學哲學
- **先講核心理念**：每題背後都有一個（或少數幾個）底層的法律原則或憲法精神。先把這個「根」找出來。
- **再展開邏輯推演**：從核心理念出發，告訴考生「為什麼正確答案是對的」以及「為什麼錯誤選項是錯的」。
- **最後做歸納**：用一句話幫考生記住這題的關鍵判斷依據，讓他看到類似題目時能立刻聯想到。

## 你的任務
請針對以下這道 ${question.year} 年司律一試考題撰寫詳解。

**題目：**
${question.questionText}

**選項：**
(A) ${question.options.A}
(B) ${question.options.B}
(C) ${question.options.C}
(D) ${question.options.D}

**正確答案：${question.answer}**

## 詳解輸出格式（嚴格遵守此 JSON）
請輸出以下 JSON，不要輸出其他文字：

\`\`\`json
{
  "coreConcept": "本題的核心法理名稱（例如：基本國策的規範效力、人身自由的制度性保障等）",
  "coreExplanation": "用 2~3 句話說明這個核心法理的內涵，讓考生理解最底層的邏輯基礎。",
  "optionAnalysis": {
    "A": "說明為何 A 選項正確/錯誤，從核心理念推演。",
    "B": "說明為何 B 選項正確/錯誤，從核心理念推演。",
    "C": "說明為何 C 選項正確/錯誤，從核心理念推演。",
    "D": "說明為何 D 選項正確/錯誤，從核心理念推演。"
  },
  "keyTakeaway": "一句話歸納：看到○○類型的題目，關鍵判斷依據是△△。",
  "relatedArticles": ["相關法條或大法官解釋編號，例如：憲法第141條、釋字第xxx號"]
}
\`\`\`

**重要提醒：**
- 只輸出 JSON，不要用 markdown 包裹（不要加 \`\`\`json）
- coreConcept 要精準點出一個核心法理，不要過於籠統
- optionAnalysis 每個選項的分析要具體援引法條或解釋
- keyTakeaway 要簡短有力，像是考前衝刺的口訣
`;
}

/**
 * 呼叫 Gemini API 生成詳解（含自動重試）
 */
async function generateExplanation(question, maxRetries = 3) {
  const prompt = buildExplanationPrompt(question);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      });

      let text = response.text.trim();
      
      // 清理可能的 markdown 包裹
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
        throw new Error('無法解析 AI 回傳的 JSON');
      }
    } catch (err) {
      const msg = err.message || '';
      if ((msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && attempt < maxRetries) {
        const waitSec = 15 * attempt; // 15s, 30s, 45s
        process.stdout.write(` ⏳ 限速中，等待 ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw err;
    }
  }
}

/**
 * 載入題庫資料
 */
function loadQuestions() {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_complete.json'));
  let all = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    all = all.concat(data);
  }
  return all;
}

/**
 * 主程式
 */
async function main() {
  const questions = loadQuestions();
  console.log(`📚 已載入 ${questions.length} 題\n`);

  let targets = [];

  if (targetId) {
    // 單題模式
    const q = questions.find(q => q.id === targetId);
    if (!q) {
      console.error(`❌ 找不到題目 ID: ${targetId}`);
      console.log('可用的前 5 個 ID:', questions.slice(0, 5).map(q => q.id).join(', '));
      process.exit(1);
    }
    targets = [q];
  } else {
    // 整年/科目模式
    targets = questions.filter(q => q.year === targetYear);
    if (targetSubject) {
      targets = targets.filter(q => q.subject === targetSubject);
    }
  }

  console.log(`🎯 準備生成 ${targets.length} 題詳解 (模型: ${MODEL_NAME})\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const q = targets[i];
    process.stdout.write(`  [${i + 1}/${targets.length}] ${q.id} ...`);

    try {
      const explanation = await generateExplanation(q);
      q.explanation = explanation;
      results.push(q);
      successCount++;
      console.log(` ✅ 核心概念: ${explanation.coreConcept}`);
    } catch (e) {
      failCount++;
      console.log(` ❌ ${e.message}`);
    }

    // API 節流：每題間隔 2 秒
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 儲存結果
  const outDir = path.join(__dirname, 'data', 'explanations');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = targetId
    ? path.join(outDir, `${targetId}.json`)
    : path.join(outDir, `${targetYear}${targetSubject ? '_' + targetSubject : ''}_explanations.json`);

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\n🎉 完成！成功 ${successCount} 題，失敗 ${failCount} 題`);
  console.log(`📁 結果儲存於: ${outFile}`);

  // 如果是單題模式，直接輸出結果方便預覽
  if (targetId && results.length > 0) {
    console.log('\n--- 詳解預覽 ---');
    const exp = results[0].explanation;
    console.log(`\n🔑 核心概念: ${exp.coreConcept}`);
    console.log(`📖 核心說明: ${exp.coreExplanation}`);
    console.log('\n📋 選項分析:');
    Object.entries(exp.optionAnalysis).forEach(([key, val]) => {
      const isAnswer = key === results[0].answer;
      console.log(`  ${isAnswer ? '✅' : '  '} (${key}) ${val}`);
    });
    console.log(`\n💡 考試口訣: ${exp.keyTakeaway}`);
    console.log(`📜 相關法條: ${exp.relatedArticles.join('、')}`);
  }

  // 上傳到 Firestore
  if (shouldUpload && results.length > 0) {
    console.log('\n📤 開始上傳詳解到 Firestore...');
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const sa = require('./serviceAccountKey.json');
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    const db = admin.firestore();
    const batch = db.batch();

    for (const q of results) {
      const ref = db.collection('questions').doc(q.id);
      batch.set(ref, { explanation: q.explanation }, { merge: true });
    }

    await batch.commit();
    console.log(`  ✅ 已將 ${results.length} 題詳解合併上傳至 Firestore`);
  }
}

main().catch(console.error);
