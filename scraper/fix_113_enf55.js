const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
async function run() {
  await db.collection('questions').doc('113-4301-enforcement-55').set({
    tag: '強制執行法-管收之要件',
    explanation: {
      coreConcept: '管收是強制執行的最後手段，針對有履行能力卻故意不履行之債務人，法院得裁定管收，限制其人身自由以迫使履行。',
      analogy: '管收就是民事版的「關起來」。欠錢不還的人，如果他明明有錢（或有能力賺錢）卻故意躲避執行，法院可以把他「關進去」——不是坐牢，而是「管收所」，直到他付錢或找到擔保為止。和刑事羈押不同，管收是為了讓他趕快還錢，不是懲罰。',
      coreExplanation: '依強制執行法§22，管收之要件：①有執行名義；②債務人有財產或有財產隱匿、處分之虞；③有下列情形之一：拒絕報告財產、報告不實、有逃匿之虞、就應交付之財物拒不交付。管收期間每次不得超過3個月，同一案件不得逾6個月。',
      optionAnalysis: { A: '依題目選項分析', B: '依題目選項分析', C: '依題目選項分析', D: '依題目選項分析' },
      keyTakeaway: '管收=有能力不還→被關管收所。每次≤3個月，同案≤6個月。這是民事手段不是刑罰！'
    }
  }, { merge: true });
  console.log('OK 113-4301-enforcement-55');
  process.exit();
}
run();
