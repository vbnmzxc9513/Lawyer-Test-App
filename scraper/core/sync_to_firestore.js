/**
 * sync_to_firestore.js — 將本地 JSON 上傳到 Firestore
 * 
 * 工作流程：
 * 1. 讀取 data/{year}_complete.json
 * 2. 與 Firestore 逐題比對，只更新有差異的題目
 * 3. 輸出變更摘要
 * 
 * ⚠️ 這是唯一允許寫入 Firestore 的腳本
 * ⚠️ 執行前必須先跑 audit/local_audit.js 確認品質
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

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a == b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => deepEqual(a[k], b[k]));
}

async function run() {
  const dryRun = !process.argv.includes('--execute');
  
  if (dryRun) {
    console.log('🔍 DRY RUN — 只比對差異，不寫入 Firestore');
    console.log('   加上 --execute 才會實際寫入\n');
  } else {
    console.log('🔥 EXECUTE MODE — 將寫入 Firestore！\n');
  }
  
  let totalDiffs = 0;
  let totalWritten = 0;
  
  for (const year of [111, 112, 113, 114]) {
    const filePath = path.join(__dirname, '..', 'data', `${year}_complete.json`);
    const localQs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`\n📋 ${year}年 (${localQs.length} 題)...`);
    
    const snap = await db.collection('questions').where('year', '==', year).get();
    const fbMap = {};
    snap.forEach(doc => { fbMap[doc.id] = doc.data(); });
    
    let batch = db.batch();
    let batchSize = 0;
    
    for (const local of localQs) {
      const fb = fbMap[local.id];
      if (!fb) {
        console.log(`  ⚠️ ${local.id}: Firestore 不存在（新題目）`);
        totalDiffs++;
        continue;
      }
      
      const diffs = [];
      if (fb.answer !== local.answer) diffs.push('answer');
      if (fb.tag !== local.tag) diffs.push('tag');
      if (!deepEqual(fb.explanation, local.explanation)) diffs.push('explanation');
      if (fb.questionText !== local.questionText) diffs.push('questionText');
      
      if (diffs.length > 0) {
        totalDiffs++;
        console.log(`  📝 ${local.id}: ${diffs.join(', ')}`);
        
        if (!dryRun) {
          const ref = db.collection('questions').doc(local.id);
          const update = {};
          if (diffs.includes('answer')) update.answer = local.answer;
          if (diffs.includes('tag')) update.tag = local.tag;
          if (diffs.includes('explanation')) update.explanation = local.explanation;
          if (diffs.includes('questionText')) update.questionText = local.questionText;
          
          batch.update(ref, update);
          batchSize++;
          
          if (batchSize >= 450) {
            await batch.commit();
            totalWritten += batchSize;
            console.log(`    💾 已提交 ${batchSize} 筆`);
            batch = db.batch();
            batchSize = 0;
          }
        }
      }
    }
    
    if (!dryRun && batchSize > 0) {
      await batch.commit();
      totalWritten += batchSize;
      console.log(`    💾 已提交 ${batchSize} 筆`);
    }
  }
  
  console.log(`\n=== 結果 ===`);
  console.log(`  有差異: ${totalDiffs} 題`);
  if (dryRun) {
    console.log(`  模式: DRY RUN（未寫入）`);
    console.log(`  如確認無誤，請執行: node core/sync_to_firestore.js --execute`);
  } else {
    console.log(`  已寫入: ${totalWritten} 題`);
  }
  
  process.exit();
}

run();
