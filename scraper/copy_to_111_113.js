// Copy 112 nego/enf/eng explanations to 113 with same content (same exam content, different year IDs)
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function copyExplanations(sourceIds, targetYear) {
  for (const srcId of sourceIds) {
    const srcDoc = await db.collection('questions').doc(srcId).get();
    if (!srcDoc.exists) { console.log('SRC NOT FOUND: ' + srcId); continue; }
    const data = srcDoc.data();
    if (!data.explanation || !data.explanation.coreConcept) { console.log('SRC NO EXP: ' + srcId); continue; }

    // Build target ID: replace year
    const targetId = srcId.replace(/^\d{3}-/, targetYear + '-');
    const targetDoc = await db.collection('questions').doc(targetId).get();
    if (!targetDoc.exists) { console.log('TARGET NOT FOUND: ' + targetId); continue; }

    await db.collection('questions').doc(targetId).set({
      tag: data.tag,
      explanation: data.explanation
    }, { merge: true });
    console.log('OK ' + targetId);
    await new Promise(r => setTimeout(r, 60));
  }
}

async function run() {
  const nego112 = [];
  for (let n = 26; n <= 35; n++) nego112.push(`112-4301-negotiable_instruments-${String(n).padStart(2,'0')}`);
  
  const enf112 = [];
  for (let n = 46; n <= 53; n++) enf112.push(`112-4301-enforcement-${String(n).padStart(2,'0')}`);

  const eng112 = [];
  for (let n = 56; n <= 65; n++) eng112.push(`112-4301-legal_english-${String(n).padStart(2,'0')}`);

  console.log('=== Copying nego to 113 ===');
  await copyExplanations(nego112, '113');
  console.log('=== Copying enf to 113 ===');
  await copyExplanations(enf112, '113');
  console.log('=== Copying eng to 113 ===');
  await copyExplanations(eng112, '113');

  // Also 111 enf + eng
  const enf111 = [];
  for (let n = 46; n <= 52; n++) enf111.push(`112-4301-enforcement-${String(n).padStart(2,'0')}`);
  const eng111 = [];
  for (let n = 56; n <= 65; n++) eng111.push(`112-4301-legal_english-${String(n).padStart(2,'0')}`);
  console.log('=== Copying enf to 111 ===');
  await copyExplanations(enf111, '111');
  console.log('=== Copying eng to 111 ===');
  await copyExplanations(eng111, '111');

  console.log('Done!');
  process.exit();
}
run();
