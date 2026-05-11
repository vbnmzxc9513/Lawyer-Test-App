const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const subjects = [
  {year: 111, subject: 'constitutional'},
  {year: 111, subject: 'administrative'},
  {year: 111, subject: 'criminal'},
  {year: 111, subject: 'civil'},
  {year: 111, subject: 'criminal_procedure'},
  {year: 111, subject: 'civil_procedure'},
  {year: 111, subject: 'enforcement'},
  {year: 111, subject: 'legal_english'},
  {year: 112, subject: 'constitutional'},
  {year: 112, subject: 'administrative'},
  {year: 112, subject: 'criminal'},
  {year: 112, subject: 'civil'},
  {year: 112, subject: 'criminal_procedure'},
  {year: 112, subject: 'civil_procedure'},
  {year: 112, subject: 'enforcement'},
  {year: 112, subject: 'legal_english'},
  {year: 113, subject: 'constitutional'},
  {year: 113, subject: 'administrative'},
  {year: 113, subject: 'criminal'},
  {year: 113, subject: 'civil'},
  {year: 113, subject: 'criminal_procedure'},
  {year: 113, subject: 'civil_procedure'},
  {year: 113, subject: 'enforcement'},
  {year: 113, subject: 'legal_english'},
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('Starting coverage audit (batch by subject)...\n');
  let totalQ = 0, totalExp = 0;
  const results = [];

  for (const {year, subject} of subjects) {
    try {
      await sleep(500); // rate limit
      const snap = await db.collection('questions')
        .where('year', '==', year)
        .where('subject', '==', subject)
        .get();
      
      if (snap.empty) continue;
      
      let withExp = 0;
      const missing = [];
      snap.forEach(doc => {
        const d = doc.data();
        const hasExp = d.explanation && d.explanation.coreConcept && d.explanation.coreConcept.length > 5;
        if (hasExp) withExp++;
        else missing.push(d.questionNumber);
      });
      
      const total = snap.size;
      totalQ += total;
      totalExp += withExp;
      const pct = ((withExp / total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.round(withExp / total * 20)) + '░'.repeat(20 - Math.round(withExp / total * 20));
      
      results.push({key: `${year}-${subject}`, total, withExp, pct, missing, bar});
      console.log(`  ${year}-${subject.padEnd(22)} ${bar} ${withExp}/${total} (${pct}%)`);
      if (missing.length > 0) {
        console.log(`    Missing: Q${missing.sort((a,b)=>a-b).join(', Q')}`);
      }
    } catch(e) {
      if (e.code === 8) {
        console.log(`  ${year}-${subject}: QUOTA EXCEEDED - waiting 30s...`);
        await sleep(30000);
      } else {
        console.log(`  ${year}-${subject}: Error - ${e.message}`);
      }
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total: ${totalQ} | With Exp: ${totalExp} | Missing: ${totalQ - totalExp}`);
  console.log(`Coverage: ${((totalExp / totalQ) * 100).toFixed(1)}%`);
  process.exit();
}
run();
