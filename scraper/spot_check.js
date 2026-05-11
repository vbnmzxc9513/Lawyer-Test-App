const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// Check specific subjects we suspect are missing explanations
const checks = [
  {year: 111, subject: 'company'},
  {year: 111, subject: 'insurance'},
  {year: 111, subject: 'securities'},
  {year: 111, subject: 'negotiable_instruments'},
  {year: 111, subject: 'civil_procedure'},
  {year: 112, subject: 'company'},
  {year: 112, subject: 'insurance'},
  {year: 112, subject: 'securities'},
  {year: 112, subject: 'negotiable_instruments'},
  {year: 112, subject: 'civil_procedure'},
  {year: 112, subject: 'criminal_procedure'},
  {year: 113, subject: 'company'},
  {year: 113, subject: 'insurance'},
  {year: 113, subject: 'securities'},
  {year: 113, subject: 'negotiable_instruments'},
  {year: 113, subject: 'civil_procedure'},
  {year: 113, subject: 'criminal_procedure'},
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  let totalMissing = 0;
  console.log('Checking suspected missing subjects...\n');
  
  for (const {year, subject} of checks) {
    await sleep(1500);
    try {
      const snap = await db.collection('questions')
        .where('year', '==', year)
        .where('subject', '==', subject)
        .limit(3) // just sample a few
        .get();
      
      if (snap.empty) { console.log(`  ${year}-${subject}: NO DOCS FOUND`); continue; }
      
      let hasExp = 0, noExp = 0;
      snap.forEach(doc => {
        const d = doc.data();
        if (d.explanation && d.explanation.coreConcept && d.explanation.coreConcept.length > 5) hasExp++;
        else noExp++;
      });
      
      const status = noExp > 0 ? '❌ MISSING' : '✅ HAS EXP';
      console.log(`  ${year}-${subject.padEnd(25)} sample ${hasExp}/${snap.size} ${status}`);
    } catch(e) {
      if (e.code === 8) {
        console.log(`  ${year}-${subject}: QUOTA - will retry in 60s`);
        await sleep(60000);
        // retry once
        try {
          const snap = await db.collection('questions')
            .where('year', '==', year).where('subject', '==', subject).limit(2).get();
          let hasExp = 0, noExp = 0;
          snap.forEach(doc => {
            const d = doc.data();
            if (d.explanation && d.explanation.coreConcept && d.explanation.coreConcept.length > 5) hasExp++;
            else noExp++;
          });
          console.log(`  ${year}-${subject.padEnd(25)} sample ${hasExp}/${snap.size} ${noExp > 0 ? '❌' : '✅'}`);
        } catch(e2) { console.log(`  ${year}-${subject}: STILL QUOTA LIMITED`); }
      }
    }
  }
  process.exit();
}
run();
