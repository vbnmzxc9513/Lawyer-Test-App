const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// ========== 1301 刑法+刑訴+法律倫理 (75題) ==========
const official_1301 = {
  1:'B',2:'C',3:'A',4:'C',5:'D',6:'D',7:'A',8:'D',9:'B',10:'C',
  11:'B',12:'A',13:'D',14:'B',15:'A',16:'B',17:'A',18:'B',19:'D',20:'C',
  21:'D',22:'B',23:'D',24:'A',25:'C',26:'D',27:'B',28:'A',29:'C',30:'B',
  31:'C',32:'B',33:'C',34:'A',35:'C',36:'C',37:'D',38:'A',39:'C',40:'D',
  41:'B',42:'A',43:'B',44:'D',45:'C',46:'B',47:'D',48:'B',49:'D',50:'A',
  51:'D',52:'B',53:'A',54:'B',55:'D',56:'B',57:'D',58:'B',59:'C',60:'B',
  61:'D',62:'B',63:'D',64:'B',65:'D',66:'A',67:'D',68:'C',69:'B',70:'A',
  71:'C',72:'D',73:'B',74:'A',75:'B'
};

// ========== 3301 民法+民訴 (80題) ==========
const official_3301 = {
  1:'C',2:'D',3:'C',4:'D',5:'D',6:'B',7:'D',8:'B',9:'C',10:'B',
  11:'C',12:'B',13:'D',14:'D',15:'C',16:'B',17:'D',18:'A',19:'B',20:'D',
  21:'D',22:'A',23:'D',24:'B',25:'A',26:'C',27:'C',28:'A',29:'C',30:'B',
  31:'C',32:'A',33:'B',34:'A',35:'B',36:'A',37:'C',38:'A',39:'C',40:'A',
  41:'B',42:'C',43:'B',44:'C',45:'B',46:'D',47:'A',48:'B',49:'D',50:'A',
  51:'A',52:'C',53:'D',54:'B',55:'B',56:'D',57:'C',58:'B',59:'D',60:'B',
  61:'D',62:'C',63:'D',64:'B',65:'D',66:'B',67:'D',68:'B',69:'D',70:'A',
  71:'D',72:'A',73:'D',74:'C',75:'A',76:'C',77:'B',78:'C',79:'B',80:'A'
};

// ========== 4301 商法+強執+法英 (70題) ==========
const official_4301 = {
  1:'C',2:'B',3:'A',4:'C',5:'A',6:'C',7:'A',8:'B',9:'B',10:'A',
  11:'C',12:'B',13:'D',14:'B',15:'D',16:'D',17:'D',18:'B',19:'C',20:'A',
  21:'D',22:'B',23:'D',24:'A',25:'D',26:'C',27:'D',28:'C',29:'A',30:'C',
  31:'B',32:'C',33:'D',34:'D',35:'A',36:'B',37:'A',38:'C',39:'A',40:'C',
  41:'B',42:'B',43:'C',44:'B',45:'D',46:'C',47:'B',48:'D',49:'A',50:'D',
  51:'B',52:'A',53:'C',54:'D',55:'C',56:'A',57:'B',58:'B',59:'C',60:'A',
  61:'B',62:'A',63:'A',64:'D',65:'B',66:'D',67:'C',68:'A',69:'A',70:'C'
};

// Build ID mappings
const allFixes = [];

// 1301: criminal Q1-40, criminal_procedure Q41-60, legal_ethics Q61-75
for (let i = 1; i <= 40; i++) allFixes.push({ id: `114-302-criminal-${String(i).padStart(2,'0')}`, correct: official_1301[i] });
for (let i = 41; i <= 60; i++) allFixes.push({ id: `114-302-criminal_procedure-${String(i).padStart(2,'0')}`, correct: official_1301[i] });
for (let i = 61; i <= 75; i++) allFixes.push({ id: `114-302-legal_ethics-${String(i).padStart(2,'0')}`, correct: official_1301[i] });

// 3301: civil Q1-50, civil_procedure Q51-80
for (let i = 1; i <= 50; i++) allFixes.push({ id: `114-303-civil-${String(i).padStart(2,'0')}`, correct: official_3301[i] });
for (let i = 51; i <= 80; i++) allFixes.push({ id: `114-303-civil_procedure-${String(i).padStart(2,'0')}`, correct: official_3301[i] });

// 4301: company Q1-15, insurance Q16-25, negotiable_instruments Q26-35, securities Q36-45, enforcement Q46-55, legal_english Q56-70
for (let i = 1; i <= 15; i++) allFixes.push({ id: `114-304-company-${String(i).padStart(2,'0')}`, correct: official_4301[i] });
for (let i = 16; i <= 25; i++) allFixes.push({ id: `114-304-insurance-${String(i).padStart(2,'0')}`, correct: official_4301[i] });
for (let i = 26; i <= 35; i++) allFixes.push({ id: `114-304-negotiable_instruments-${String(i).padStart(2,'0')}`, correct: official_4301[i] });
for (let i = 36; i <= 45; i++) allFixes.push({ id: `114-304-securities-${String(i).padStart(2,'0')}`, correct: official_4301[i] });
for (let i = 46; i <= 55; i++) allFixes.push({ id: `114-304-enforcement-${String(i).padStart(2,'0')}`, correct: official_4301[i] });
for (let i = 56; i <= 70; i++) allFixes.push({ id: `114-304-legal_english-${String(i).padStart(2,'0')}`, correct: official_4301[i] });

async function run() {
  let fixed = 0, missing = 0, correct = 0;

  for (const item of allFixes) {
    const snap = await db.collection('questions').doc(item.id).get();
    if (!snap.exists) {
      console.log(`MISSING: ${item.id}`);
      missing++;
      continue;
    }
    const dbAnswer = snap.data().answer;
    if (dbAnswer !== item.correct) {
      await db.collection('questions').doc(item.id).set({ answer: item.correct }, { merge: true });
      console.log(`FIXED ${item.id}: ${dbAnswer} -> ${item.correct}`);
      fixed++;
    } else {
      correct++;
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`Total checked: ${allFixes.length}`);
  console.log(`Already correct: ${correct}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Missing: ${missing}`);
  process.exit();
}
run();
