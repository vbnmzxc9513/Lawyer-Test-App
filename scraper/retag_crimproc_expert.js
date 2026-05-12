/**
 * retag_crimproc_expert.js
 * 針對刑事訴訟法進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const CRIMPROC_TAXONOMY = [
  // 總則與主體
  { tag: '刑訴-訴訟主體', keys: ['法院', '管轄', '迴避', '被告', '辯護人', '選任', '律師', '被害人'] },
  { tag: '刑訴-訴訟行為', keys: ['送達', '期間', '文書', '裁判', '裁定', '判決'] },
  
  // 強制處分
  { tag: '刑訴-拘捕與羈押', keys: ['傳喚', '拘提', '逮捕', '羈押', '具保', '責付', '限制出境', '限制住居', '撤銷羈押', '延長羈押'] },
  { tag: '刑訴-搜索與扣押', keys: ['搜索', '扣押', '無票搜索', '附帶搜索', '逕行搜索', '緊急搜索', '鑑定', '身體檢查'] },
  { tag: '刑訴-通訊監察', keys: ['監聽', '通訊監察', '通訊紀錄'] },
  
  // 證據論
  { tag: '刑訴-證據能力', keys: ['證據能力', '傳聞法則', '傳聞例外', '159條', '排除法則', '違法取得'] },
  { tag: '刑訴-證明力與調查', keys: ['證明力', '舉證責任', '補強證據', '調查證據', '閱卷'] },
  { tag: '刑訴-被告自白與陳述', keys: ['自白', '不當取供', '任意性', '緘默權', '拒絕證言'] },
  { tag: '刑訴-證人與鑑定', keys: ['證人', '鑑定人', '詰問', '對質', '具結', '反詰問'] },
  
  // 程序階段
  { tag: '刑訴-偵查與起訴', keys: ['偵查', '不起訴', '緩起訴', '再議', '交付審判', '提起公訴', '偵查終結'] },
  { tag: '刑訴-審判程序', keys: ['準備程序', '言詞辯論', '自訴', '公判', '審判'] },
  { tag: '刑訴-簡捷程序', keys: ['簡易程序', '簡式審判', '協商程序'] },
  
  // 救濟與其他
  { tag: '刑訴-上訴', keys: ['上訴', '第二審', '第三審', '上訴理由'] },
  { tag: '刑訴-特別救濟', keys: ['再審', '非常上訴'] },
  { tag: '刑訴-國民法官', keys: ['國民法官', '國民參與審判'] },
  { tag: '刑訴-其他', keys: ['附帶民事', '被害人參與', '修復式司法'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年刑事訴訟法題目...`);
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-1301-criminal_procedure-`)
      .where('id', '<=', `${yr}-1301-criminal_procedure-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of CRIMPROC_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length === 0) matchedTags.push('刑訴-其他');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題刑事訴訟法題目。`);
  process.exit();
}
run();
