const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function run() {
  await db.collection('config').doc('report').set({
    email: 'vbnmzxc9513@gmail.com',
    enabled: true
  });
  console.log('Done: config/report saved');
  process.exit();
}
run();
