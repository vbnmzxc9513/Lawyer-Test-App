/**
 * import.js - 累積式題庫匯入器
 * 
 * 用法：
 *   node import.js --year 113    匯入指定年份到前端題庫
 *   node import.js --all         匯入所有已合併的年份
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let targetYears = [];

const dataDir = path.join(__dirname, 'data');
const questionsFile = path.join(__dirname, '..', 'src', 'data', 'questions.json');

if (args.includes('--all')) {
  // 掃描 data/ 目錄中所有 *_complete.json
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_complete.json'));
    targetYears = files.map(f => parseInt(f.split('_')[0])).filter(y => !isNaN(y));
  }
} else if (args.includes('--year')) {
  const year = parseInt(args[args.indexOf('--year') + 1]);
  if (!isNaN(year)) targetYears = [year];
}

if (targetYears.length === 0) {
  console.log('用法：');
  console.log('  node import.js --year 113    匯入指定年份');
  console.log('  node import.js --all         匯入所有已合併的年份');
  process.exit(0);
}

function main() {
  // 讀取現有題庫
  let existingQuestions = [];
  if (fs.existsSync(questionsFile)) {
    try {
      existingQuestions = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'));
      console.log(`📂 現有題庫: ${existingQuestions.length} 題`);
    } catch (e) {
      console.warn('⚠️ 現有題庫讀取失敗，將從空白開始');
    }
  }

  // 建立已有 ID 的索引
  const existingIds = new Set(existingQuestions.map(q => q.id));
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const year of targetYears.sort()) {
    const yearFile = path.join(dataDir, `${year}_complete.json`);
    
    if (!fs.existsSync(yearFile)) {
      console.error(`❌ 找不到 ${year} 年的合併檔案: ${yearFile}`);
      continue;
    }

    const yearQuestions = JSON.parse(fs.readFileSync(yearFile, 'utf-8'));
    let added = 0;
    let skipped = 0;

    for (const q of yearQuestions) {
      if (existingIds.has(q.id)) {
        skipped++;
      } else {
        existingQuestions.push(q);
        existingIds.add(q.id);
        added++;
      }
    }

    totalAdded += added;
    totalSkipped += skipped;
    console.log(`📥 ${year} 年: +${added} 題 (${skipped} 題已存在，跳過)`);
  }

  // 寫回題庫
  fs.writeFileSync(questionsFile, JSON.stringify(existingQuestions, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(40));
  console.log(`✅ 匯入完成！`);
  console.log(`   新增: ${totalAdded} 題`);
  console.log(`   跳過: ${totalSkipped} 題`);
  console.log(`   題庫總計: ${existingQuestions.length} 題`);
  console.log('='.repeat(40));

  // 統計各年份題數
  const yearStats = {};
  for (const q of existingQuestions) {
    const y = q.year || '未知';
    yearStats[y] = (yearStats[y] || 0) + 1;
  }
  console.log('\n各年份題數:');
  for (const [y, count] of Object.entries(yearStats).sort()) {
    console.log(`  ${y} 年: ${count} 題`);
  }
}

main();
