/**
 * 找出所有「詳解與正確答案不一致」的題目清單
 * 輸出格式方便批量重寫
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

async function run() {
  const results = { 111: [], 112: [], 113: [], 114: [] };
  
  for (const year of [111, 112, 113, 114]) {
    const snap = await db.collection('questions')
      .where('year', '==', year)
      .get();
    
    for (const doc of snap.docs) {
      const data = doc.data();
      const exp = data.explanation;
      
      // Only check questions that HAVE explanations
      if (!exp || typeof exp !== 'object' || !exp.coreConcept) continue;
      
      const correctAns = data.answer;
      const optAnalysis = exp.optionAnalysis;
      
      if (!optAnalysis) continue;
      
      // Check if the optionAnalysis marks the correct answer properly
      const correctText = optAnalysis[correctAns] || '';
      const hasCorrectMark = correctText.includes('正確') || correctText.includes('本題答案');
      
      // Also check if any WRONG option is marked as correct
      let wrongMarkedCorrect = false;
      for (const opt of ['A', 'B', 'C', 'D']) {
        if (opt === correctAns) continue;
        const optText = optAnalysis[opt] || '';
        if (optText.includes('正確') && optText.includes('本題答案')) {
          wrongMarkedCorrect = true;
        }
      }
      
      if (!hasCorrectMark || wrongMarkedCorrect) {
        results[year].push({
          id: doc.id,
          qnum: data.questionNumber,
          subject: data.subject,
          correctAnswer: correctAns,
          paper: doc.id.split('-')[1]
        });
      }
    }
  }
  
  // Output summary
  let total = 0;
  for (const [year, items] of Object.entries(results)) {
    console.log(`\n=== ${year}年: ${items.length} 題需要重寫 ===`);
    total += items.length;
    
    // Group by paper+subject
    const bySubject = {};
    for (const item of items) {
      const key = `${item.paper}-${item.subject}`;
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push(item.qnum);
    }
    
    for (const [key, qnums] of Object.entries(bySubject)) {
      qnums.sort((a, b) => a - b);
      console.log(`  ${key}: Q${qnums.join(', Q')} (${qnums.length} 題)`);
    }
  }
  
  console.log(`\n總計: ${total} 題需要重寫詳解`);
  
  // Save detailed list
  fs.writeFileSync('explanation_rewrite_list.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('清單已存入 explanation_rewrite_list.json');
  
  process.exit();
}
run();
