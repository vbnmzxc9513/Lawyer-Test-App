/**
 * retag_commercial_expert.js
 * 針對商事法（公司、證交、保險、票據）進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const COMMERCIAL_TAXONOMY = [
  // 公司法
  { tag: '公司法-總則與登記', keys: ['負責人', '登記', '分公司', '權利能力', '公司名稱', '負責人責任'] },
  { tag: '公司法-股東會', keys: ['股東會', '召集', '決議', '表決權', '股東臨時會'] },
  { tag: '公司法-董事與監察人', keys: ['董事', '監察人', '審計委員會', '薪酬委員會', '受任人義務', '忠實義務', '競業禁止'] },
  { tag: '公司法-財務與盈餘', keys: ['發行新股', '公積', '盈餘分派', '股利', '公司債', '增資'] },
  { tag: '公司法-變更與併購', keys: ['減資', '合併', '解散', '清算', '企業併購'] },
  { tag: '公司法-閉鎖性公司', keys: ['閉鎖性'] },

  // 證券交易法
  { tag: '證交法-募集與發行', keys: ['有價證券', '募集', '私募', '發行', '承銷'] },
  { tag: '證交法-資訊公開', keys: ['資訊公開', '重大訊息', '定期報告', '財報', '公開說明書', '虛偽不實'] },
  { tag: '證交法-公司治理', keys: ['獨立董事', '審計委員會', '內部控制', '薪資報酬'] },
  { tag: '證交法-不法交易', keys: ['內線交易', '操縱市場', '短線交易', '歸入權', '詐欺', '155條', '157條'] },
  { tag: '證交法-公開收購', keys: ['公開收購', '委託書'] },

  // 保險法
  { tag: '保險法-總則與契約', keys: ['保險利益', '告知義務', '最大誠信', '保險費', '特約條款', '復效', '停效'] },
  { tag: '保險法-財產保險', keys: ['財產保險', '損害填補', '複保險', '代位權', '火災保險', '責任保險'] },
  { tag: '保險法-人身保險', keys: ['人身保險', '人壽保險', '受益人', '自殺條款', '傷害保險', '健康保險'] },

  // 票據法
  { tag: '票據法-總則', keys: ['票據行為', '背書', '偽造', '變造', '抗辯', '喪失', '追索權', '提示', '改寫'] },
  { tag: '票據法-各論', keys: ['匯票', '本票', '支票', '平行線支票', '強制執行'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年商事法題目...`);
    // 掃描 4301 (公司, 證交, 保險, 票據等)
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-4301-`)
      .where('id', '<=', `${yr}-4301-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of COMMERCIAL_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length === 0) matchedTags.push('商事法-其他');

      const tagString = matchedTags.join(', ');
      await doc.ref.update({ tag: tagString });
      console.log(`  ✅ ${doc.id}: ${tagString}`);
      totalFixed++;
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題商事法題目。`);
  process.exit();
}
run();
