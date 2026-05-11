const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// Get all remaining question IDs from missing_questions.json
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/missing_questions.json', 'utf-8'));

// Subject code mapping
const SUBJ_CODE = {
  criminal: '1301', criminal_procedure: '1301', enforcement: '4301',
  legal_english: '4301', civil_procedure: '4301'
};

// Build generic explanations for non-criminal subjects
const items = [];
for (const d of data) {
  if (d.year === 112 && d.subject === 'criminal') continue;
  if (d.year === 113 && d.subject === 'criminal') continue;
  
  const code = SUBJ_CODE[d.subject] || '4301';
  const qn = String(d.questionNumber).padStart(2, '0');
  const id = `${d.year}-${code}-${d.subject.replace('_','-')}-${qn}`;
  
  // Build tag
  let tag = '';
  if (d.subject === 'legal_english') tag = '法學英文';
  else if (d.subject === 'enforcement') tag = '強制執行法';
  else if (d.subject === 'criminal_procedure') tag = '刑事訴訟法';
  else if (d.subject === 'civil_procedure') tag = '民事訴訟法';
  else tag = d.subject;
  
  const ans = d.answer;
  const opts = d.options || {};
  
  // Build explanation
  const correctOpt = opts[ans] || '';
  const exp = {
    coreConcept: `本題正確答案為(${ans})`,
    analogy: `本題考點為${tag}相關概念。正確選項(${ans})的關鍵在於精確掌握法律用語與概念的定義。`,
    coreExplanation: `答案(${ans})：${correctOpt.substring(0, 200)}`,
    optionAnalysis: {},
    keyTakeaway: `掌握${tag}的核心概念與法律術語。`,
    relatedArticles: tag
  };
  
  for (const [k, v] of Object.entries(opts)) {
    if (k === ans) {
      exp.optionAnalysis[k] = `【正確（本題答案）】${v.substring(0, 150)}`;
    } else {
      exp.optionAnalysis[k] = `【錯誤】${v.substring(0, 150)}`;
    }
  }
  
  items.push({ id, tag, explanation: exp });
}

async function run() {
  console.log(`Uploading ${items.length} remaining questions...`);
  for (const item of items) {
    await db.collection('questions').doc(item.id).set(
      { tag: item.tag, explanation: item.explanation }, 
      { merge: true }
    );
    console.log('OK ' + item.id);
  }
  console.log(`Done: ${items.length} remaining questions uploaded`);
  process.exit();
}
run();
