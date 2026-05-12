const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// Check specific document IDs rather than querying collections
async function checkIds(ids) {
  const results = { has: [], missing: [], noExp: [] };
  for (const id of ids) {
    try {
      const doc = await db.collection('questions').doc(id).get();
      if (!doc.exists) {
        results.missing.push(id);
      } else {
        const data = doc.data();
        if (!data.explanation || (typeof data.explanation === 'object' && !data.explanation.coreConcept && !data.explanation.analogy)) {
          results.noExp.push(id);
        } else {
          results.has.push(id);
        }
      }
    } catch (e) {
      console.error(`Error checking ${id}: ${e.message}`);
      results.missing.push(id);
    }
    // Small delay to avoid quota
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

async function run() {
  // Check 111 year - sample a range of IDs across all subjects
  const subjects111 = [
    { name: 'constitutional', prefix: '111-2301-constitutional', range: [1, 20] },
    { name: 'administrative', prefix: '111-2301-administrative', range: [20, 55] },
    { name: 'international_public', prefix: '111-2301-international_public', range: [56, 65] },
    { name: 'international_private', prefix: '111-2301-international_private', range: [66, 75] },
    { name: 'criminal', prefix: '111-2301-criminal', range: [1, 35] },
    { name: 'criminal_procedure', prefix: '111-2301-criminal_procedure', range: [36, 60] },
    { name: 'legal_ethics', prefix: '111-2301-legal_ethics', range: [61, 75] },
    { name: 'civil', prefix: '111-2301-civil', range: [1, 55] },
    { name: 'company', prefix: '111-4301-company', range: [1, 15] },
    { name: 'insurance', prefix: '111-4301-insurance', range: [16, 25] },
    { name: 'negotiable', prefix: '111-4301-negotiable_instruments', range: [26, 35] },
    { name: 'securities', prefix: '111-4301-securities', range: [36, 45] },
    { name: 'enforcement', prefix: '111-4301-enforcement', range: [46, 55] },
    { name: 'legal_english', prefix: '111-4301-legal_english', range: [56, 65] },
  ];

  console.log('=== 111年 詳解覆蓋率 ===\n');
  let totalHas = 0, totalMissing = 0, totalNoExp = 0;

  for (const s of subjects111) {
    const ids = [];
    for (let i = s.range[0]; i <= s.range[1]; i++) {
      ids.push(`${s.prefix}-${i}`);
    }
    const r = await checkIds(ids);
    totalHas += r.has.length;
    totalMissing += r.missing.length;
    totalNoExp += r.noExp.length;

    const total = ids.length;
    const good = r.has.length;
    const pct = Math.round(good / total * 100);
    const icon = pct === 100 ? '✅' : pct >= 50 ? '⚠️' : '❌';
    console.log(`${icon} ${s.name}: ${good}/${total} (${pct}%) | 不存在:${r.missing.length} | 無詳解:${r.noExp.length}`);
    if (r.noExp.length > 0) {
      console.log(`   缺詳解: ${r.noExp.join(', ')}`);
    }
    if (r.missing.length > 0 && r.missing.length <= 5) {
      console.log(`   不存在: ${r.missing.join(', ')}`);
    }
  }

  console.log(`\n=== 111年 總結 ===`);
  console.log(`有詳解: ${totalHas}`);
  console.log(`無詳解: ${totalNoExp}`);
  console.log(`文件不存在: ${totalMissing}`);
  
  process.exit();
}
run();
