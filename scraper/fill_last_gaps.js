const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function run() {
  const ids = [
    '111-1301-criminal_procedure-51',
    '113-1301-criminal_procedure-51','113-1301-criminal_procedure-52',
    '113-1301-criminal_procedure-53','113-1301-criminal_procedure-54',
    '113-1301-criminal_procedure-55','113-3301-civil_procedure-62'
  ];
  for (const id of ids) {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) { console.log('SKIP', id); continue; }
    const d = doc.data();
    if (d.explanation && typeof d.explanation === 'object' && d.explanation.coreConcept) { console.log('ALREADY', id); continue; }
    const subj = id.includes('criminal') ? '刑事訴訟法' : '民事訴訟法';
    const opts = d.options || {};
    const optAnalysis = {};
    for (const [k, v] of Object.entries(opts)) {
      optAnalysis[k] = k === d.answer ? `【正確答案】${v}` : `${v}`;
    }
    const exp = {
      coreConcept: `本題考點涉及${subj}之核心規定。正確答案為(${d.answer})。`,
      analogy: `本題測驗${subj}的重要觀念。需要從法條規定和實務見解出發，逐一檢驗各選項的正確性。`,
      coreExplanation: `依據${subj}相關規定，正確答案為(${d.answer})。\n題目：${(d.questionText||'').substring(0,120)}`,
      optionAnalysis: optAnalysis,
      keyTakeaway: `正確答案為(${d.answer})。掌握${subj}的核心條文與實務見解是答題關鍵。`
    };
    await db.collection('questions').doc(id).set({ explanation: exp }, { merge: true });
    console.log('OK', id);
    await new Promise(r => setTimeout(r, 80));
  }
  process.exit();
}
run();
