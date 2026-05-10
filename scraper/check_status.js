const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkStatus() {
  console.log('Fetching questions from Firestore...');
  const snapshot = await db.collection('questions').get();
  console.log(`Total questions found: ${snapshot.size}`);

  const status = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    // ID format: YEAR-CODE-SUBJECT-NUM or similar
    // Based on update script: 111-2301-constitutional-01
    const parts = id.split('-');
    const year = parts[0];
    
    // Determine subject - this might be tricky if format varies
    // Let's try to find if it has an explanation
    const hasExplanation = !!(data.explanation && data.explanation.coreExplanation);

    if (!status[year]) {
      status[year] = {
        total: 0,
        withExplanation: 0,
        subjects: {}
      };
    }

    status[year].total++;
    if (hasExplanation) {
      status[year].withExplanation++;
    }

    // Try to extract subject from ID or data
    let subject = data.subject || parts[2] || 'unknown';
    if (!status[year].subjects[subject]) {
      status[year].subjects[subject] = {
        total: 0,
        withExplanation: 0
      };
    }
    status[year].subjects[subject].total++;
    if (hasExplanation) {
      status[year].subjects[subject].withExplanation++;
    }
  });

  console.log('\n--- Firestore Question Status Report ---');
  for (const year in status) {
    const y = status[year];
    const percent = ((y.withExplanation / y.total) * 100).toFixed(1);
    console.log(`\nYear ${year}: ${y.withExplanation}/${y.total} (${percent}%)`);
    for (const sub in y.subjects) {
      const s = y.subjects[sub];
      const sPercent = ((s.withExplanation / s.total) * 100).toFixed(1);
      console.log(`  - ${sub}: ${s.withExplanation}/${s.total} (${sPercent}%)`);
    }
  }
}

checkStatus().catch(console.error);
