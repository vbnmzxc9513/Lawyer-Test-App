const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function checkDoc(id) {
  try {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) return { status: 'not_exist' };
    const d = doc.data();
    const exp = d.explanation;
    const hasGoodExp = exp && typeof exp === 'object' && (exp.coreConcept || exp.analogy || exp.coreExplanation);
    return { status: hasGoodExp ? 'good' : 'no_exp', hasQuestion: !!d.questionText, data: d };
  } catch(e) { return { status: 'error', msg: e.message }; }
}

async function scanAll(year, code, subject, from, to) {
  const good=[], noExp=[], notExist=[];
  for (let n = from; n <= to; n++) {
    const id = `${year}-${code}-${subject}-${String(n).padStart(2,'0')}`;
    const r = await checkDoc(id);
    if (r.status === 'good') good.push(n);
    else if (r.status === 'no_exp') noExp.push(n);
    else notExist.push(n);
    await new Promise(r => setTimeout(r, 40));
  }
  return { good, noExp, notExist };
}

async function run() {
  // Full scan for 111, 112, 113 - all papers/subjects with correct ID formats
  const yearPlans = [
    { year: '111', subjects: [
      { code:'2301', subj:'constitutional', from:1, to:19 },
      { code:'2301', subj:'administrative', from:20, to:55 },
      { code:'2301', subj:'international_public', from:56, to:65 },
      { code:'2301', subj:'international_private', from:66, to:75 },
      { code:'1301', subj:'criminal', from:1, to:55 },
      { code:'1301', subj:'legal_ethics', from:56, to:75 },
      { code:'3301', subj:'civil', from:1, to:75 },
      { code:'4301', subj:'company', from:1, to:15 },
      { code:'4301', subj:'insurance', from:16, to:25 },
      { code:'4301', subj:'negotiable_instruments', from:26, to:35 },
      { code:'4301', subj:'securities', from:36, to:45 },
      { code:'4301', subj:'enforcement', from:46, to:55 },
      { code:'4301', subj:'legal_english', from:56, to:65 },
    ]},
    { year: '112', subjects: [
      { code:'2301', subj:'constitutional', from:1, to:19 },
      { code:'2301', subj:'administrative', from:20, to:55 },
      { code:'2301', subj:'international_public', from:56, to:65 },
      { code:'2301', subj:'international_private', from:66, to:75 },
      { code:'1301', subj:'criminal', from:1, to:55 },
      { code:'1301', subj:'legal_ethics', from:56, to:75 },
      { code:'3301', subj:'civil', from:1, to:75 },
      { code:'4301', subj:'company', from:1, to:15 },
      { code:'4301', subj:'insurance', from:16, to:25 },
      { code:'4301', subj:'negotiable_instruments', from:26, to:35 },
      { code:'4301', subj:'securities', from:36, to:45 },
      { code:'4301', subj:'enforcement', from:46, to:55 },
      { code:'4301', subj:'legal_english', from:56, to:65 },
    ]},
    { year: '113', subjects: [
      { code:'2301', subj:'constitutional', from:1, to:19 },
      { code:'2301', subj:'administrative', from:20, to:55 },
      { code:'2301', subj:'international_public', from:56, to:65 },
      { code:'2301', subj:'international_private', from:66, to:75 },
      { code:'1301', subj:'criminal', from:1, to:55 },
      { code:'1301', subj:'legal_ethics', from:56, to:75 },
      { code:'3301', subj:'civil', from:1, to:75 },
      { code:'4301', subj:'company', from:1, to:15 },
      { code:'4301', subj:'insurance', from:16, to:25 },
      { code:'4301', subj:'negotiable_instruments', from:26, to:35 },
      { code:'4301', subj:'securities', from:36, to:45 },
      { code:'4301', subj:'enforcement', from:46, to:55 },
      { code:'4301', subj:'legal_english', from:56, to:65 },
    ]},
  ];

  const fs = require('fs');
  const report = { gaps: [] };

  for (const yp of yearPlans) {
    console.log(`\n========== ${yp.year}年 ==========`);
    for (const s of yp.subjects) {
      const r = await scanAll(yp.year, s.code, s.subj, s.from, s.to);
      const total = s.to - s.from + 1;
      const pct = Math.round(r.good.length / total * 100);
      const icon = pct === 100 ? '✅' : pct >= 80 ? '⚠️' : '❌';
      console.log(`${icon} ${s.subj}(${s.code}): ${r.good.length}/${total} | noExp:${r.noExp.length} notExist:${r.notExist.length}`);
      if (r.noExp.length > 0) {
        console.log(`   無詳解: Q${r.noExp.join(',')}`);
        r.noExp.forEach(n => report.gaps.push({ year: yp.year, code: s.code, subj: s.subj, num: n, issue: 'no_exp' }));
      }
      if (r.notExist.length > 0) {
        console.log(`   不存在: Q${r.notExist.join(',')}`);
        r.notExist.forEach(n => report.gaps.push({ year: yp.year, code: s.code, subj: s.subj, num: n, issue: 'not_exist' }));
      }
    }
  }

  fs.writeFileSync('gap_report.json', JSON.stringify(report, null, 2));
  console.log(`\n=== TOTAL GAPS: ${report.gaps.length} ===`);
  console.log(`Saved to gap_report.json`);
  process.exit();
}
run();
