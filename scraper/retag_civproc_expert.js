/**
 * retag_civproc_expert.js
 * 針對民事訴訟法進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const CIVPROC_TAXONOMY = [
  { tag: '民訴-管轄', keys: ['管轄', '專屬管轄', '合意管轄', '移送', '審判權'] },
  { tag: '民訴-當事人', keys: ['當事人', '適格', '訴訟能力', '法定代理', '選定當事人', '共同訴訟', '訴訟參加'] },
  { tag: '民訴-訴訟代理', keys: ['訴訟代理', '委任', '律師'] },
  { tag: '民訴-標的', keys: ['訴訟標的', '訴之聲明', '一部請求', '聲明不備'] },
  { tag: '民訴-程序原則', keys: ['處分權主義', '辯論主義', '曉諭義務', '突襲性裁判', '適時提出', '集中審理'] },
  { tag: '民訴-訴之變更追加', keys: ['變更', '追加', '反訴'] },
  { tag: '民訴-送達', keys: ['送達', '公示送達', '寄存送達'] },
  { tag: '民訴-證據', keys: ['證據', '舉證責任', '推定', '擬制', '鑑定', '勘驗', '自白', '不爭執'] },
  { tag: '民訴-裁判', keys: ['判決', '既判力', '爭點效', '假執行', '裁定', '確定'] },
  { tag: '民訴-上訴', keys: ['上訴', '第二審', '第三審', '上訴理由', '附帶上訴'] },
  { tag: '民訴-特殊救濟', keys: ['再審', '抗告', '第三人撤銷'] },
  { tag: '民訴-簡易小額', keys: ['簡易', '小額'] },
  { tag: '民訴-調解和解', keys: ['調解', '和解'] },
  { tag: '民訴-保全程序', keys: ['保全', '假扣押', '假處分', '定暫時狀態'] },
  { tag: '民訴-家事事件', keys: ['家事', '離婚', '監護', '收養', '繼承'] },
  { tag: '民訴-督促程序', keys: ['支付命令'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年民訴題目...`);
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-3301-civil_procedure`)
      .where('id', '<=', `${yr}-3301-civil_procedure-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of CIVPROC_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      // 至少保留一個標籤
      if (matchedTags.length === 0) matchedTags.push('民訴-一般程序');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題民訴題目。`);
  process.exit();
}
run();
