const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const fixes = [
  { id: "113-2301-constitutional-01", q: "貨物自由流通", ans: "D", exp: { coreConcept: "貨物應許自由流通（憲法§148）。", analogy: "台灣就像一個大超市，縣市不能自立圍牆禁賣別處貨物。", coreExplanation: "憲法§148規定貨物應許自由流通。地方自治權不得優先於此憲法層次之經濟規範。(D)錯誤。" } },
  { id: "113-2301-constitutional-02", q: "人身自由法院定義", ans: "A", exp: { coreConcept: "憲法§8法院之定義。", analogy: "法院必須是有審判權的法官坐鎮才叫法院。", coreExplanation: "依釋字392，憲法§8之法院指有審判權之法官構成之法院。(A)正確。" } },
  { id: "113-2301-constitutional-03", q: "遷徙自由限制", ans: "D", exp: { coreConcept: "不同身分國民之入出國權利。", analogy: "有戶籍有鑰匙，沒戶籍要登記，港澳適用特別法。", coreExplanation: "港澳居民適用港澳條例，非比照外國人適用入出國及移民法。(D)錯誤。" } },
  { id: "113-2301-constitutional-04", q: "政黨保障與限制", ans: "D", exp: { coreConcept: "政黨結社自由之限制。", analogy: "政黨是推理想的公益社團，不是開公司賺錢的營利單位。", coreExplanation: "法律得基於公益（如政黨法）限制政黨經營營利事業。(D)錯誤。" } },
  { id: "113-2301-constitutional-05", q: "平等權審查標準", ans: "D", exp: { coreConcept: "不同分類之合憲性審查標準。", analogy: "天生特徵用放大鏡看，刑事政策則給立法者空間。", coreExplanation: "刑事立法政策（如告訴乃論）之選擇，原則上採寬鬆審查。(D)正確。" } },
  { id: "113-2301-constitutional-06", q: "財產權社會義務", ans: "A", exp: { coreConcept: "財產權之社會義務與補償。", analogy: "為了公眾利益（如騎樓）要犧牲一點權利，但如果犧牲太大（特別犧牲），國家還是要給補償金。", coreExplanation: "形成特別犧牲時，仍應給予合理補償，而非無補償之必要。(A)錯誤。" } },
  { id: "113-2301-constitutional-07", q: "工作權保障與限制", ans: "D", exp: { coreConcept: "工作權與營業自由之保障。", analogy: "你要在哪裡開店是你的自由，政府要限制必須有法律授權，不能隨便發個公告就禁你。", coreExplanation: "營業場所之限制仍得授權主管機關發布法規命令規範，非絕對不得授權。(D)錯誤。" } },
  { id: "113-2301-constitutional-08", q: "權利救濟與訴願", ans: "D", exp: { coreConcept: "訴願程序之憲法地位。", analogy: "訴願是法院前的過濾器，法律沒規定過濾器(委員會)一定要怎麼組成，給了行政機關彈性。", coreExplanation: "憲法並未規定訴願審查委員會之具體組成方式。(D)正確。" } },
  { id: "113-2301-constitutional-09", q: "受教育權", ans: "D", exp: { coreConcept: "受教育權之內涵與限制。", analogy: "憲法保障你有上學的機會，但不代表你可以隨便跟政府要特定的教育補助費。", coreExplanation: "賦予人民請求提供「特定教育給付」之權利，非屬憲法受教育權保障之核心。(D)錯誤。" } },
  { id: "113-2301-constitutional-10", q: "法律保留原則", ans: "A", exp: { coreConcept: "層次化法律保留體系。", analogy: "大事法律定，小事（技術細節）命令定。不是每件事都要立法院親自寫法律。", coreExplanation: "並非凡是限制自由權利之事項皆應以法律直接規定，細節性事項得交由命令。(A)錯誤。" } },
  { id: "113-2301-constitutional-11", q: "未成年人人格權", ans: "D", exp: { coreConcept: "未成年人最佳利益原則。", analogy: "小朋友不是爸媽的附屬品，也不是自己說了就算，法院要看對小朋友未來最好的是什麼。", coreExplanation: "涉及未成年人時，應以其「最佳利益」為歸依，非概以未成年人意願為優先。(D)錯誤。" } },
  { id: "113-2301-constitutional-12", q: "基本權保障主體", ans: "B", exp: { coreConcept: "基本權保障之對象與範圍。", analogy: "公家開的公司（公營公司）原則上不享有基本權保障，因為它是國家的一份子，不是老百姓。", coreExplanation: "公營公司原則上不受憲法財產權之保障（因其與國家具有密切關聯性）。(B)正確。" } },
  { id: "113-2301-constitutional-13", q: "總統權力與豁免權", ans: "C", exp: { coreConcept: "總統之刑事豁免權。", analogy: "總統的「免死金牌」是為了保障國家運作，不是他私人的，所以不能在個案中隨便拋棄。", coreExplanation: "總統刑事豁免權不得於個案中拋棄。(C)錯誤。" } },
  { id: "113-2301-constitutional-14", q: "立法院備詢義務", ans: "A", exp: { coreConcept: "立法院備詢之範圍與義務。", analogy: "管錢管案子的秘書長要來，其他獨立機關(考試監察)或地方首長原則上不用來。", coreExplanation: "司法院秘書長有至立法院委員會備詢之義務。(A)正確。" } },
  { id: "113-2301-constitutional-15", q: "監察院職權", ans: "D", exp: { coreConcept: "監察院彈劾權之限制。", analogy: "監察院可以抓一般官員，但抓大官（總統）要交給憲法法庭，監察院管不到。", coreExplanation: "彈劾總統、副總統非屬監察院職權，應歸憲法法庭。(D)錯誤。" } },
  { id: "113-2301-constitutional-16", q: "司法規則制定權", ans: "A", exp: { coreConcept: "司法院之規則制定權。", analogy: "球場怎麼打球、裁判怎麼吹哨，由裁判長（司法院）定規則最專業。", coreExplanation: "就法官審理程序之技術性事項，司法院有規則制定權。(A)正確。" } },
  { id: "113-2301-constitutional-17", q: "立法委員聲請憲訴", ans: "A", exp: { coreConcept: "憲法訴訟法之聲請門檻。", analogy: "法律如果不對，1/4的立委可以聯名找大法官主持公道，緊急命令也可以喔。", coreExplanation: "符合法定人數之立委，對緊急命令有違憲疑慮時得聲請憲法審查。(A)正確。" } },
  { id: "113-2301-constitutional-18", q: "機關爭議案件", ans: "A", exp: { coreConcept: "憲法訴訟法中之機關爭議。", analogy: "這是新法寫清楚的程序，但大法官以前在解釋文中早就處理過類似的吵架案了。", coreExplanation: "機關爭議案件雖於憲訴法明文化，但以往大法官解釋即有處理過此類案件類型。(A)錯誤。" } }
];

async function run() {
  for (const f of fixes) {
    const docRef = db.collection('questions').doc(f.id);
    const update = {
      tag: "憲法-專家分類", // 先暫時給一個 Tag，稍後可以再跑一次全標籤重構
      explanation: {
        coreConcept: f.exp.coreConcept,
        analogy: f.exp.analogy,
        coreExplanation: f.exp.coreExplanation,
        keyTakeaway: f.exp.coreConcept,
        optionAnalysis: { [f.ans]: "【正確答案】" } // 簡化分析，確保答案一致
      },
      answer: f.ans
    };
    await docRef.set(update, { merge: true });
    console.log(`✅ Fixed 113-Const Q: ${f.id}`);
  }
  process.exit();
}
run();
