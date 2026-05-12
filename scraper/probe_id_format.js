const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// The actual ID format used in Firestore based on exp_*.js scripts:
// {year}-{examCode}-{subject}-{nn} where nn is zero-padded 2 digits
// examCode: 1301 = criminal/crimproc/ethics paper, 2301 = constitutional/admin/intlpub paper, 
//           3301 = civil paper, 4301 = commercial paper
// But civil might be under 3301? Let me check all patterns.

async function checkDoc(id) {
  try {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) return { exists: false };
    const exp = doc.data().explanation;
    const hasGoodExp = exp && typeof exp === 'object' && (exp.coreConcept || exp.analogy || exp.coreExplanation);
    return { exists: true, hasGoodExp: !!hasGoodExp };
  } catch(e) { return { exists: false, error: e.message }; }
}

async function probeSubject(year, codes, subject, start, end) {
  // Try each exam code to find the right one
  for (const code of codes) {
    const id1 = `${year}-${code}-${subject}-${String(start).padStart(2,'0')}`;
    const r = await checkDoc(id1);
    if (r.exists) {
      // Found the right code, now scan the range
      const results = { code, exists: [], missing: [], noExp: [] };
      for (let n = start; n <= end; n++) {
        const id = `${year}-${code}-${subject}-${String(n).padStart(2,'0')}`;
        const r2 = await checkDoc(id);
        if (!r2.exists) results.missing.push(id);
        else if (r2.hasGoodExp) results.exists.push(id);
        else results.noExp.push(id);
        await new Promise(r => setTimeout(r, 50));
      }
      return results;
    }
    await new Promise(r => setTimeout(r, 50));
  }
  return { code: 'not_found', exists: [], missing: [], noExp: [] };
}

async function run() {
  // First probe what exam codes exist for 112
  console.log('=== Probing 112 year ID formats ===');
  const probeIds = [
    '112-1301-criminal-01', '112-2301-criminal-01', '112-3301-criminal-01',
    '112-1301-civil-01', '112-2301-civil-01', '112-3301-civil-01',
    '112-1301-criminal_procedure-36', '112-1301-criminal_procedure-01',
    '112-4301-negotiable_instruments-26', '112-4301-negotiable_instruments-01',
  ];
  for (const id of probeIds) {
    const r = await checkDoc(id);
    console.log(`${id}: ${r.exists ? '✅ EXISTS (exp:'+r.hasGoodExp+')' : '❌ not found'}`);
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n=== Probing 113 year ===');
  const probe113 = [
    '113-1301-criminal-01', '113-2301-criminal-01', '113-3301-criminal-01',
    '113-1301-civil-01', '113-2301-civil-01', '113-3301-civil-01',
    '113-4301-negotiable_instruments-26',
  ];
  for (const id of probe113) {
    const r = await checkDoc(id);
    console.log(`${id}: ${r.exists ? '✅ EXISTS (exp:'+r.hasGoodExp+')' : '❌ not found'}`);
    await new Promise(r => setTimeout(r, 100));
  }

  process.exit();
}
run();
