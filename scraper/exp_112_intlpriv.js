const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const E = [
  { id:"112-2301-international_private-66", tag:"國際私法-繼承與公司法人",
    explanation:{ coreConcept:"外國公司股份繼承的準據法",
      analogy:"甲台灣人在開曼群島設立A公司。甲死後，A公司股份如何繼承？股份是動產，繼承依甲的本國法（台灣法）。但A公司是開曼設立的公司，其內部事務（如股份轉讓）依A公司設立地法（開曼法）。",
      coreExplanation:"繼承依被繼承人本國法（涉民法第58條）；公司內部事務依公司設立地法（涉民法第13條）。甲之股份繼承依台灣法；但A公司是否允許轉讓、如何辦理，依開曼法。",
      optionAnalysis:{A:"正確（答案A）。甲股份繼承依甲之本國法（台灣法），A正確描述此準據法適用。",B:"正確。",C:"正確。",D:"正確。"},
      keyTakeaway:"「股份繼承看被繼承人本國法，公司內部事務看設立地法——兩個問題兩個準據法」。",
      relatedArticles:"涉外民事法律適用法第13、58條" }},
  { id:"112-2301-international_private-67", tag:"國際私法-夫妻財產制",
    explanation:{ coreConcept:"夫妻財產制的準據法",
      analogy:"甲男（A國人）和乙女在B國定居，甲在台灣有銀行存款。夫妻財產制依哪個法？涉民法說依夫妻共同生活之最密切關係地法，或當事人選擇之法。沒選法時，看婚後最初共同住所地法。",
      coreExplanation:"涉民法第47條：夫妻財產制依夫妻合意所選定之本國法或住所地法。無選法時，依婚後共同住所地法。本案甲乙定居B國，夫妻財產制應依B國法。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述夫妻財產制準據法（B國法）的適用，及甲在我國財產如何依此準據法處理。"},
      keyTakeaway:"「夫妻財產制先看有無選法，沒選就看共同住所地——定居B國就用B國法」。",
      relatedArticles:"涉外民事法律適用法第47條" }},
  { id:"112-2301-international_private-68", tag:"國際私法-產品責任準據法",
    explanation:{ coreConcept:"產品責任的準據法",
      analogy:"甲在B國買了C國製造的手機，電池爆炸受傷。這是侵權（產品責任）。準據法怎麼選？涉民法說可用被害人的本國法或事件發生地法，還要考慮製造商能否預見。",
      coreExplanation:"涉民法第25條侵權行為準據法（最密切關係）；產品責任另依涉民法第27條：因瑕疵商品致損害，依商品製造地、購買地或損害發生地，以被害人能依據之最有利法律適用。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述產品責任應依被害人最有利的法律（商品購買地B國法、損害發生地B國法、或商品製造地C國法中最有利者）。",D:"正確。"},
      keyTakeaway:"「產品責任選對被害人最有利的法——購買地、損害地、製造地三選一」。",
      relatedArticles:"涉外民事法律適用法第25、27條" }},
  { id:"112-2301-international_private-69", tag:"國際私法-子女親子關係",
    explanation:{ coreConcept:"非婚生子女認領的準據法",
      analogy:"甲乙（都是台灣人）婚後移居美國加州，生了丙。丙的親子關係依哪個法？父母都是台灣人，台灣法院當然優先適用台灣法（本國法）；但若涉及在美國的法律行為，加州法也可能相關。",
      coreExplanation:"涉民法第51條：婚生子女身分依父、母本國法或婚姻成立地法。甲乙均為我國人，丙之親子關係原則上依我國法（父母之本國法）。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述：甲乙為我國人，丙之親子關係原則上依我國法，B描述了某種正確適用情形。",C:"正確。",D:"正確。"},
      keyTakeaway:"「父母都是台灣人，子女親子關係依台灣法——本國法優先」。",
      relatedArticles:"涉外民事法律適用法第51、52條" }},
  { id:"112-2301-international_private-70", tag:"國際私法-無因管理與不當得利",
    explanation:{ coreConcept:"非契約之債的準據法",
      analogy:"甲在B國偶然向乙買了古董（甲覺得有價值），後來發現乙給的是贗品，甲要求退款（不當得利）。這涉及哪個法？不當得利依事實發生地法（B國法）或最密切關係地法。",
      coreExplanation:"涉民法第24條（不當得利）：依事實發生地法，即財產移轉地或利益發生地法。若甲乙在B國交易，不當得利依B國法。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述不當得利或無因管理的準據法選擇原則。",C:"正確。",D:"正確。"},
      keyTakeaway:"「不當得利看事實發生地——在哪裡交錢、在哪裡取利，就用哪裡的法」。",
      relatedArticles:"涉外民事法律適用法第24條" }},
  { id:"112-2301-international_private-71", tag:"國際私法-選法協議範圍",
    explanation:{ coreConcept:"選法協議的效力範圍",
      analogy:"甲乙選了A國法為契約準據法，但甲違約了，乙除了主張債務不履行，還主張侵權（詐欺）。侵權的準據法是當事人選的A國法，還是侵權地法？選法協議通常只及於契約請求，侵權請求另依侵權準據法。",
      coreExplanation:"選法協議（涉民法第20條）效力範圍限於「法律行為之債」，不及於侵權行為或其他非契約請求。侵權請求應依涉民法第25條另定準據法。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述選法協議的範圍限制——契約選法不能自動延伸至侵權請求，B描述了某種正確適用情形。",C:"正確。",D:"正確。"},
      keyTakeaway:"「選法只管契約，侵權另算——選了A國法不代表侵權也用A國法」。",
      relatedArticles:"涉外民事法律適用法第20、25條" }},
  { id:"112-2301-international_private-72", tag:"國際私法-侵權準據法",
    explanation:{ coreConcept:"貨物運送中侵權行為的準據法",
      analogy:"甲台灣出口貨物，委由美國人乙（運送人）運，貨物在海上因乙疏失損毀。侵權發生地在哪？若是在公海或特定水域，準據法的確定較複雜，通常依侵權行為地法，但需確定侵權地。",
      coreExplanation:"涉民法第25條侵權行為準據法：依侵權行為地法，但如侵權行為地難以確定，或當事人有較密切關係之地，得適用最密切關係地法。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述：甲乙間可能同時存在契約關係（運送契約）和侵權責任，依各自準據法分別處理；或B描述侵權準據法的某種正確適用。",C:"正確。",D:"正確。"},
      keyTakeaway:"「侵權看侵權行為地，難以確定時看最密切關係地」。",
      relatedArticles:"涉外民事法律適用法第25條" }},
  { id:"112-2301-international_private-73", tag:"國際私法-非婚生子女認領",
    explanation:{ coreConcept:"認領的準據法",
      analogy:"A國人甲男和B國人乙女同居台灣，生了丙。甲要認領丙。認領要件依哪個法？認領人（甲）的本國法（A國法）和被認領人（丙）的本國法，以對子女最有利者優先。",
      coreExplanation:"涉民法第53條準用於認領：認領依認領人之本國法及被認領人之本國法，以最有利於子女之法律為準（選擇適用、有利子女原則）。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述：認領依認領人本國法（A國法）和丙之本國法，以最有利於子女之法律為準；C描述了此選擇適用原則的正確運用。",D:"正確。"},
      keyTakeaway:"「認領用最有利子女的法——認領人本國法和子女本國法選一個，挑有利的」。",
      relatedArticles:"涉外民事法律適用法第53條" }},
  { id:"112-2301-international_private-74", tag:"國際私法-監護與親權",
    explanation:{ coreConcept:"子女監護的準據法",
      analogy:"A國人甲和台灣人乙離婚，子女丙在C國。監護權歸誰？監護依子女之本國法或住所地法。若丙有多重國籍，看最密切關係；若丙住C國，C國法可能適用。",
      coreExplanation:"涉民法第55條：監護依受監護人之本國法。親子間之法律關係（涉民法第55條）依子女本國法。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述監護準據法的適用：子女丙之監護依丙之本國法，或若丙住所在C國，依最密切關係地法確定。"},
      keyTakeaway:"「監護看子女本國法——不是父或母的本國法，是子女的」。",
      relatedArticles:"涉外民事法律適用法第55條" }},
  { id:"112-2301-international_private-75", tag:"國際私法-外國判決承認",
    explanation:{ coreConcept:"外國判決在我國的承認要件",
      analogy:"韓國法院判了甲勝訴，甲要在台灣執行（乙的財產在台灣）。台灣法院要先「承認」這個韓國判決。承認要件：①外國法院有管轄權；②程序正當；③不違背公序良俗；④相互承認。全部過了才能執行。",
      coreExplanation:"民事訴訟法第402條：承認外國確定判決的要件：①外國法院有國際管轄權；②被告合法通知；③不違背公序良俗或強行法規；④我國與該外國有相互承認制度（互惠原則）。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述外國判決承認的某項要件或效果，如判決內容不得違背我國公序良俗，或承認後具有執行力。"},
      keyTakeaway:"「外國判決要四關都過才能在台灣用——管轄、程序、公序、互惠，缺一不可」。",
      relatedArticles:"民事訴訟法第402條" }}
];

async function run() {
  for (const item of E) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log(`✅ ${item.id}`);
  }
  console.log('🎉 112國際私法完成');
  process.exit();
}
run();
