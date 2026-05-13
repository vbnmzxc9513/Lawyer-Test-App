/**
 * verify_sync.js — 驗證本地 JSON 與 Firestore 是否一致
 * 
 * 隨機抽樣 20 題，逐欄位比對本地 vs Firestore
 * 用來確認 sync_from_firestore.js 沒有 bug
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../config/serviceAccountKey.json'))
  });
}
const db = admin.firestore();

async function run() {
  console.log('🔍 驗證本地 JSON 與 Firestore 是否一致\n');
  
  // Load all local data
  const localAll = {};
  for (const year of [111, 112, 113, 114]) {
    const filePath = path.join(__dirname, '..', 'data', `${year}_complete.json`);
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    questions.forEach(q => { localAll[q.id] = q; });
  }
  console.log(`本地共 ${Object.keys(localAll).length} 題\n`);
  
  // Pick 20 random IDs (5 per year, spread across subjects)
  const sampleIds = [];
  for (const year of [111, 112, 113, 114]) {
    const yearQs = Object.keys(localAll).filter(id => id.startsWith(year + '-'));
    // Pick 5 evenly spread
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor((i / 5) * yearQs.length);
      sampleIds.push(yearQs[idx]);
    }
  }
  
  let match = 0;
  let mismatch = 0;
  const mismatches = [];
  
  for (const id of sampleIds) {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) {
      console.log(`  ❌ ${id}: Firestore 不存在！`);
      mismatch++;
      continue;
    }
    
    const fb = doc.data();
    const local = localAll[id];
    
    // Compare key fields
    const diffs = [];
    
    if (fb.answer !== local.answer) diffs.push(`answer: FB=${fb.answer} LOCAL=${local.answer}`);
    if (fb.questionNumber !== local.questionNumber) diffs.push(`qNum: FB=${fb.questionNumber} LOCAL=${local.questionNumber}`);
    if (fb.subject !== local.subject) diffs.push(`subject: FB=${fb.subject} LOCAL=${local.subject}`);
    if ((fb.questionText || '').substring(0, 50) !== (local.questionText || '').substring(0, 50)) {
      diffs.push(`questionText first 50 chars differ`);
    }
    
    // Compare explanation
    if (fb.explanation && local.explanation) {
      if (fb.explanation.coreConcept !== local.explanation.coreConcept) {
        diffs.push(`coreConcept differs`);
      }
      if (fb.explanation.coreExplanation !== local.explanation.coreExplanation) {
        diffs.push(`coreExplanation differs`);
      }
      // Compare optionAnalysis
      if (fb.explanation.optionAnalysis && local.explanation.optionAnalysis) {
        for (const opt of ['A', 'B', 'C', 'D']) {
          if ((fb.explanation.optionAnalysis[opt] || '') !== (local.explanation.optionAnalysis[opt] || '')) {
            diffs.push(`optionAnalysis.${opt} differs`);
          }
        }
      }
    } else if (!!fb.explanation !== !!local.explanation) {
      diffs.push(`explanation: one exists, other doesn't`);
    }
    
    // Compare tag
    if ((fb.tag || '') !== (local.tag || '')) diffs.push(`tag: FB="${(fb.tag||'').substring(0,30)}" LOCAL="${(local.tag||'').substring(0,30)}"`);
    
    if (diffs.length === 0) {
      console.log(`  ✅ ${id}`);
      match++;
    } else {
      console.log(`  ❌ ${id}:`);
      diffs.forEach(d => console.log(`      ${d}`));
      mismatch++;
      mismatches.push({ id, diffs });
    }
  }
  
  console.log(`\n=== 結果 ===`);
  console.log(`  抽樣: ${sampleIds.length} 題`);
  console.log(`  一致: ${match}`);
  console.log(`  不一致: ${mismatch}`);
  
  if (mismatch > 0) {
    console.log(`\n⚠️ 有不一致！sync_from_firestore.js 可能有 bug，或 fix_tags.js 已修改了 Firestore。`);
    console.log(`   不一致的欄位:`);
    mismatches.forEach(m => console.log(`   ${m.id}: ${m.diffs.join(', ')}`));
  } else {
    console.log(`\n✅ 全部一致！本地 JSON = Firestore 資料。`);
  }
  
  process.exit();
}

run();
