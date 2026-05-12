const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function checkDoc(id) {
  const doc = await db.collection('questions').doc(id).get();
  if (!doc.exists) return 'not_exist';
  const exp = doc.data().explanation;
  if (exp && typeof exp === 'object' && (exp.coreConcept || exp.analogy)) return 'good';
  return 'no_exp';
}

async function scanRange(year, code, subj, from, to) {
  const noExp=[], notExist=[];
  for (let n=from; n<=to; n++) {
    const id = `${year}-${code}-${subj}-${String(n).padStart(2,'0')}`;
    const r = await checkDoc(id);
    if (r==='no_exp') noExp.push(n);
    else if (r==='not_exist') notExist.push(n);
    await new Promise(r=>setTimeout(r,30));
  }
  return { noExp, notExist, total: to-from+1, good: (to-from+1)-noExp.length-notExist.length };
}

async function run() {
  // Based on actual data structure from *_complete.json
  const plan = [
    // 111
    { year:'111', code:'1301', subj:'criminal', from:1, to:35 },
    { year:'111', code:'1301', subj:'criminal_procedure', from:36, to:60 },
    { year:'111', code:'3301', subj:'civil', from:1, to:50 },
    { year:'111', code:'3301', subj:'civil_procedure', from:51, to:76 },
    // 112
    { year:'112', code:'1301', subj:'criminal_procedure', from:51, to:60 },
    { year:'112', code:'3301', subj:'civil', from:1, to:50 },
    { year:'112', code:'3301', subj:'civil_procedure', from:51, to:80 },
    // 113
    { year:'113', code:'1301', subj:'criminal_procedure', from:51, to:60 },
    { year:'113', code:'3301', subj:'civil', from:1, to:50 },
    { year:'113', code:'3301', subj:'civil_procedure', from:51, to:80 },
  ];

  console.log('=== 精確缺口審計 ===\n');
  let totalNoExp=0, totalNotExist=0;
  for (const p of plan) {
    const r = await scanRange(p.year, p.code, p.subj, p.from, p.to);
    const pct = Math.round(r.good/r.total*100);
    const icon = pct===100?'✅':pct>=80?'⚠️':'❌';
    console.log(`${icon} ${p.year}-${p.code}-${p.subj} (Q${p.from}-${p.to}): ${r.good}/${r.total} (${pct}%)`);
    if(r.noExp.length) console.log(`   無詳解: Q${r.noExp.join(',')}`);
    if(r.notExist.length) console.log(`   不存在: Q${r.notExist.join(',')}`);
    totalNoExp += r.noExp.length;
    totalNotExist += r.notExist.length;
  }
  console.log(`\nTotal: 無詳解=${totalNoExp} 不存在=${totalNotExist}`);
  process.exit();
}
run();
