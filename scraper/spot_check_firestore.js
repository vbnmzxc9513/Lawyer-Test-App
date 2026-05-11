const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// Spot check: pick specific questions and verify against official image
// These are manually picked from the official answer key images I read

const spotChecks = [
  // 111年 2301 (from image)
  { id: '111-2301-constitutional-01', expected: 'B', source: '111-2301 Q1' },
  { id: '111-2301-constitutional-05', expected: 'D', source: '111-2301 Q5' },
  { id: '111-2301-constitutional-10', expected: 'B', source: '111-2301 Q10' },
  { id: '111-2301-administrative-30', expected: 'B', source: '111-2301 Q30' },
  { id: '111-2301-international_public-56', expected: 'C', source: '111-2301 Q56' },
  { id: '111-2301-international_private-75', expected: 'C', source: '111-2301 Q75' },
  // 111年 1301
  { id: '111-1301-criminal-01', expected: 'D', source: '111-1301 Q1' },
  { id: '111-1301-criminal-10', expected: 'A', source: '111-1301 Q10' },
  { id: '111-1301-criminal_procedure-50', expected: 'A', source: '111-1301 Q50' },
  { id: '111-1301-legal_ethics-75', expected: 'C', source: '111-1301 Q75' },
  // 111年 3301
  { id: '111-3301-civil-01', expected: 'A', source: '111-3301 Q1' },
  { id: '111-3301-civil-20', expected: 'B', source: '111-3301 Q20' },
  { id: '111-3301-civil_procedure-60', expected: 'C', source: '111-3301 Q60' },
  // 111年 4301
  { id: '111-4301-company-01', expected: 'C', source: '111-4301 Q1' },
  { id: '111-4301-insurance-20', expected: 'D', source: '111-4301 Q20' },
  { id: '111-4301-securities-45', expected: 'C', source: '111-4301 Q45' },
  
  // 112年 2301
  { id: '112-2301-constitutional-01', expected: 'A', source: '112-2301 Q1' },
  { id: '112-2301-constitutional-12', expected: 'C', source: '112-2301 Q12' },
  { id: '112-2301-administrative-40', expected: 'C', source: '112-2301 Q40' },
  { id: '112-2301-international_private-75', expected: 'B', source: '112-2301 Q75' },
  // 112年 1301
  { id: '112-1301-criminal-01', expected: 'D', source: '112-1301 Q1' },
  { id: '112-1301-criminal-20', expected: 'D', source: '112-1301 Q20' },
  { id: '112-1301-criminal_procedure-60', expected: 'A', source: '112-1301 Q60' },
  { id: '112-1301-legal_ethics-75', expected: 'B', source: '112-1301 Q75' },
  // 112年 3301
  { id: '112-3301-civil-01', expected: 'A', source: '112-3301 Q1' },
  { id: '112-3301-civil-50', expected: 'C', source: '112-3301 Q50' },
  { id: '112-3301-civil_procedure-80', expected: 'C', source: '112-3301 Q80' },
  // 112年 4301
  { id: '112-4301-company-01', expected: 'C', source: '112-4301 Q1' },
  { id: '112-4301-enforcement-50', expected: 'D', source: '112-4301 Q50' },
  { id: '112-4301-legal_english-70', expected: 'C', source: '112-4301 Q70' },
  
  // 113年 2301
  { id: '113-2301-constitutional-01', expected: 'D', source: '113-2301 Q1' },
  { id: '113-2301-constitutional-10', expected: 'A', source: '113-2301 Q10' },
  { id: '113-2301-administrative-50', expected: 'B', source: '113-2301 Q50' },
  { id: '113-2301-international_private-75', expected: 'A', source: '113-2301 Q75' },
  // 113年 1301
  { id: '113-1301-criminal_procedure-56', expected: 'C', source: '113-1301 Q56' },
  { id: '113-1301-legal_ethics-75', expected: 'A', source: '113-1301 Q75' },
  // 113年 3301
  { id: '113-3301-civil-01', expected: 'D', source: '113-3301 Q1' },
  { id: '113-3301-civil-40', expected: 'B', source: '113-3301 Q40' },
  { id: '113-3301-civil_procedure-80', expected: 'B', source: '113-3301 Q80' },
  // 113年 4301
  { id: '113-4301-company-01', expected: 'B', source: '113-4301 Q1' },
  { id: '113-4301-insurance-20', expected: 'D', source: '113-4301 Q20' },
  { id: '113-4301-legal_english-70', expected: 'C', source: '113-4301 Q70' },
  
  // 114年 2301 (已先前修正)
  { id: '114-301-constitutional-01', expected: 'A', source: '114-2301 Q1' },
  { id: '114-301-constitutional-12', expected: 'D', source: '114-2301 Q12' },
  { id: '114-301-administrative-40', expected: 'C', source: '114-2301 Q40' },
  { id: '114-302-criminal-01', expected: 'B', source: '114-1301 Q1' },
  { id: '114-303-civil-01', expected: 'C', source: '114-3301 Q1' },
  { id: '114-304-company-01', expected: 'C', source: '114-4301 Q1' },
];

async function run() {
  let pass = 0, fail = 0, missing = 0;
  
  for (const check of spotChecks) {
    const snap = await db.collection('questions').doc(check.id).get();
    if (!snap.exists) {
      console.log(`MISSING: ${check.id} (${check.source})`);
      missing++;
      continue;
    }
    const actual = snap.data().answer;
    if (actual === check.expected) {
      console.log(`PASS: ${check.source} -> ${actual} (correct)`);
      pass++;
    } else {
      console.log(`*** FAIL: ${check.source} -> DB=${actual}, expected=${check.expected} ***`);
      fail++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`SPOT CHECK RESULT: ${pass} PASS, ${fail} FAIL, ${missing} MISSING`);
  console.log(`${'='.repeat(50)}`);
  
  if (fail > 0) {
    console.log('\n!!! THERE ARE STILL WRONG ANSWERS !!!');
  } else {
    console.log('\nAll spot checks passed.');
  }
  
  process.exit();
}
run();
