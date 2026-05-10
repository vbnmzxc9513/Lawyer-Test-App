const admin = require('firebase-admin');
admin.initializeApp({credential: admin.credential.cert(require('./serviceAccountKey.json'))});
const db = admin.firestore();

async function run() {
  const snap = await db.collection('questions').get();
  
  const paperStats = {};
  const subjectStats = {};
  
  snap.forEach(doc => {
    const d = doc.data();
    const parts = doc.id.split('-');
    const year = parts[0];
    const fsCode = parts[1];
    const subject = parts[2] || d.subject || 'unknown';
    
    const paperKey = year + '-' + fsCode;
    paperStats[paperKey] = (paperStats[paperKey] || 0) + 1;
    
    const subKey = paperKey + '-' + subject;
    subjectStats[subKey] = (subjectStats[subKey] || 0) + 1;
  });
  
  const nameMap = {'2301':'0101 憲法/行政法','3301':'0201 民法/民訴','4301':'0202 公司法等','1301':'0301 刑法/刑訴'};
  const expectedMap = {'2301':75,'3301':80,'4301':70,'1301':75};
  
  console.log('=== 各試卷現有題數 ===');
  for (const [key, count] of Object.entries(paperStats).sort()) {
    const parts = key.split('-');
    const year = parts[0], fsCode = parts[1];
    const name = nameMap[fsCode] || fsCode;
    const expected = expectedMap[fsCode] || '?';
    const diff = expected - count;
    const status = diff <= 0 ? 'OK' : ('缺' + diff + '題');
    console.log(year + '年 ' + name + ': ' + count + '/' + expected + ' [' + status + ']');
  }
  
  console.log('\n=== 各科目題數明細 ===');
  for (const [key, count] of Object.entries(subjectStats).sort()) {
    console.log('  ' + key + ': ' + count + '題');
  }
  
  console.log('\n合計: ' + snap.size + ' 題');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
