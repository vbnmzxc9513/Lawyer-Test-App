/**
 * sync_from_firestore.js
 * 從 Firestore 抓取最新詳解並更新本地 data/11?_complete.json
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');
const path = require('path');

async function syncYear(year) {
  const filePath = path.join(__dirname, 'data', `${year}_complete.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 找不到 ${year}_complete.json`);
    return;
  }
  
  const localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n🔄 同步 ${year} 年 (${localData.length} 題)...`);
  
  let updatedCount = 0;
  for (let i = 0; i < localData.length; i++) {
    const q = localData[i];
    const doc = await db.collection('questions').doc(q.id).get();
    
    if (doc.exists) {
      const remoteData = doc.data();
      if (remoteData.explanation && remoteData.explanation.coreConcept) {
        // 更新詳解與標籤
        localData[i].explanation = remoteData.explanation;
        if (remoteData.tag) localData[i].tag = remoteData.tag;
        updatedCount++;
      }
    }
    
    if (i % 50 === 0 && i > 0) process.stdout.write('.');
    await new Promise(r => setTimeout(r, 30));
  }
  
  fs.writeFileSync(filePath, JSON.stringify(localData, null, 2));
  console.log(`\n✅ ${year} 年完成：更新了 ${updatedCount} 題詳解`);
}

async function run() {
  await syncYear('111');
  await syncYear('112');
  await syncYear('113');
  console.log('\n🏁 所有年份同步完成！');
  process.exit();
}
run();
