const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// Official answers for 2301 (綜合法學一: 憲法+行政法+國際公法+國際私法)
const fixes = [
  {id:'114-301-constitutional-12', answer:'D'},
  {id:'114-301-constitutional-13', answer:'B'},
  {id:'114-301-constitutional-14', answer:'D'},
  {id:'114-301-constitutional-15', answer:'A'},
  {id:'114-301-constitutional-16', answer:'D'},
  {id:'114-301-constitutional-17', answer:'B'},
  {id:'114-301-constitutional-19', answer:'D'},
  {id:'114-301-constitutional-20', answer:'C'},
  {id:'114-301-administrative-21', answer:'A'},
  {id:'114-301-administrative-22', answer:'D'},
  {id:'114-301-administrative-23', answer:'B'},
  {id:'114-301-administrative-24', answer:'D'},
  {id:'114-301-administrative-26', answer:'C'},
  {id:'114-301-administrative-27', answer:'D'},
  {id:'114-301-administrative-28', answer:'B'},
  {id:'114-301-administrative-29', answer:'D'},
  {id:'114-301-administrative-30', answer:'B'},
  {id:'114-301-administrative-31', answer:'C'},
  {id:'114-301-administrative-33', answer:'C'},
  {id:'114-301-administrative-34', answer:'D'},
  {id:'114-301-administrative-35', answer:'A'},
  {id:'114-301-administrative-36', answer:'B'},
  {id:'114-301-administrative-37', answer:'D'},
  {id:'114-301-administrative-38', answer:'A'},
  {id:'114-301-administrative-41', answer:'B'},
  {id:'114-301-administrative-42', answer:'C'},
  {id:'114-301-administrative-43', answer:'D'},
  {id:'114-301-administrative-44', answer:'A'},
  {id:'114-301-administrative-45', answer:'C'},
  {id:'114-301-administrative-47', answer:'A'},
  {id:'114-301-administrative-48', answer:'D'},
  {id:'114-301-administrative-49', answer:'C'},
  {id:'114-301-administrative-50', answer:'C'},
  {id:'114-301-administrative-52', answer:'A'},
  {id:'114-301-administrative-54', answer:'C'},
  {id:'114-301-administrative-56', answer:'A'},
  {id:'114-301-international_public-57', answer:'D'},
  {id:'114-301-international_public-59', answer:'D'},
  {id:'114-301-international_public-60', answer:'D'},
  {id:'114-301-international_public-62', answer:'A'},
  {id:'114-301-international_public-64', answer:'D'},
  {id:'114-301-international_public-66', answer:'A'},
  {id:'114-301-international_private-67', answer:'C'},
  {id:'114-301-international_private-68', answer:'A'},
  {id:'114-301-international_private-69', answer:'C'},
  {id:'114-301-international_private-71', answer:'B'},
  {id:'114-301-international_private-73', answer:'D'},
  {id:'114-301-international_private-74', answer:'C'},
];

async function run() {
  for (const f of fixes) {
    await db.collection('questions').doc(f.id).set({ answer: f.answer }, { merge: true });
    console.log(`Fixed ${f.id} -> ${f.answer}`);
  }
  console.log(`\nDone: Fixed ${fixes.length} answers for 2301`);
  process.exit();
}
run();
