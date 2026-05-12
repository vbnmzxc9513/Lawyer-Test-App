const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function checkDoc(id) {
  try {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) return 'missing';
    const exp = doc.data().explanation;
    if (!exp) return 'no_exp';
    if (typeof exp === 'object' && (exp.coreConcept || exp.analogy || exp.coreExplanation)) return 'good';
    return 'no_exp';
  } catch(e) { return 'missing'; }
}

async function scanRange(year, code, subject, from, to) {
  const good = [], noExp = [], missing = [];
  for (let n = from; n <= to; n++) {
    const id = `${year}-${code}-${subject}-${String(n).padStart(2, '0')}`;
    const r = await checkDoc(id);
    if (r === 'good') good.push(id);
    else if (r === 'no_exp') noExp.push(id);
    else missing.push(id);
    await new Promise(r => setTimeout(r, 50));
  }
  return { good, noExp, missing };
}

async function run() {
  // Correct ID format confirmed:
  // 1301-criminal Q01-35 = 刑法, Q36-55 = 刑訴, Q56+ legal ethics
  // 3301-civil Q01-50 = 民法, Q51+ = 民訴 (need to confirm)
  // 4301-company, insurance, negotiable_instruments, securities, enforcement, legal_english

  const plan = [
    // 112
    { year: '112', code: '1301', subj: 'criminal',   from: 1, to: 55, label: '112 刑法+刑訴(1301-criminal)' },
    { year: '112', code: '1301', subj: 'legal_ethics', from: 56, to: 75, label: '112 法律倫理' },
    { year: '112', code: '3301', subj: 'civil',      from: 1, to: 55, label: '112 民法+民訴(3301-civil)' },
    { year: '112', code: '4301', subj: 'negotiable_instruments', from: 26, to: 35, label: '112 票據' },
    { year: '112', code: '4301', subj: 'enforcement',  from: 46, to: 55, label: '112 強執' },
    { year: '112', code: '4301', subj: 'legal_english', from: 56, to: 65, label: '112 法學英文' },
    // 113
    { year: '113', code: '1301', subj: 'criminal',   from: 1, to: 55, label: '113 刑法+刑訴(1301-criminal)' },
    { year: '113', code: '1301', subj: 'legal_ethics', from: 56, to: 75, label: '113 法律倫理' },
    { year: '113', code: '3301', subj: 'civil',      from: 1, to: 55, label: '113 民法+民訴(3301-civil)' },
    { year: '113', code: '4301', subj: 'negotiable_instruments', from: 26, to: 35, label: '113 票據' },
    { year: '113', code: '4301', subj: 'enforcement',  from: 46, to: 55, label: '113 強執' },
    { year: '113', code: '4301', subj: 'legal_english', from: 56, to: 65, label: '113 法學英文' },
    // 111
    { year: '111', code: '3301', subj: 'civil',      from: 51, to: 55, label: '111 民法 51-55' },
    { year: '111', code: '4301', subj: 'company',    from: 7, to: 15, label: '111 公司法 7-15' },
    { year: '111', code: '4301', subj: 'enforcement', from: 46, to: 55, label: '111 強執' },
    { year: '111', code: '4301', subj: 'legal_english', from: 56, to: 65, label: '111 法學英文' },
  ];

  let totalGood = 0, totalNoExp = 0, totalMissing = 0;
  console.log('====== 完整覆蓋率審計 ======\n');
  for (const p of plan) {
    const r = await scanRange(p.year, p.code, p.subj, p.from, p.to);
    totalGood += r.good.length;
    totalNoExp += r.noExp.length;
    totalMissing += r.missing.length;
    const total = p.to - p.from + 1;
    const pct = Math.round(r.good.length / total * 100);
    const icon = pct === 100 ? '✅' : pct >= 70 ? '⚠️' : '❌';
    console.log(`${icon} ${p.label}: ${r.good.length}/${total} (${pct}%) | 無詳解:${r.noExp.length} | 缺文件:${r.missing.length}`);
    if (r.noExp.length > 0 && r.noExp.length <= 20) {
      const nums = r.noExp.map(id => id.split('-').pop().replace(/^0+/,''));
      console.log(`   無詳解題號: ${nums.join(', ')}`);
    }
    if (r.missing.length > 0 && r.missing.length <= 10) {
      const nums = r.missing.map(id => id.split('-').pop().replace(/^0+/,''));
      console.log(`   文件不存在: ${nums.join(', ')}`);
    }
  }
  
  console.log(`\n====== 總計 ======`);
  console.log(`有詳解: ${totalGood}`);
  console.log(`無詳解: ${totalNoExp}`);
  console.log(`文件不存在: ${totalMissing}`);
  process.exit();
}
run();
