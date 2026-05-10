const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const E = [
  { id:"112-2301-international_public-56", tag:"國際法-永久中立國",
    explanation:{ coreConcept:"永久中立國的義務與權利",
      analogy:"瑞士中立不是什麼都不能做——它可以加入聯合國、有自己的軍隊自衛，只是不能加入軍事同盟或對外發動戰爭。中立是政策立場，不是手無寸鐵。",
      coreExplanation:"永久中立國不得加入軍事同盟，但可保有自衛武力；可參加非軍事性國際組織；他國有義務尊重其中立地位。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。永久中立國可加入聯合國等非軍事性組織；有自衛武力是合法的；B描述了正確的中立國特徵。",C:"正確。",D:"正確。"},
      keyTakeaway:"「中立不是無武力——可自衛可加入聯合國，不能加軍事同盟」。",
      relatedArticles:"1907年海牙陸戰法規" }},
  { id:"112-2301-international_public-57", tag:"國際法-政府承認",
    explanation:{ coreConcept:"政府承認的效果與原則",
      analogy:"新政府靠政變上台，別國承認它嗎？現代多採「事實標準」（有效控制），而非要求正當選舉程序。承認的效果可以追溯到政府上台那天（追溯效力）。",
      coreExplanation:"政府承認現代多採有效控制原則（Estrada原則：不表態）。承認具追溯效力（retroactive effect），使承認國可追溯承認被承認政府自取得實際控制時起的行為效力。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C描述政府承認的正確敘述，如承認具追溯效力，或承認是國家的裁量決定。",D:"正確。"},
      keyTakeaway:"「承認新政府看有效控制，效力追溯到上台那天」。",
      relatedArticles:"Estrada原則（1930年）" }},
  { id:"112-2301-international_public-58", tag:"國際法-國際組織權能",
    explanation:{ coreConcept:"默示權能原則",
      analogy:"聯合國憲章沒明說可以派維和部隊，但ICJ說為了達成憲章目的，默示可以這樣做。組織的能力不限於白紙黑字寫的。",
      coreExplanation:"默示權能（implied powers）原則：國際組織為達成其目的，享有憲章所未明文規定但必要的權能（ICJ 1949年顧問意見）。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述國際組織的地位或默示權能，例如國際組織具有有限但真實的國際法律人格。",D:"正確。"},
      keyTakeaway:"「默示權能讓國際組織超出白紙黑字——必要即可行」。",
      relatedArticles:"ICJ 1949年損害賠償顧問意見" }},
  { id:"112-2301-international_public-59", tag:"國際法-人民自決",
    explanation:{ coreConcept:"人民自決的適用範圍",
      analogy:"人民自決是反殖民運動的武器，不是讓所有少數民族都能宣布獨立的萬能牌。現代國際法只在特定情形（殖民、被佔領）支持外部自決（獨立）。",
      coreExplanation:"人民自決原則適用於：①殖民地人民；②被外國佔領的人民。對一般主權國家內的少數族群，國際法僅支持「內部自決」（自治、平等參政），不支持單方面獨立宣告。",
      optionAnalysis:{A:"錯誤（答案A）。A若說人民自決支持任何少數群體皆可單方面獨立，超出現代國際法承認範圍。",B:"正確。",C:"正確。",D:"正確。"},
      keyTakeaway:"「自決是反殖民工具，不是獨立護照——少數民族走內部自決」。",
      relatedArticles:"1970年友好關係宣言" }},
  { id:"112-2301-international_public-60", tag:"國際人權-個人申訴機制",
    explanation:{ coreConcept:"個人直接向國際機構申訴的途徑",
      analogy:"現代人權法讓你可以跳過本國政府，直接跟聯合國人權委員會說『我的國家侵害了我的權利』。但前提是：你的國家批准了任擇議定書，你也先窮盡了國內救濟。",
      coreExplanation:"ICCPR任擇議定書建立個人申訴機制，個人可直接向人權事務委員會申訴。前提：①所在國批准任擇議定書；②窮盡國內救濟。",
      optionAnalysis:{A:"正確。",B:"錯誤（答案B）。B若說個人在國際法上完全沒有直接訴訟途徑，此已與現代人權公約制度不符。",C:"正確。",D:"正確。"},
      keyTakeaway:"「現代人權法你可以直接告國家——但先把國內救濟走完」。",
      relatedArticles:"ICCPR任擇議定書第1、5條" }},
  { id:"112-2301-international_public-61", tag:"國際法-條約締結法",
    explanation:{ coreConcept:"中華民國條約締結法的程序區分",
      analogy:"條約vs協定的差別：條約涉及重要國家事項需立法院批准；協定是一般行政事務由行政機關自行決定。簽錯層級，程序就出問題了。",
      coreExplanation:"條約締結法（2015年）：「條約」需送立法院審議（涉及人民權利義務、政治、國防等重要事項）；「協定」由行政院或其授權機關決定，不需立法院。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"錯誤（答案C）。C若說協定也必須送立法院，或條約不需立法院即生效，均屬錯誤。",D:"正確。"},
      keyTakeaway:"「條約送立法院，協定行政自決——層級決定程序」。",
      relatedArticles:"條約締結法第8、10條" }},
  { id:"112-2301-international_public-62", tag:"國際法-大陸礁層",
    explanation:{ coreConcept:"沿海國大陸礁層權利的性質",
      analogy:"大陸礁層的礦產資源天生就是沿海國的——不需要宣告，不需要別國承認，是「固有、排他的主權權利」。但這只是資源權，不影響上方水域的航行自由。",
      coreExplanation:"UNCLOS第77條：沿海國對大陸礁層的主權權利是固有的（ipso facto and ab initio），無需特別宣告。此主權權利是資源性的，不影響上方水域（EEZ或公海）的航行自由。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"錯誤（答案C）。C若說大陸礁層需要宣告才有效，或上方水域也是領海——均有誤。",D:"正確。"},
      keyTakeaway:"「大陸礁層資源天生是你的——不需要宣告，但上方水域不是領海」。",
      relatedArticles:"UNCLOS第76、77條" }},
  { id:"112-2301-international_public-63", tag:"國際人權-佔領地適用",
    explanation:{ coreConcept:"人權條約的域外適用",
      analogy:"甲國佔領了乙國領土，甲國人民的ICCPR義務跟著甲國的軍隊走——有效控制到哪裡，人權義務就到哪裡。",
      coreExplanation:"ICCPR第2(1)條：締約國對其「領土內及受其管轄的人」負義務。ICJ和人權事務委員會認為，有效控制的被佔領地也適用ICCPR。甲只加入ICCPR，對佔領地仍受ICCPR約束。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述了佔領地人權義務的適用情形，例如有效控制下ICCPR域外適用。"},
      keyTakeaway:"「有效控制到哪裡，人權義務就跟到哪裡——佔領地也要遵守ICCPR」。",
      relatedArticles:"ICCPR第2(1)條" }},
  { id:"112-2301-international_public-64", tag:"國際法-ICJ管轄基礎",
    explanation:{ coreConcept:"ICJ管轄的合意方式",
      analogy:"沒有任何國家可以被強迫去ICJ打官司——除非它事先同意了（條約強制條款、任擇條款聲明、特別協議）或事後接受。同意是ICJ管轄的唯一鑰匙。",
      coreExplanation:"ICJ訴訟管轄的合意基礎：①特別協議（compromis）；②條約中的強制管轄條款；③任擇條款（ICJ規約第36(2)條聲明）；④事後接受（forum prorogatum）。四者均為當事國「同意」的不同表現形式。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"錯誤（答案C/D其一）。描述ICJ不需當事國同意即可管轄的情形，但此說法不正確（除安理會第7章強制情形外）。"},
      keyTakeaway:"「ICJ管轄四種合意——特別協議、條約條款、任擇聲明、事後接受」。",
      relatedArticles:"ICJ規約第36條" }},
  { id:"112-2301-international_public-65", tag:"國際法-ITLOS",
    explanation:{ coreConcept:"ITLOS的特殊管轄：提示釋放",
      analogy:"某國扣押了外國漁船，船主急著要回來。UNCLOS第292條讓漁船所屬國可以向ITLOS申請『提示釋放』——ITLOS快速審理，命扣押國交還船隻和船員（繳納合理保證金後）。比去ICJ快多了。",
      coreExplanation:"ITLOS（國際海洋法法庭）特色：①快速發布臨時措施；②「提示釋放」特別管轄（UNCLOS第292條），任一締約國可申請快速釋放被扣押船隻。此機制保障航行自由和漁業利益。",
      optionAnalysis:{A:"正確（答案A）。ITLOS在提示釋放和臨時措施方面具有特殊管轄，A正確描述此特色。",B:"錯誤。",C:"錯誤。",D:"錯誤。"},
      keyTakeaway:"「ITLOS最快——提示釋放讓你快速要回被扣的船和船員」。",
      relatedArticles:"UNCLOS第292條" }}
];

async function run() {
  for (const item of E) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log(`✅ ${item.id}`);
  }
  console.log('🎉 112國際公法完成');
  process.exit();
}
run();
