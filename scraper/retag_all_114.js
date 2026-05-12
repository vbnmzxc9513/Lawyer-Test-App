/**
 * retag_all_114.js
 * 整合所有科目分類邏輯，一次性優化 114 年全題庫標籤
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// 整合所有分類體系
const MASTER_TAXONOMY = [
  // 民訴
  { tag: '民訴-管轄', keys: ['管轄', '專屬管轄', '合意管轄', '移送'] },
  { tag: '民訴-當事人', keys: ['當事人', '適格', '訴訟能力', '選定當事人', '共同訴訟', '訴訟參加'] },
  { tag: '民訴-標的', keys: ['訴訟標的', '訴之聲明', '一部請求'] },
  { tag: '民訴-程序原則', keys: ['處分權主義', '辯論主義', '曉諭義務', '適時提出'] },
  { tag: '民訴-證據', keys: ['證據', '舉證責任', '鑑定', '自白'] },
  { tag: '民訴-裁判', keys: ['判決', '既判力', '爭點效', '假執行'] },
  { tag: '民訴-上訴救濟', keys: ['上訴', '再審', '抗告', '第三人撤銷'] },
  { tag: '民訴-特殊程序', keys: ['簡易', '小額', '調解', '和解', '保全', '家事', '督促'] },

  // 民法
  { tag: '民法-總則', keys: ['法律行為', '意思表示', '撤銷', '無效', '代理', '授權', '消滅時效', '人格權', '法人'] },
  { tag: '民法-債總', keys: ['不當得利', '侵權', '無因管理', '債務不履行', '給付不能', '債權讓與', '抵銷', '保全', '代位權'] },
  { tag: '民法-債各', keys: ['買賣', '租賃', '委任', '承攬', '借貸', '保證', '合夥', '瑕疵擔保'] },
  { tag: '民法-物權', keys: ['物權變動', '登記', '善意取得', '所有權', '共有', '抵押', '占有'] },
  { tag: '民法-身分繼承', keys: ['婚姻', '離婚', '財產制', '父母子女', '認領', '收養', '繼承', '遺產', '遺囑', '特留分'] },

  // 刑法
  { tag: '刑法-總則', keys: ['因果關係', '故意', '過失', '阻卻違法', '正當防衛', '緊急避難', '責任能力', '錯誤', '未遂', '正犯', '共犯', '競合', '沒收', '自首'] },
  { tag: '刑法-分則', keys: ['殺人', '傷害', '遺棄', '自由', '強制', '性自主', '隱私', '竊盜', '強盜', '詐欺', '侵占', '背信', '偽造', '公共危險', '貪污', '誣告', '偽證'] },

  // 刑訴
  { tag: '刑訴-主體與處分', keys: ['法院', '管轄', '被告', '辯護', '傳喚', '拘提', '逮捕', '羈押', '搜索', '扣押', '監聽'] },
  { tag: '刑訴-證據論', keys: ['證據能力', '傳聞', '排除法則', '自白', '證人', '鑑定', '詰問'] },
  { tag: '刑訴-程序救濟', keys: ['偵查', '起訴', '緩起訴', '再議', '自訴', '審判', '簡易', '上訴', '再審', '非常上訴'] },

  // 公法
  { tag: '憲法-基本權', keys: ['平等', '言論自由', '人身自由', '財產權', '生存權', '工作權', '隱私', '性自主'] },
  { tag: '憲法-組織與訴訟', keys: ['總統', '立法院', '行政院', '權力分立', '地方自治', '憲法訴訟', '大法官', '違憲審查'] },
  { tag: '行政法-總論', keys: ['原理原則', '比例原則', '信賴保護', '行政組織', '管轄', '公務員'] },
  { tag: '行政法-作用與罰', keys: ['行政處分', '行政契約', '行政規則', '法規命令', '行政罰', '行政執行'] },
  { tag: '行政法-救濟', keys: ['訴願', '行政訴訟', '撤銷訴訟', '國家賠償', '損失補償'] },

  // 商法與小科
  { tag: '公司法', keys: ['股東會', '董事', '監察人', '負責人', '盈餘', '發行新股', '併購', '閉鎖性'] },
  { tag: '證交法', keys: ['募集', '資訊公開', '內線交易', '操縱市場', '短線交易', '公開收購'] },
  { tag: '票據保險', keys: ['票據', '背書', '本票', '支票', '保險利益', '告知義務', '財產保險', '人身保險'] },
  { tag: '強執救濟', keys: ['執行名義', '金錢債權', '動產', '不動產', '查封', '拍賣', '聲明異議', '異議之訴'] },
  { tag: '國私國公', keys: ['準據法', '反致', '涉外', '條約', '主權', '領土', '外交'] },
  { tag: '法倫法英', keys: ['法官倫理', '律師倫理', '檢察官倫理', 'court', 'plaintiff', 'defendant', 'contract', 'tort'] }
];

async function run() {
  console.log(`🚀 開始為 114 年執行全科目標籤優化...`);
  const snapshot = await db.collection('questions')
    .where('id', '>=', '114-')
    .where('id', '<=', '114-z')
    .get();

  let fixedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const textToScan = `${data.questionText} ${data.explanation?.coreConcept || ''} ${data.explanation?.coreExplanation || ''} ${JSON.stringify(data.options)}`.toLowerCase();
    
    const matchedTags = [];
    for (const item of MASTER_TAXONOMY) {
      if (item.keys.some(k => textToScan.includes(k.toLowerCase()))) {
        matchedTags.push(item.tag);
      }
    }

    if (matchedTags.length === 0) matchedTags.push('114-一般');

    const tagString = matchedTags.join(', ');
    await doc.ref.update({ tag: tagString });
    console.log(`  ✅ ${doc.id}: ${tagString}`);
    fixedCount++;
  }

  console.log(`\n🏁 114 年優化完成！共處理 ${fixedCount} 題。`);
  process.exit();
}
run();
