/**
 * retag_publiclaw_expert.js
 * 針對公法（憲法與行政法）進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const PUBLIC_TAXONOMY = [
  // 憲法
  { tag: '憲法-平等權', keys: ['平等', '歧視', '差別待遇', '791號', '794號'] },
  { tag: '憲法-自由權', keys: ['言論自由', '新聞自由', '出版自由', '人身自由', '居住遷徙', '宗教自由', '集會結社', '秘密通訊'] },
  { tag: '憲法-經濟社會權', keys: ['財產權', '生存權', '工作權', '受教育', '社會安全'] },
  { tag: '憲法-參政救濟權', keys: ['選舉', '罷免', '創制', '複決', '訴訟權', '請願'] },
  { tag: '憲法-概括權利', keys: ['隱私權', '性自主', '一般行為自由', '人格權'] },
  { tag: '憲法-國家機關', keys: ['總統', '立法院', '行政院', '司法院', '考試院', '監察院', '地方自治', '五院'] },
  { tag: '憲法-憲法訴訟', keys: ['大法官', '憲法法庭', '違憲審查', '解釋', '裁判審查', '法規範審查'] },
  
  // 行政法
  { tag: '行政法-原理原則', keys: ['依法行政', '法律保留', '明確性', '比例原則', '信賴保護', '不當連結', '行政自我拘束', '正當程序'] },
  { tag: '行政法-行政組織', keys: ['行政機關', '管轄', '權限移轉', '委託', '委任', '公務員', '公物'] },
  { tag: '行政法-行政處分', keys: ['行政處分', '處分之撤銷', '廢止', '附款', '負擔', '效力', '無效'] },
  { tag: '行政法-命令與契約', keys: ['法規命令', '行政規則', '行政契約', '雙務契約'] },
  { tag: '行政法-行政罰', keys: ['行政罰', '罰鍰', '沒入', '裁罰', '一行為不二罰', '責任要件'] },
  { tag: '行政法-行政執行', keys: ['行政執行', '強制執行', '怠金', '直接強制', '間接強制', '即時強制'] },
  { tag: '行政法-行政救濟', keys: ['訴願', '行政訴訟', '撤銷訴訟', '給付訴訟', '確認訴訟', '國家賠償', '損害賠償', '損失補償'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  // 掃描 2301 (憲法與行政法)
  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年公法題目...`);
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-2301-`)
      .where('id', '<=', `${yr}-2301-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of PUBLIC_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length === 0) matchedTags.push('公法-其他');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題公法題目。`);
  process.exit();
}
run();
