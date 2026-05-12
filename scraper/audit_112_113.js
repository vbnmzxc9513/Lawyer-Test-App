const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function checkId(id) {
  try {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) return 'missing';
    const exp = doc.data().explanation;
    if (!exp) return 'no_exp';
    if (typeof exp === 'string') return 'string_exp';
    if (typeof exp === 'object' && (exp.coreConcept || exp.analogy || exp.coreExplanation)) return 'good';
    return 'no_exp';
  } catch(e) { return 'error'; }
}

async function auditSubjects(year, paper, subjects, ranges) {
  const results = {};
  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i];
    const [from, to] = ranges[i];
    const ids = [];
    for (let n = from; n <= to; n++) ids.push(`${year}-${paper}-${s}-${n}`);
    
    const missing = [], noExp = [], good = [];
    for (const id of ids) {
      const r = await checkId(id);
      if (r === 'missing') missing.push(id);
      else if (r === 'good') good.push(id);
      else noExp.push(id);
      await new Promise(r => setTimeout(r, 50));
    }
    results[s] = { total: ids.length, good: good.length, missing, noExp };
  }
  return results;
}

async function run() {
  const years = [
    {
      year: '112',
      paper2301: {
        subjects: ['constitutional','administrative','international_public','international_private','criminal','criminal_procedure','legal_ethics'],
        ranges: [[17,20],[20,55],[56,65],[66,75],[1,35],[36,60],[61,75]]
      },
      paper4301: {
        subjects: ['civil','company','insurance','negotiable_instruments','securities','enforcement','legal_english'],
        ranges: [[1,55],[1,15],[16,25],[26,35],[36,45],[46,55],[56,65]]
      }
    },
    {
      year: '113',
      paper2301: {
        subjects: ['constitutional','administrative','international_public','international_private','criminal','criminal_procedure','legal_ethics'],
        ranges: [[17,20],[19,55],[56,65],[66,75],[1,50],[36,60],[61,75]]
      },
      paper4301: {
        subjects: ['civil','company','insurance','negotiable_instruments','securities','enforcement','legal_english'],
        ranges: [[1,55],[1,15],[16,25],[26,35],[36,45],[46,55],[56,65]]
      }
    }
  ];

  for (const y of years) {
    console.log(`\n===== ${y.year}年 詳解覆蓋率 =====`);
    let totalGood = 0, totalMissing = 0, totalNoExp = 0;
    
    const r2 = await auditSubjects(y.year, '2301', y.paper2301.subjects, y.paper2301.ranges);
    const r4 = await auditSubjects(y.year, '4301', y.paper4301.subjects, y.paper4301.ranges);
    const all = { ...r2, ...r4 };
    
    for (const [subj, data] of Object.entries(all)) {
      totalGood += data.good;
      totalMissing += data.missing.length;
      totalNoExp += data.noExp.length;
      const pct = Math.round(data.good / data.total * 100);
      const icon = pct === 100 ? '✅' : pct >= 70 ? '⚠️' : '❌';
      console.log(`${icon} ${subj}: ${data.good}/${data.total} (${pct}%) | 缺文件:${data.missing.length} | 無詳解:${data.noExp.length}`);
      if (data.noExp.length > 0 && data.noExp.length <= 20) console.log(`   無詳解IDs: ${data.noExp.join(', ')}`);
      if (data.missing.length > 0 && data.missing.length <= 10) console.log(`   缺文件IDs: ${data.missing.join(', ')}`);
    }
    console.log(`\n${y.year}年總計 → 有詳解:${totalGood} | 無詳解:${totalNoExp} | 缺文件:${totalMissing}`);
  }
  process.exit();
}
run();
