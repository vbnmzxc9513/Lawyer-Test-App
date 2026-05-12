const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

// Load all questions from complete JSON
function loadQuestions(year) {
  return JSON.parse(fs.readFileSync(`data/${year}_complete.json`));
}

// Generate a structured explanation from question data
function generateExplanation(q) {
  const answer = q.answer || '?';
  const opts = q.options || {};
  const qText = q.questionText || '';
  const subject = q.subject || q.id.split('-').slice(2,-1).join('-');
  
  // Build option analysis
  const optAnalysis = {};
  for (const [key, val] of Object.entries(opts)) {
    if (key === answer) {
      optAnalysis[key] = `【正確答案】${val}`;
    } else {
      optAnalysis[key] = `${val}`;
    }
  }

  // Determine subject tag
  let tag = '';
  if (subject.includes('civil_procedure')) tag = '民事訴訟法';
  else if (subject.includes('criminal_procedure')) tag = '刑事訴訟法';
  else if (subject.includes('civil')) tag = '民法';
  else if (subject.includes('criminal')) tag = '刑法';
  
  return {
    coreConcept: `本題考點涉及${tag}之核心規定。正確答案為(${answer})。`,
    analogy: `本題測驗${tag}的重要觀念。需要從法條規定和實務見解出發，逐一檢驗各選項的正確性，找出符合法律規定的答案。`,
    coreExplanation: `依據${tag}相關規定，正確答案為(${answer})。\n題目：${qText.substring(0, 100)}${qText.length > 100 ? '...' : ''}`,
    optionAnalysis: optAnalysis,
    keyTakeaway: `本題正確答案為(${answer})。掌握${tag}的核心條文與實務見解是答題關鍵。`
  };
}

async function run() {
  const gaps = [
    // 111 civil_procedure Q51-76 (26)
    { year: '111', idPrefix: '111-3301-civil_procedure', from: 51, to: 76 },
    // 111 criminal_procedure Q51 (1 missing)
    { year: '111', idPrefix: '111-1301-criminal_procedure', from: 51, to: 51 },
    // 112 civil_procedure Q51-80 (30)
    { year: '112', idPrefix: '112-3301-civil_procedure', from: 51, to: 80 },
    // 113 criminal_procedure Q51-55 (5 missing)
    { year: '113', idPrefix: '113-1301-criminal_procedure', from: 51, to: 55 },
    // 113 civil_procedure Q51-80 (30)
    { year: '113', idPrefix: '113-3301-civil_procedure', from: 51, to: 80 },
  ];

  let total = 0;
  for (const gap of gaps) {
    const questions = loadQuestions(gap.year);
    console.log(`\n=== ${gap.idPrefix} Q${gap.from}-${gap.to} ===`);
    
    for (let n = gap.from; n <= gap.to; n++) {
      const id = `${gap.idPrefix}-${String(n).padStart(2, '0')}`;
      // Find question in complete data
      const q = questions.find(qq => qq.id === id);
      if (!q) { console.log(`  ⚠️ SKIP ${id} (not in data)`); continue; }
      
      // Check if already has good explanation
      const doc = await db.collection('questions').doc(id).get();
      if (!doc.exists) { console.log(`  ⚠️ SKIP ${id} (not in Firestore)`); continue; }
      const existing = doc.data().explanation;
      if (existing && typeof existing === 'object' && existing.coreConcept) continue;
      
      const exp = generateExplanation(q);
      await db.collection('questions').doc(id).set({
        tag: exp.coreConcept.substring(0, 50),
        explanation: exp
      }, { merge: true });
      console.log(`  ✅ ${id}`);
      total++;
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log(`\n🏁 Total: ${total} docs updated`);
  process.exit();
}
run();
