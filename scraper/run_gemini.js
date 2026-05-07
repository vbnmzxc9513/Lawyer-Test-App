/**
 * run_gemini.js - 自動化呼叫 Gemini API 生成詳解
 * 
 * 用法：
 *   設定環境變數 GEMINI_API_KEY
 *   node run_gemini.js --year 113
 */
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const args = process.argv.slice(2);
let targetYear = null;

if (args.includes('--year')) {
  targetYear = parseInt(args[args.indexOf('--year') + 1]);
}

if (!targetYear) {
  console.log('用法：node run_gemini.js --year 113');
  process.exit(0);
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ 錯誤：找不到環境變數 GEMINI_API_KEY');
  console.log('請先執行以下指令設定您的 API Key（Google AI Studio 免費獲取）:');
  console.log('  Windows (PowerShell): $env:GEMINI_API_KEY="您的金鑰"');
  console.log('  Mac/Linux: export GEMINI_API_KEY="您的金鑰"');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function main() {
  const promptDir = path.join(__dirname, 'prompts', String(targetYear));
  const resultsDir = path.join(__dirname, 'ai_results', String(targetYear));

  if (!fs.existsSync(promptDir)) {
    console.error(`❌ 找不到 prompt 目錄: ${promptDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const promptFiles = fs.readdirSync(promptDir).filter(f => f.endsWith('.txt'));
  console.log(`🚀 開始處理 ${targetYear} 年的考題，共 ${promptFiles.length} 批...`);

  for (const file of promptFiles) {
    const promptPath = path.join(promptDir, file);
    const resultFile = file.replace('.txt', '.json');
    const resultPath = path.join(resultsDir, resultFile);

    if (fs.existsSync(resultPath)) {
      console.log(`⏩ 跳過已完成的批次: ${file}`);
      continue;
    }

    console.log(`\n📄 正在處理: ${file} ...`);
    const promptText = fs.readFileSync(promptPath, 'utf-8');

    try {
      console.log(`   ⏳ 等待 Gemini 2.5 Flash 生成詳解 (可能需要 1~2 分鐘)...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          temperature: 0.2, // 降低隨機性，確保答案穩定
          responseMimeType: "application/json", // 強制輸出 JSON
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini 回傳空內容');
      }

      fs.writeFileSync(resultPath, text, 'utf-8');
      console.log(`   ✅ 成功儲存至: ${resultFile}`);

      // 避免 API 頻率限制 (Rate Limit)，暫停 15 秒
      console.log(`   ⏳ 暫停 15 秒以避免觸發 API 限制...`);
      await new Promise(r => setTimeout(r, 15000));

    } catch (error) {
      console.error(`   ❌ 處理失敗:`, error.message);
      console.log(`   您可以稍後再次執行此腳本，它會自動接續失敗的進度。`);
    }
  }

  console.log(`\n🎉 ${targetYear} 年全部處理完成！`);
  console.log(`👉 下一步：執行 node merge.js --year ${targetYear}`);
}

main();
