/**
 * upload_to_firestore.js - 批次上傳題庫到 Firestore
 * 
 * 用法：
 *   node upload_to_firestore.js --year 113
 *   node upload_to_firestore.js --all
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ 找不到 serviceAccountKey.json 憑證檔案！');
  console.log('請前往 Firebase Console > 專案設定 > 服務帳戶，產生新的私密金鑰，並另存為 serviceAccountKey.json 放進 scraper 目錄下。');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// 判斷專案 ID 是否與預期相符 (lawyerexam)
console.log(`🔗 連線到 Firebase 專案: ${serviceAccount.project_id}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const args = process.argv.slice(2);
let targetYears = [];
const dataDir = path.join(__dirname, 'data');

if (args.includes('--all')) {
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
  console.log('  node upload_to_firestore.js --year 113');
  console.log('  node upload_to_firestore.js --all');
  process.exit(0);
}

async function uploadToFirestore() {
  const collectionRef = db.collection('questions');
  let totalUploaded = 0;

  for (const year of targetYears.sort()) {
    const yearFile = path.join(dataDir, `${year}_complete.json`);
    
    if (!fs.existsSync(yearFile)) {
      console.warn(`⚠️ 找不到 ${year} 年的資料: ${yearFile}`);
      continue;
    }

    console.log(`\n📥 開始上傳 ${year} 年題庫...`);
    const questions = JSON.parse(fs.readFileSync(yearFile, 'utf-8'));
    
    // 批次寫入 (Batch Write)，每次最多 500 筆
    let batch = db.batch();
    let count = 0;
    
    for (const q of questions) {
      const docRef = collectionRef.doc(q.id);
      batch.set(docRef, q, { merge: true }); // 使用 merge: true 避免覆寫後續可能產生的詳解
      count++;
      totalUploaded++;

      if (count === 500) {
        await batch.commit();
        console.log(`  ✅ 已上傳 500 題...`);
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`  ✅ 已上傳剩餘 ${count} 題...`);
    }
    
    console.log(`🎉 ${year} 年上傳完成！共 ${questions.length} 題。`);
  }

  console.log(`\n✨ 全部作業結束！總共更新/新增了 ${totalUploaded} 題到 Firestore。`);
  process.exit(0);
}

uploadToFirestore().catch(console.error);
