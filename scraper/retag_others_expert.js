/**
 * retag_others_expert.js
 * 針對強執、國私、國公、法倫、法英進行專家級多重標籤映射
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const OTHERS_TAXONOMY = [
  // 強制執行法
  { tag: '強執-總則與名義', keys: ['執行名義', '執行標的', '執行力', '執行處', '囑託'] },
  { tag: '強執-金錢債權執行', keys: ['動產', '不動產', '查封', '拍賣', '分配', '金錢債權', '換價', '承受'] },
  { tag: '強執-非金錢執行', keys: ['物之交付', '行為', '不行為', '強制遷讓'] },
  { tag: '強執-救濟與保全', keys: ['聲明異議', '債務人異議之訴', '第三人異議之訴', '假扣押執行', '假處分執行', '12條', '14條', '15條'] },

  // 國際私法 (涉外法)
  { tag: '國私-總則', keys: ['準據法', '反致', '公共秩序', '法律規避', '一法域'] },
  { tag: '國私-主體與行為', keys: ['行為能力', '人格權', '法人', '法律行為之方式'] },
  { tag: '國私-債權與物權', keys: ['契約', '侵權', '不當得利', '無因管理', '物之所在地'] },
  { tag: '國私-身分與繼承', keys: ['婚姻', '離婚', '父母子女', '收養', '繼承', '遺囑'] },

  // 法律倫理
  { tag: '法倫-法官倫理', keys: ['法官法', '法官倫理', '法官行為'] },
  { tag: '法倫-檢察官倫理', keys: ['檢察官倫理', '檢察官守則'] },
  { tag: '法倫-律師倫理', keys: ['律師法', '律師倫理', '律師酬金', '保密義務', '利益衝突'] },

  // 國際公法
  { tag: '國公-法源與條約', keys: ['條約', '法源', '國際法', '慣例'] },
  { tag: '國公-國家與領土', keys: ['國家', '領土', '主權', '國籍', '引渡', '管轄豁免'] },
  { tag: '國公-外交與組織', keys: ['外交', '使節', '領事', '國際組織', '聯合國', '海洋法'] },

  // 法學英文
  { tag: '法英-術語辨析', keys: ['court', 'judge', 'lawyer', 'defendant', 'plaintiff', 'contract', 'tort', 'liability', 'constitution', 'procedure'] },
  { tag: '法英-案例閱讀', keys: ['case', 'ruling', 'opinion', 'dissent', 'precedent'] }
];

async function run() {
  const years = ['111', '112', '113'];
  let totalFixed = 0;

  for (const yr of years) {
    console.log(`\n重新分類 ${yr} 年小科題目...`);
    // 掃描 1301(法倫), 2301(國公/國私), 4301(強執/法英)
    const snapshot = await db.collection('questions')
      .where('id', '>=', `${yr}-`)
      .where('id', '<=', `${yr}-z`)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const id = doc.id;
      
      // 排除大科
      if (id.includes('civil') || id.includes('criminal') || id.includes('administrative') || id.includes('constitutional')) {
        if (!id.includes('civil_procedure') && !id.includes('criminal_procedure')) continue;
      }

      const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
      
      const matchedTags = [];
      for (const item of OTHERS_TAXONOMY) {
        if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
          matchedTags.push(item.tag);
        }
      }

      if (matchedTags.length > 0) {
        const tagString = matchedTags.join(', ');
        // 如果原本已經有大科標籤（如民訴），則保留並追加
        const finalTag = data.tag && !data.tag.includes('刑法-其他') ? `${data.tag}, ${tagString}` : tagString;
        
        // 去重
        const uniqueTags = [...new Set(finalTag.split(', ').map(t => t.trim()))].join(', ');
        
        await doc.ref.update({ tag: uniqueTags });
        console.log(`  ✅ ${id}: ${uniqueTags}`);
        totalFixed++;
      }
    }
  }

  console.log(`\n🏁 完成！共重分類 ${totalFixed} 題其餘科目題目。`);
  process.exit();
}
run();
