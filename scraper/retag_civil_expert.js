/**
 * retag_civil_expert.js
 * 針對民法進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const CIVIL_TAXONOMY = [
  // 總則
  { tag: '民法-權利主體客體', keys: ['人格權', '姓名權', '肖像權', '隱私權', '失蹤', '死亡宣告', '法人', '物之成分', '主物', '從物'] },
  { tag: '民法-法律行為', keys: ['意思表示', '撤銷', '無效', '意思能力', '行為能力', '限制行為能力', '通謀虛偽', '錯誤', '詐欺', '脅迫', '附條件', '附期限'] },
  { tag: '民法-代理', keys: ['代理', '本人', '授權', '無權代理', '表見代理', '自己代理', '雙方代理'] },
  { tag: '民法-消滅時效', keys: ['時效', '中斷', '不完成'] },
  
  // 債總
  { tag: '民法-不當得利', keys: ['不當得利', '無法律上之原因', '給付', '179條'] },
  { tag: '民法-侵權行為', keys: ['侵權', '損害賠償', '184條', '185條', '188條', '191條', '192條', '193條', '194條', '195條', '精神慰撫金'] },
  { tag: '民法-無因管理', keys: ['無因管理', '172條', '176條'] },
  { tag: '民法-債務不履行', keys: ['給付不能', '給付遲延', '不完全給付', '歸責', '解除', '終止', '違約金', '225條', '226條', '227條'] },
  { tag: '民法-債之移轉與消滅', keys: ['債權讓與', '債務承擔', '抵銷', '清償', '代物清償', '提存', '免除', '混同'] },
  { tag: '民法-保全與擔保', keys: ['代位權', '242條', '撤銷訴權', '244條'] },
  
  // 債各
  { tag: '民法-買賣', keys: ['買賣', '瑕疵擔保', '危險負擔', '分期付款', '特種買賣'] },
  { tag: '民法-租賃', keys: ['租賃', '承租', '出租', '買賣不破租賃', '轉租', '租賃期限'] },
  { tag: '民法-委任承攬', keys: ['委任', '承攬', '勞務', '工作', '完成物'] },
  { tag: '民法-借貸', keys: ['借貸', '使用借貸', '消費借貸', '利息'] },
  { tag: '民法-保證合夥', keys: ['保證', '連帶保證', '人事保證', '合夥'] },
  
  // 物權
  { tag: '民法-物權變動', keys: ['登記', '交付', '善意取得', '公信力', '動產', '不動產', '758條', '759條', '761條', '801條', '948條'] },
  { tag: '民法-所有權', keys: ['所有權', '物上請求權', '767條', '共有', '應有部分', '相鄰關係'] },
  { tag: '民法-抵押權', keys: ['抵押', '最高限額', '物上代位', '流抵', '優先受償'] },
  { tag: '民法-用益物權', keys: ['地上權', '農育權', '不動產役權', '典權'] },
  { tag: '民法-占有', keys: ['占有', '占有連鎖', '占有保護'] },
  
  // 親屬繼承
  { tag: '民法-婚姻', keys: ['婚姻', '結婚', '離婚', '財產制', '剩餘財產', '婚約'] },
  { tag: '民法-父母子女', keys: ['認領', '收養', '親權', '監護', '扶養'] },
  { tag: '民法-遺產繼承', keys: ['繼承', '應繼分', '拋棄繼承', '代位繼承', '限定繼承', '繼承人'] },
  { tag: '民法-遺囑', keys: ['遺囑', '遺贈', '特留分'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年民法題目...`);
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-3301-civil-`)
      .where('id', '<=', `${yr}-3301-civil-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of CIVIL_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length === 0) matchedTags.push('民法-其他');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題民法題目。`);
  process.exit();
}
run();
