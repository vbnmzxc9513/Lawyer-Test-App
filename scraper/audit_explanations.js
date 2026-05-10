/**
 * audit_explanations.js
 * 交叉比對：被修正答案的 154 題中，哪些已有詳解？
 * 這些詳解可能是基於錯誤答案撰寫的，需要重新檢查。
 * 
 * 資料來源：
 * 1. fix_log.json - 所有修正紀錄（含 docId, oldAns, newAns）
 * 2. exp_*.js 檔案 - 掃描已撰寫詳解的題目 ID
 * 3. Firestore（配額恢復時）- 確認哪些題有 explanation 欄位
 */
const fs = require('fs');
const path = require('path');

// 1. 從 fix_log.json 取得所有被修正的題目
const fixLog = JSON.parse(fs.readFileSync('fix_log.json', 'utf-8'));
const fixedQuestions = {};
for (const entry of fixLog) {
  if (entry.fixes) {
    for (const f of entry.fixes) {
      fixedQuestions[f.docId] = { oldAns: f.oldAns, newAns: f.newAns, paper: f.paper };
    }
  }
}
console.log(`\n已修正答案的題目: ${Object.keys(fixedQuestions).length} 題\n`);

// 2. 掃描所有 exp_*.js 檔案，提取其中定義的題目 ID
const expDir = __dirname;
const expFiles = fs.readdirSync(expDir).filter(f => f.startsWith('exp_') && f.endsWith('.js'));
const explainedIds = new Set();

for (const file of expFiles) {
  const content = fs.readFileSync(path.join(expDir, file), 'utf-8');
  // 找出所有 id: "xxx-xxxx-xxx-xx" 的模式
  const matches = content.matchAll(/id:\s*["']([^"']+)["']/g);
  for (const m of matches) {
    explainedIds.add(m[1]);
  }
}
console.log(`已有詳解腳本的題目: ${explainedIds.size} 題\n`);

// 3. 交叉比對：哪些被修正的題目已有詳解？
const conflicted = [];
for (const [docId, info] of Object.entries(fixedQuestions)) {
  if (explainedIds.has(docId)) {
    conflicted.push({ docId, ...info });
  }
}

console.log('=' .repeat(60));
console.log(`  需要重新檢查的詳解: ${conflicted.length} 題`);
console.log('='.repeat(60));

if (conflicted.length > 0) {
  // 按試卷分組
  const byPaper = {};
  conflicted.forEach(c => {
    const key = c.paper || c.docId.substring(0, 8);
    (byPaper[key] = byPaper[key] || []).push(c);
  });

  for (const [paper, items] of Object.entries(byPaper).sort()) {
    console.log(`\n【${paper}】${items.length} 題:`);
    items.sort((a, b) => a.docId.localeCompare(b.docId)).forEach(c => {
      console.log(`  ${c.docId}: ${c.oldAns} -> ${c.newAns}  ⚠️ 詳解可能基於 "${c.oldAns}" 撰寫`);
    });
  }
}

// 4. 統計哪些題目完全沒有詳解
const allExplained = [...explainedIds];
console.log(`\n${'─'.repeat(60)}`);
console.log(`\n📊 詳解覆蓋率摘要:`);

// 按科目統計
const subjectCount = {};
for (const id of allExplained) {
  const parts = id.split('-');
  const year = parts[0];
  const fsCode = parts[1];
  const key = `${year}-${fsCode}`;
  subjectCount[key] = (subjectCount[key] || 0) + 1;
}

const expected = {'2301': 75, '3301': 80, '4301': 70, '1301': 75};
const nameMap = {'2301': 'constitutional', '3301': 'civil', '4301': 'commercial', '1301': 'criminal'};

for (const year of [111, 112, 113]) {
  console.log(`\n${year}年:`);
  for (const [fsCode, total] of Object.entries(expected)) {
    const key = `${year}-${fsCode}`;
    const count = subjectCount[key] || 0;
    const pct = Math.round(count / total * 100);
    const bar = '#'.repeat(Math.round(pct / 5)) + '.'.repeat(20 - Math.round(pct / 5));
    console.log(`  ${nameMap[fsCode].padEnd(15)} ${String(count).padStart(3)}/${total} [${bar}] ${pct}%`);
  }
}

process.exit(0);
