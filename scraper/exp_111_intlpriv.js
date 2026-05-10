const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const E = [
  { id:"111-2301-international_private-66", tag:"國際私法-公司設立地法",
    explanation:{ coreConcept:"外國公司子公司股份收購的準據法",
      analogy:"台灣甲公司收購A國乙公司在B國設立的丙公司股份。股份收購這個行為依哪個法？股份是丙公司（B國設立）的股份，丙公司內部事務依B國法；但收購契約本身依當事人選法或最密切關係地法。",
      coreExplanation:"公司法律人格及內部事務依公司設立地法（涉民法第13條）；股份轉讓契約依契約準據法（涉民法第20條）。乙的B國子公司股份，其公司內部事務依B國法。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述收購B國丙公司股份的準據法：公司內部事務依B國法，契約依雙方選法或最密切關係地法。",D:"正確。"},
      keyTakeaway:"「公司股份看設立地法，收購契約看選法或最密切——兩個問題分開算」。",
      relatedArticles:"涉外民事法律適用法第13、20條" }},
  { id:"111-2301-international_private-67", tag:"國際私法-結婚實質要件",
    explanation:{ coreConcept:"結婚實質要件的準據法",
      analogy:"台灣人甲（22歲）要在A國和A國人乙（18歲）結婚。結婚要件（年齡、同意等）要符合哪個法？涉民法說各依當事人本國法（累積適用）——甲依台灣法符合，乙依A國法符合，才能結婚。",
      coreExplanation:"涉民法第46條：結婚實質要件依各當事人本國法（累積適用）。甲依我國法（民法第980條：結婚年齡18歲）；乙依A國法。兩者均須符合。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述：甲乙結婚，各依其本國法（累積適用），我國法和A國法的結婚要件均須符合。",C:"正確。",D:"正確。"},
      keyTakeaway:"「跨國結婚兩邊的法律都要過——各依本國法，累積適用缺一不可」。",
      relatedArticles:"涉外民事法律適用法第46條" }},
  { id:"111-2301-international_private-68", tag:"國際私法-侵權行為準據法",
    explanation:{ coreConcept:"交通事故侵權的準據法",
      analogy:"香港人甲在台灣被台灣人乙酒駕撞傷。侵權行為地在台灣，準據法依侵權行為地法（台灣法）。但涉民法還允許在關係最密切時選其他法——甲乙都在台灣發生，台灣法最密切最合理。",
      coreExplanation:"涉民法第25條：侵權行為依侵權行為地法。若加害人與被害人有共同慣居地，依慣居地法；若其他地法與事件關係更密切，依最密切關係地法。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述台灣為侵權行為地，應依台灣法（侵權行為地法），甲的損害賠償請求依我國法處理。",D:"正確。"},
      keyTakeaway:"「在台灣發生的侵權，用台灣法——行為地法是基本原則」。",
      relatedArticles:"涉外民事法律適用法第25條" }},
  { id:"111-2301-international_private-69", tag:"國際私法-物權準據法",
    explanation:{ coreConcept:"動產與不動產物權準據法的區別",
      analogy:"房子的所有權看所在地（台灣法）；手表的所有權也看所在地（但動產移動，所在地可能改變）。運輸中的貨物，物之所在地不斷改變，所以另有特別規定。",
      coreExplanation:"涉民法第38條：物權依物之所在地法。不動產物權依所在地法（絕對）；動產物權依現所在地法；但運輸中貨物另有例外。物權準據法當事人不能自行選擇（強制性）。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述物權準據法的某項原則，如動產依現所在地法，或運輸中貨物的例外規定。",C:"正確。",D:"正確。"},
      keyTakeaway:"「物權看現在在哪裡——不動產看所在地，動產看現所在地，運輸中看發送地」。",
      relatedArticles:"涉外民事法律適用法第38條" }},
  { id:"111-2301-international_private-70", tag:"國際私法-不當得利準據法",
    explanation:{ coreConcept:"不當得利的準據法選擇",
      analogy:"甲多給了乙一筆錢（誤付），要求返還。這是不當得利。發生地在哪？台灣匯款到B國，B國法可能適用。但若甲乙間有既有關係（如契約），不當得利可能依該關係之準據法。",
      coreExplanation:"涉民法第24條：不當得利依其事實發生地法；但當事人間有既存法律關係，且不當得利與該關係密切者，依規範該法律關係之準據法（從屬關係準據法）。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"錯誤（答案C）。C若說不當得利一律依被告本國法，或一律依原告所選擇的法——這不符合涉民法第24條的規定。",D:"正確。"},
      keyTakeaway:"「不當得利看事實發生地，有既存關係從其關係準據法——不是亂選的」。",
      relatedArticles:"涉外民事法律適用法第24條" }},
  { id:"111-2301-international_private-71", tag:"國際私法-夫妻間準據法",
    explanation:{ coreConcept:"夫妻間法律關係的準據法",
      analogy:"台灣人甲和A國人乙結婚，設住所於B國，常回台灣。夫妻之間的法律關係（如扶養、同居義務）依哪個法？涉民法說依婚姻生活最密切關係地法——定居B國，B國法優先，但也可能選我國法。",
      coreExplanation:"涉民法第47、48條：夫妻間之法律關係（扶養、同居等）依夫妻共同住所地法（B國法）。夫妻財產制另依涉民法第47條選法規定。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述夫妻間法律關係準據法（B國法）的適用，或描述特定情形下我國法的適用條件。",D:"正確。"},
      keyTakeaway:"「夫妻關係看共同住所地——定居B國，就用B國法處理同居扶養義務」。",
      relatedArticles:"涉外民事法律適用法第48條" }},
  { id:"111-2301-international_private-72", tag:"國際私法-繼承與遺囑",
    explanation:{ coreConcept:"繼承準據法與遺囑有效性",
      analogy:"甲台灣人民國95年立了遺囑，後來丁（女兒）取得A國籍常住A國。甲死亡，丁的繼承份額怎麼算？繼承依甲的本國法（台灣法），但若甲曾更改國籍，依死亡時本國法。",
      coreExplanation:"涉民法第58條：繼承依被繼承人死亡時之本國法。遺囑方式（涉民法第60條）依遺囑作成地法或遺囑人本國法。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述繼承準據法或遺囑有效性的正確適用情形。",C:"正確。",D:"正確。"},
      keyTakeaway:"「繼承看死亡時本國法，遺囑方式看作成地法——兩個時間點要注意」。",
      relatedArticles:"涉外民事法律適用法第58、60條" }},
  { id:"111-2301-international_private-73", tag:"國際私法-外國判決承認",
    explanation:{ coreConcept:"外國訴訟繫屬與我國程序",
      analogy:"日本法院正在審甲（台灣人）和乙的案子，乙同時在台灣也告了甲。台灣法院怎麼辦？我國法院有裁量空間——可以繼續審理（因為外國判決不一定能在台灣承認），也可以停止等日本判決，視情況決定。",
      coreExplanation:"國際訴訟競合：我國法院對已在外國繫屬之案件，在無明文規定下，採裁量原則——非當然停止訴訟，但可裁量停止以避免矛盾判決。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述我國法院對國際訴訟競合的處理方式——裁量，而非強制停止或繼續，B描述了某種正確的程序處理。",C:"正確。",D:"正確。"},
      keyTakeaway:"「外國已在打，台灣法院有裁量空間——不是一定要停止，也不是一定繼續」。",
      relatedArticles:"民事訴訟法第182、402條（類推）" }},
  { id:"111-2301-international_private-74", tag:"國際私法-親權準據法",
    explanation:{ coreConcept:"子女親權的準據法",
      analogy:"台灣人甲和A國人乙結婚，生下台灣和A國雙重國籍的丙（住台灣）。甲乙離婚，丙的親權誰有？依涉民法，依子女的本國法或住所地法。丙有我國籍且住台灣，優先依我國法。",
      coreExplanation:"涉民法第55條：親子間之法律關係（包含親權）依子女之本國法。子女有多重國籍時，依關係最切之本國法（有我國籍優先我國法）。",
      optionAnalysis:{A:"正確（答案A）。丙有我國國籍且住我國，親子關係（親權）依我國法，A正確描述此適用結果。",B:"正確。",C:"正確。",D:"正確。"},
      keyTakeaway:"「親權看子女本國法，有我國籍且住台灣就用台灣法」。",
      relatedArticles:"涉外民事法律適用法第55條" }},
  { id:"111-2301-international_private-75", tag:"國際私法-我國法院管轄",
    explanation:{ coreConcept:"我國法院的國際裁判管轄",
      analogy:"外國人在台灣打官司，台灣法院要有管轄權才能受理。管轄根據：被告住所在台灣、契約履行地在台灣、侵權行為地在台灣……。沒有任何連結點，台灣法院可以拒絕受理。",
      coreExplanation:"我國法院的國際裁判管轄（國際民事訴訟法），原則上類推民事訴訟法管轄規定；若被告住所、事件發生地、財產所在地等在我國，我國法院即有管轄權。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述涉外事件我國法院管轄的某種正確敘述，如依民訴法類推或特別管轄規定的適用。"},
      keyTakeaway:"「台灣法院管轄要有連結點——被告在台灣、或事件發生在台灣才能管」。",
      relatedArticles:"民事訴訟法第1條以下（類推適用）" }}
];

async function run() {
  for (const item of E) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log(`✅ ${item.id}`);
  }
  console.log('🎉 111國際私法完成');
  process.exit();
}
run();
