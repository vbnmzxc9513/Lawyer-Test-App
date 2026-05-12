const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function run() {
  // Query in batches by year to avoid quota issues
  const years = ['111', '112', '113', '114'];
  const allResults = {};
  const allMissing = [];

  for (const year of years) {
    // Get docs for this year using ID prefix
    const snapshot = await db.collection('questions')
      .where(admin.firestore.FieldPath.documentId(), '>=', `${year}-`)
      .where(admin.firestore.FieldPath.documentId(), '<', `${year}.`)
      .get();
    
    console.log(`Year ${year}: ${snapshot.size} docs found`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const parts = id.split('-');
      const subject = parts.slice(2, -1).join('-');
      const key = `${year}-${subject}`;
      
      if (!allResults[key]) allResults[key] = { total: 0, hasGoodExp: 0, missing: [], poorFormat: [] };
      allResults[key].total++;
      
      const exp = data.explanation;
      if (!exp) {
        allResults[key].missing.push(id);
        allMissing.push(id);
      } else if (typeof exp === 'string') {
        allResults[key].poorFormat.push(id);
      } else if (typeof exp === 'object' && (exp.coreConcept || exp.analogy || exp.coreExplanation)) {
        allResults[key].hasGoodExp++;
      } else {
        allResults[key].poorFormat.push(id);
      }
    });
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n========== AUDIT REPORT ==========`);
  let totalAll = 0, totalGood = 0, totalMissing = 0, totalPoor = 0;
  
  const sortedKeys = Object.keys(allResults).sort();
  for (const key of sortedKeys) {
    const r = allResults[key];
    totalAll += r.total;
    totalGood += r.hasGoodExp;
    totalMissing += r.missing.length;
    totalPoor += r.poorFormat.length;
    
    const pct = Math.round(r.hasGoodExp / r.total * 100);
    const status = pct === 100 ? '✅' : pct >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${key}: ${r.hasGoodExp}/${r.total} good (${pct}%) | missing: ${r.missing.length} | poor: ${r.poorFormat.length}`);
    
    if (r.missing.length > 0 && r.missing.length <= 10) {
      console.log(`   Missing IDs: ${r.missing.join(', ')}`);
    } else if (r.missing.length > 10) {
      console.log(`   Missing IDs (first 10): ${r.missing.slice(0,10).join(', ')}...`);
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total questions: ${totalAll}`);
  console.log(`Good explanations: ${totalGood}`);
  console.log(`Missing entirely: ${totalMissing}`);
  console.log(`Poor format: ${totalPoor}`);
  console.log(`Coverage: ${Math.round(totalGood/totalAll*100)}%`);
  
  process.exit();
}
run();
