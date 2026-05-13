/**
 * shift_detect.js - 檢測詳解是否「位移」到鄰近題目
 * 
 * 核心思路：如果 Q5 的詳解其實是 Q4 的，那 Q5 的 explanation 
 * 會標記 Q4 的正確答案為正確。
 * 我們對每個不一致的題目，檢查它的 explanation 是否匹配 Q±1, Q±2... 的答案。
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('../config/serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

function detectExpAnswer(exp) {
  if (!exp || typeof exp !== 'object' || !exp.optionAnalysis) return null;
  const oa = exp.optionAnalysis;
  for (const opt of ['A', 'B', 'C', 'D']) {
    const text = (oa[opt] || '');
    const hasCorrect = text.includes('正確') || text.includes('本題答案') || text.includes('✅');
    const hasWrong = text.includes('錯誤') || text.includes('不正確') || text.includes('❌') || text.includes('有誤');
    if (hasCorrect && !hasWrong) return opt;
  }
  return null;
}

async function run() {
  console.log('🔍 Shift Detection: 檢測詳解位移模式...\n');
  
  for (const year of [111, 112, 113, 114]) {
    const snap = await db.collection('questions').where('year', '==', year).get();
    
    // Group by year+subject
    const bySubject = {};
    snap.forEach(doc => {
      const d = doc.data();
      const key = `${year}-${d.subject}`;
      if (!bySubject[key]) bySubject[key] = {};
      bySubject[key][d.questionNumber] = {
        id: doc.id,
        answer: d.answer,
        expAnswer: detectExpAnswer(d.explanation),
        questionPreview: (d.questionText || '').substring(0, 50),
        coreConcept: d.explanation?.coreConcept || ''
      };
    });
    
    // For each subject, check for shift patterns
    for (const [key, questions] of Object.entries(bySubject)) {
      const qnums = Object.keys(questions).map(Number).sort((a, b) => a - b);
      
      // Find mismatched questions
      const mismatched = qnums.filter(n => {
        const q = questions[n];
        return q.expAnswer && q.expAnswer !== q.answer;
      });
      
      if (mismatched.length === 0) continue;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${key}: ${mismatched.length} 題不一致`);
      console.log('='.repeat(60));
      
      // For each mismatch, check if expAnswer matches a neighbor's answer
      for (const qnum of mismatched) {
        const q = questions[qnum];
        const shifts = [];
        
        for (let offset = -5; offset <= 5; offset++) {
          if (offset === 0) continue;
          const neighbor = questions[qnum + offset];
          if (neighbor && neighbor.answer === q.expAnswer) {
            shifts.push({ offset, neighborQ: qnum + offset, neighborAns: neighbor.answer });
          }
        }
        
        const shiftInfo = shifts.length > 0 
          ? shifts.map(s => `Q${s.neighborQ}(offset=${s.offset>0?'+':''}${s.offset})`).join(', ')
          : 'NO_MATCH';
        
        console.log(`  Q${String(qnum).padStart(2)}: ans=${q.answer} exp→${q.expAnswer} | 詳解可能屬於: ${shiftInfo}`);
        console.log(`        概念: ${q.coreConcept.substring(0, 60)}`);
      }
      
      // Detect if there's a consistent shift pattern
      const offsetCounts = {};
      for (const qnum of mismatched) {
        const q = questions[qnum];
        for (let offset = -5; offset <= 5; offset++) {
          if (offset === 0) continue;
          const neighbor = questions[qnum + offset];
          if (neighbor && neighbor.answer === q.expAnswer) {
            offsetCounts[offset] = (offsetCounts[offset] || 0) + 1;
          }
        }
      }
      
      if (Object.keys(offsetCounts).length > 0) {
        console.log(`\n  📊 位移統計:`);
        for (const [off, count] of Object.entries(offsetCounts).sort((a,b) => b[1] - a[1])) {
          const pct = (count / mismatched.length * 100).toFixed(0);
          console.log(`    offset=${off>0?'+':''}${off}: ${count}/${mismatched.length} (${pct}%) 吻合`);
        }
      }
    }
  }
  
  process.exit();
}

run();
