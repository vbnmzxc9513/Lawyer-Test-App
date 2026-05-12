const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

// Correct ID format mapping
function correctId(expId) {
  const parts = expId.split('-');
  const year = parts[0];
  const code = parts[1];
  const subject = parts.slice(2, -1).join('-');
  const num = parts[parts.length - 1];
  const paddedNum = num.padStart(2, '0');

  // civil/civil_procedure -> 3301
  if (['civil', 'civil_procedure'].includes(subject) && code !== '3301') {
    return `${year}-3301-${subject}-${paddedNum}`;
  }
  // legal_ethics -> 1301 (not 2301)
  if (subject === 'legal_ethics' && code === '2301') {
    return `${year}-1301-${subject}-${paddedNum}`;
  }
  // criminal_procedure -> 1301-criminal (check actual IDs)
  // 111-2301-criminal_procedure-36 might actually be 111-1301-criminal-36
  if (subject === 'criminal_procedure' && code === '2301') {
    return `${year}-1301-criminal-${paddedNum}`;
  }
  return `${year}-${code}-${subject}-${paddedNum}`;
}

async function processScript(scriptFile) {
  const content = fs.readFileSync(scriptFile, 'utf8');
  let explanations = [];
  try {
    const match = content.match(/const\s+E\s*=\s*(\[[\s\S]*?\]);/) ||
                  content.match(/const\s+explanations\s*=\s*(\[[\s\S]*?\]);/) ||
                  content.match(/const\s+questions\s*=\s*(\[[\s\S]*?\]);/);
    if (match) explanations = eval(match[1]);
  } catch(e) {
    console.error(`  ⚠️  Parse error: ${e.message.substring(0, 80)}`);
    return 0;
  }

  let count = 0;
  for (const item of explanations) {
    if (!item.id || !item.explanation) continue;
    const correctDocId = correctId(item.id);
    const docRef = db.collection('questions').doc(correctDocId);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`  ⚠️  SKIP ${correctDocId} (not in Firestore)`);
      continue;
    }
    await docRef.set({ tag: item.tag || '', explanation: item.explanation }, { merge: true });
    console.log(`  ✅ ${correctDocId}`);
    count++;
    await new Promise(r => setTimeout(r, 60));
  }
  return count;
}

async function run() {
  const scripts = [
    // 法律倫理 (2301→1301 fix needed)
    'exp_112_ethics.js',
    'exp_113_ethics.js',
    'exp_111_ethics.js',
    // 刑事訴訟 (111年 2301→1301-criminal fix needed)
    'exp_111_crimproc_1.js',
    'exp_111_crimproc_2.js',
    'exp_111_crimproc_3.js',
    // 刑法 (already 1301, need remaining batches)
    'exp_112_crim_q1.js', 'exp_112_crim_q11.js', 'exp_112_crim_q16.js',
    'exp_112_crim_q21.js', 'exp_112_crim_q31.js', 'exp_112_crim_q41.js',
    'exp_113_crim_q1.js', 'exp_113_crim_q11.js', 'exp_113_crim_q21.js',
    'exp_113_crim_q31.js', 'exp_113_crim_q41.js',
    // 票據+證交 (111年 4301)
    'exp_111_nego_sec.js',
  ];

  let grand = 0;
  for (const script of scripts) {
    if (!fs.existsSync(script)) { console.log(`\nSKIP (not found): ${script}`); continue; }
    console.log(`\n📄 ${script}...`);
    const n = await processScript(script);
    grand += n;
    console.log(`  → ${n} updated`);
  }
  console.log(`\n🏁 Grand total: ${grand} docs updated`);
  process.exit();
}
run();
