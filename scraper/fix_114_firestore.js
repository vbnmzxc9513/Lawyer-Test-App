/**
 * fix_114_firestore.js - Re-upload all 114年 questions with clean data
 * AND fix explanations that contain PUA garbled characters
 */
const admin = require('firebase-admin');
const fs = require('fs');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function run() {
  // 1. Re-upload clean question data
  const data = JSON.parse(fs.readFileSync('data/114_complete.json', 'utf-8'));
  console.log(`Re-uploading ${data.length} clean questions...`);
  
  let batch = db.batch();
  let count = 0;
  for (const q of data) {
    batch.set(db.collection('questions').doc(q.id), q, { merge: true });
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`  ${count} done...`);
    }
  }
  if (count % 400 !== 0) await batch.commit();
  console.log(`  ${count} questions re-uploaded.`);

  // 2. Fix explanations that have PUA chars
  const puaRegex = /[\ue000-\uf8ff]/g;
  
  function cleanObj(obj) {
    if (typeof obj === 'string') return obj.replace(puaRegex, '').trim();
    if (Array.isArray(obj)) return obj.map(cleanObj);
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [k, v] of Object.entries(obj)) cleaned[k] = cleanObj(v);
      return cleaned;
    }
    return obj;
  }

  console.log('\nFetching all 114 docs to clean explanations...');
  const snap = await db.collection('questions')
    .where('year', '==', 114)
    .get();
  
  let fixedCount = 0;
  let batch2 = db.batch();
  let batchCount = 0;
  
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.explanation) {
      const cleaned = cleanObj(d.explanation);
      const cleanedTag = d.tag ? cleanObj(d.tag) : d.tag;
      batch2.update(doc.ref, { explanation: cleaned, tag: cleanedTag });
      fixedCount++;
      batchCount++;
      if (batchCount >= 400) {
        await batch2.commit();
        batch2 = db.batch();
        batchCount = 0;
      }
    }
  }
  if (batchCount > 0) await batch2.commit();
  
  console.log(`Fixed ${fixedCount} explanation docs.`);
  console.log('Done!');
  process.exit();
}
run();
