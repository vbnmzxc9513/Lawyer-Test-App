/**
 * retag_criminal_expert.js
 * 針對刑法進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const CRIMINAL_TAXONOMY = [
  // 總則
  { tag: '刑法-適用範圍', keys: ['時之效力', '地之效力', '從舊從輕', '屬地主義', '法律解釋', '類推適用'] },
  { tag: '刑法-客觀構成要件', keys: ['因果關係', '客觀歸責', '不作為犯', '保證人地位', '條件理論'] },
  { tag: '刑法-主觀構成要件', keys: ['故意', '過失', '意圖', '間接故意', '不確定故意'] },
  { tag: '刑法-阻卻違法', keys: ['正當防衛', '緊急避難', '依法令', '業務上正當行為', '阻卻違法'] },
  { tag: '刑法-罪責與錯誤', keys: ['責任能力', '期待可能性', '違法性認識', '事實錯誤', '法律錯誤', '客體錯誤', '打擊錯誤', '打擊誤標'] },
  { tag: '刑法-未遂犯', keys: ['未遂', '不能未遂', '中止未遂', '準中止', '障礙未遂'] },
  { tag: '刑法-正犯與共犯', keys: ['正犯', '共同正犯', '教唆', '幫助', '間接正犯', '身分犯', '參與'] },
  { tag: '刑法-罪數競合', keys: ['想像競合', '法條競合', '數罪併罰', '吸收', '不罰之後行為'] },
  { tag: '刑法-刑罰與沒收', keys: ['沒收', '追徵', '自首', '累犯', '緩刑', '假釋', '時效', '刑罰', '易科罰金'] },

  // 分則
  { tag: '刑法-生命身體罪', keys: ['殺人', '傷害', '遺棄', '墮胎', '過失致死'] },
  { tag: '刑法-自由隱私罪', keys: ['妨害自由', '強制罪', '性自主', '強制性交', '妨害秘密', '竊聽', '竊錄'] },
  { tag: '刑法-名譽信用罪', keys: ['公然侮辱', '誹謗', '妨害信用'] },
  { tag: '刑法-財產罪(非暴力)', keys: ['竊盜', '侵占', '詐欺', '背信', '收受贓物', '洗錢', '毀損'] },
  { tag: '刑法-財產罪(暴力)', keys: ['強盜', '搶奪', '恐嚇取財', '擄人勒贖'] },
  { tag: '刑法-公共安全罪', keys: ['放火', '公共危險', '醉態駕駛', '酒駕', '毒品', '飛安'] },
  { tag: '刑法-公共信用罪', keys: ['偽造', '有價證券', '貨幣', '文書', '使公務員登載不實'] },
  { tag: '刑法-國家權力罪', keys: ['貪污', '妨害公務', '投票罪', '賄選'] },
  { tag: '刑法-司法公正罪', keys: ['誣告', '偽證', '湮滅證據', '藏匿人犯'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年刑法題目...`);
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-1301-criminal-`)
      .where('id', '<=', `${yr}-1301-criminal-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of CRIMINAL_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length === 0) matchedTags.push('刑法-其他');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題刑法題目。`);
  process.exit();
}
run();
