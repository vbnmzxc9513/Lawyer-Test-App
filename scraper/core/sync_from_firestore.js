/**
 * sync_from_firestore.js — 從 Firestore 匯出完整資料到本地 JSON
 * 
 * 用途：
 * 1. 建立本地備份
 * 2. 確保本地資料和資料庫一致
 * 3. 本地品質檢查不需要 quota
 * 
 * 輸出：data/{year}_complete.json
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

async function syncYear(year) {
  console.log(`\n📥 匯出 ${year}年...`);
  
  const snap = await db.collection('questions')
    .where('year', '==', year)
    .get();
  
  const questions = [];
  snap.forEach(doc => {
    const data = doc.data();
    questions.push({
      id: doc.id,
      year: data.year,
      paper: data.paper,
      subject: data.subject,
      questionNumber: data.questionNumber,
      questionText: data.questionText,
      options: data.options,
      answer: data.answer,
      explanation: data.explanation || null,
      tag: data.tag || '',
      // 前端使用 tags 陣列格式（quizEngine / storage / main.js）
      tags: data.tag ? data.tag.split(',').map(t => t.trim()).filter(Boolean) : []
    });
  });
  
  // Sort by paper + questionNumber for consistent ordering
  questions.sort((a, b) => {
    if (a.paper !== b.paper) return a.paper.localeCompare(b.paper);
    return a.questionNumber - b.questionNumber;
  });
  
  const outPath = path.join(__dirname, '..', 'data', `${year}_complete.json`);
  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8');
  
  // Summary
  const noExp = questions.filter(q => !q.explanation).length;
  const noTag = questions.filter(q => !q.tag).length;
  console.log(`  ✅ ${questions.length} 題匯出完成`);
  console.log(`  無詳解: ${noExp}, 無Tag: ${noTag}`);
  
  return questions;
}

async function run() {
  console.log('🔄 從 Firestore 同步資料到本地...\n');
  
  let totalQ = 0;
  for (const year of [111, 112, 113, 114]) {
    const qs = await syncYear(year);
    totalQ += qs.length;
  }
  
  console.log(`\n📊 總計匯出 ${totalQ} 題`);
  console.log('💾 儲存到 data/{year}_complete.json');
  process.exit();
}

run();
