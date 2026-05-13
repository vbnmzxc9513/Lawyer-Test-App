/**
 * upload_missing.js - 上傳缺失題目到 Firestore
 * 
 * 讀取 data/missing_questions.json，批次寫入 Firestore
 * 使用 merge:true 避免覆寫已有資料
 * 
 * 用法:
 *   node upload_missing.js --dry-run
 *   node upload_missing.js --confirm
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../config/serviceAccountKey.json'))
});
const db = admin.firestore();

const isDryRun = !process.argv.includes('--confirm');
const dataFile = path.join(__dirname, 'data', 'missing_questions.json');

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(isDryRun ? '  DRY RUN - will not write to Firestore' : '  EXECUTE - uploading to Firestore');
  console.log('='.repeat(60));

  if (!fs.existsSync(dataFile)) {
    console.error('missing_questions.json not found. Run extract_missing_questions.py first.');
    process.exit(1);
  }

  const docs = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  console.log(`\nLoaded ${docs.length} questions to upload\n`);

  // Validate
  let issues = 0;
  for (const d of docs) {
    const opts = d.options || {};
    const optCount = Object.keys(opts).length;
    if (optCount < 4) {
      console.log(`  [WARN] ${d.id} Q${d.questionNumber}: only ${optCount} options`);
      issues++;
    }
    if (!d.questionText || d.questionText.length < 5) {
      console.log(`  [WARN] ${d.id}: questionText too short`);
      issues++;
    }
    if (!d.answer) {
      console.log(`  [WARN] ${d.id}: no answer`);
      issues++;
    }
  }

  if (issues > 0) {
    console.log(`\n  ${issues} issues found. These will still be uploaded.`);
  }

  // Stats by paper
  const byPaper = {};
  docs.forEach(d => {
    const key = `${d.year}-${d.id.split('-')[1]}`;
    byPaper[key] = (byPaper[key] || 0) + 1;
  });
  console.log('\nBy paper:');
  for (const [k, v] of Object.entries(byPaper).sort()) {
    console.log(`  ${k}: ${v} questions`);
  }

  if (isDryRun) {
    console.log('\n  DRY RUN complete. Run with --confirm to upload.');
    process.exit(0);
  }

  // Upload
  console.log('\n  Uploading in 5 seconds... (Ctrl+C to cancel)');
  await new Promise(r => setTimeout(r, 5000));

  let batch = db.batch();
  let batchSize = 0;
  let total = 0;

  for (const d of docs) {
    const docRef = db.collection('questions').doc(d.id);
    batch.set(docRef, d, { merge: true });
    batchSize++;
    total++;

    if (batchSize >= 400) {
      await batch.commit();
      console.log(`  Committed ${total}/${docs.length}...`);
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  console.log(`\n  Done! Uploaded ${total} questions.`);

  // Log
  const logEntry = {
    action: 'upload_missing',
    at: new Date().toISOString(),
    count: total,
    papers: byPaper,
  };
  const logFile = 'fix_log.json';
  const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf-8')) : [];
  log.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
