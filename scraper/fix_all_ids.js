const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

function correctId(expId) {
  const parts = expId.split('-');
  const year = parts[0];
  const code = parts[1];
  const subject = parts.slice(2, -1).join('-');
  const num = parts[parts.length - 1].padStart(2, '0');
  // civil/civil_procedure -> 3301
  if (['civil','civil_procedure'].includes(subject) && code !== '3301')
    return `${year}-3301-${subject}-${num}`;
  // criminal/criminal_procedure -> 1301
  if (['criminal','criminal_procedure'].includes(subject) && code !== '1301')
    return `${year}-1301-${subject}-${num}`;
  // legal_ethics -> 1301
  if (subject === 'legal_ethics' && code !== '1301')
    return `${year}-1301-${subject}-${num}`;
  return `${year}-${code}-${subject}-${num}`;
}

async function processScript(scriptFile) {
  const content = fs.readFileSync(scriptFile, 'utf8');
  let explanations = [];
  try {
    const match = content.match(/const\s+(?:E|explanations|questions)\s*=\s*(\[[\s\S]*?\]);/);
    if (match) explanations = eval(match[1]);
  } catch(e) { console.error(`  Parse error: ${e.message.substring(0,80)}`); return 0; }
  let count = 0;
  for (const item of explanations) {
    if (!item.id || !item.explanation) continue;
    const cid = correctId(item.id);
    const doc = await db.collection('questions').doc(cid).get();
    if (!doc.exists) { /* skip */ continue; }
    const existing = doc.data().explanation;
    if (existing && typeof existing === 'object' && existing.coreConcept) continue; // already good
    await db.collection('questions').doc(cid).set({ tag: item.tag||'', explanation: item.explanation }, { merge: true });
    console.log(`  ✅ ${cid}`);
    count++;
    await new Promise(r => setTimeout(r, 50));
  }
  return count;
}

async function run() {
  // All exp scripts that may have wrong IDs
  const scripts = [
    // 111 criminal
    'exp_111_crim_1.js','exp_111_crim_2.js','exp_111_crim_3.js','exp_111_crim_4.js',
    // 111 criminal procedure
    'exp_111_crimproc_1.js','exp_111_crimproc_2.js','exp_111_crimproc_3.js',
    // 111 civil (including v3 series for better quality)
    'exp_111_civil_v3_q1.js','exp_111_civil_v3_q6.js','exp_111_civil_v3_q11.js',
    'exp_111_civil_v3_q16.js','exp_111_civil_v3_q21.js','exp_111_civil_v3_q26.js',
    'exp_111_civil_v3_q31.js','exp_111_civil_v3_q36.js','exp_111_civil_v3_q41.js',
    'exp_111_civil_v3_q46.js',
    // fallback to original if v3 missed any
    'exp_111_civil_1.js','exp_111_civil_2.js','exp_111_civil_3.js','exp_111_civil_4.js',
    // 112 criminal procedure (exp_criminal_proc_113_112.js)
    'exp_criminal_proc_113_112.js',
    // 112 civil procedure (v3 series)
    'exp_112_civil_v3_q1.js','exp_112_civil_v3_q6.js','exp_112_civil_v3_q11.js',
    'exp_112_civil_v3_q16.js','exp_112_civil_v3_q21.js','exp_112_civil_v3_q26.js',
    'exp_112_civil_v3_q31.js','exp_112_civil_v3_q36.js','exp_112_civil_v3_q41.js',
    'exp_112_civil_v3_q46.js',
    'exp_112_civil_1.js','exp_112_civil_2.js','exp_112_civil_3.js','exp_112_civil_4.js',
    // 113 criminal procedure
    'exp_113_crim_q1.js','exp_113_crim_q11.js','exp_113_crim_q21.js',
    'exp_113_crim_q31.js','exp_113_crim_q41.js',
    // 113 civil procedure (v1 series)
    'exp_113_civil_v1_q01.js','exp_113_civil_v1_q06.js','exp_113_civil_v1_q11.js',
    'exp_113_civil_v1_q16.js',
    'exp_113_civil_1.js','exp_113_civil_2.js','exp_113_civil_3.js','exp_113_civil_4.js',
    // 113 admin/intl supplements
    'exp_113_adm_1.js','exp_113_adm_2.js','exp_113_adm_3.js','exp_113_adm_4.js',
    'exp_113_intlpriv.js','exp_113_intlpub.js',
    // 112 admin supplements
    'exp_112_adm_1.js','exp_112_adm_1_fix.js','exp_112_adm_2.js','exp_112_adm_3.js',
    'exp_112_intlpriv.js','exp_112_intlpub.js',
    // 111 supplements
    'exp_111_intlpriv.js','exp_111_intlpub.js',
    'exp_111_company.js','exp_111_insurance.js',
  ];

  let grand = 0;
  for (const s of scripts) {
    if (!fs.existsSync(s)) continue;
    console.log(`\n📄 ${s}`);
    const n = await processScript(s);
    if (n > 0) console.log(`  → ${n} updated`);
    grand += n;
  }
  console.log(`\n🏁 Grand total: ${grand} docs updated`);
  process.exit();
}
run();
