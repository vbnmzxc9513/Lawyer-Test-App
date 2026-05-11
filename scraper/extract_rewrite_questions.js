// 拉出所有需要重寫的題目完整資料，存成 JSON 供重寫用
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

async function run() {
  const rewriteList = JSON.parse(fs.readFileSync('explanation_rewrite_list.json', 'utf-8'));
  
  for (const [year, items] of Object.entries(rewriteList)) {
    if (items.length === 0) continue;
    
    const output = [];
    for (const item of items) {
      const doc = await db.collection('questions').doc(item.id).get();
      if (!doc.exists) continue;
      const d = doc.data();
      output.push({
        id: item.id,
        questionNumber: d.questionNumber,
        subject: d.subject,
        answer: d.answer,
        questionText: d.questionText,
        options: d.options
      });
    }
    
    // Group by paper-subject for batch writing
    const byGroup = {};
    for (const q of output) {
      const parts = q.id.split('-');
      const key = `${parts[1]}-${q.subject}`;
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(q);
    }
    
    for (const [group, questions] of Object.entries(byGroup)) {
      questions.sort((a, b) => a.questionNumber - b.questionNumber);
      const fname = `rewrite_${year}_${group}.json`;
      fs.writeFileSync(fname, JSON.stringify(questions, null, 2), 'utf-8');
      console.log(`${fname}: ${questions.length} questions`);
    }
  }
  
  process.exit();
}
run();
