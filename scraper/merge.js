/**
 * merge.js - AI 結果彙整與驗證
 * 
 * 用法：
 *   node merge.js --year 113    合併指定年份的 AI 結果
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let targetYear = null;

if (args.includes('--year')) {
  targetYear = parseInt(args[args.indexOf('--year') + 1]);
}

if (!targetYear) {
  console.log('用法：node merge.js --year 113');
  process.exit(0);
}

function main() {
  const resultsDir = path.join(__dirname, 'ai_results', String(targetYear));
  const outputDir = path.join(__dirname, 'data');
  const outputFile = path.join(outputDir, `${targetYear}_complete.json`);

  if (!fs.existsSync(resultsDir)) {
    console.error(`❌ 找不到 AI 結果目錄: ${resultsDir}`);
    console.log(`   請先將 Gemini 回傳的 JSON 存入此目錄`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.error(`❌ ${resultsDir} 中沒有 JSON 檔案`);
    process.exit(1);
  }

  console.log(`🔄 開始合併 ${targetYear} 年的 AI 結果...`);
  console.log(`   找到 ${files.length} 個 JSON 檔案\n`);

  let allQuestions = [];
  let errors = [];

  for (const file of files.sort()) {
    const filePath = path.join(resultsDir, file);
    console.log(`📄 處理: ${file}`);

    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // 清理 Markdown 格式標記
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const questions = JSON.parse(content);

      if (!Array.isArray(questions)) {
        errors.push(`${file}: 格式錯誤，必須是 JSON 陣列`);
        continue;
      }

      // 驗證每題必備欄位
      for (const q of questions) {
        const missing = [];
        if (!q.id) missing.push('id');
        if (!q.questionText) missing.push('questionText');
        if (!q.answer) missing.push('answer');
        if (!q.options) missing.push('options');
        if (!q.tags || !Array.isArray(q.tags)) missing.push('tags');

        if (missing.length > 0) {
          errors.push(`${file} - 題目 ${q.id || '?'}: 缺少欄位 [${missing.join(', ')}]`);
        }

        // 確保 year 欄位正確
        q.year = targetYear;
      }

      allQuestions = allQuestions.concat(questions);
      console.log(`   ✅ ${questions.length} 題`);

    } catch (e) {
      errors.push(`${file}: JSON 解析失敗 - ${e.message}`);
      console.error(`   ❌ 解析失敗: ${e.message}`);
    }
  }

  // 去重
  const idSet = new Set();
  const uniqueQuestions = [];
  let duplicates = 0;

  for (const q of allQuestions) {
    if (idSet.has(q.id)) {
      duplicates++;
    } else {
      idSet.add(q.id);
      uniqueQuestions.push(q);
    }
  }

  // 統計報告
  console.log('\n' + '='.repeat(50));
  console.log(`📊 ${targetYear} 年合併統計報告`);
  console.log('='.repeat(50));
  console.log(`總題數: ${uniqueQuestions.length}`);
  console.log(`重複題: ${duplicates}`);
  
  // 科目分佈
  const subjectCount = {};
  const tagCount = {};
  for (const q of uniqueQuestions) {
    subjectCount[q.subject] = (subjectCount[q.subject] || 0) + 1;
    if (q.tags) {
      for (const t of q.tags) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      }
    }
  }

  console.log('\n科目分佈:');
  for (const [subj, count] of Object.entries(subjectCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${subj}: ${count} 題`);
  }

  console.log(`\n觀念標籤數: ${Object.keys(tagCount).length} 個獨特標籤`);

  // 顯示前 10 個最常見標籤
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('前 10 常見標籤:');
  for (const [tag, count] of topTags) {
    console.log(`  ${tag}: ${count} 次`);
  }

  if (errors.length > 0) {
    console.log(`\n⚠️ 發現 ${errors.length} 個問題:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  // 寫入合併結果
  fs.writeFileSync(outputFile, JSON.stringify(uniqueQuestions, null, 2), 'utf-8');
  console.log(`\n✅ 已儲存至: ${outputFile}`);
  console.log(`\n👉 下一步：執行 node import.js --year ${targetYear} 匯入前端題庫`);
}

main();
