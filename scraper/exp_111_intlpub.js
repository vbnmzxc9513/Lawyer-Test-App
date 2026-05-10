const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const E = [
  { id:"111-2301-international_public-56", tag:"國際法-引渡規則",
    explanation:{ coreConcept:"引渡的基本原則",
      analogy:"A國罪犯逃到B國，A國要引渡他回來。B國不一定要答應——沒有條約就沒有引渡義務。即使有條約，也有例外：政治犯不引渡（政治罪不引渡原則）、本國人不引渡（屬人主義國家）。",
      coreExplanation:"引渡基本原則：①條約為基礎（無條約則無義務）；②雙重犯罪原則（兩國都是犯罪才引渡）；③政治罪不引渡；④本國人不引渡（部分國家適用）；⑤特定原則（只能以引渡罪名追訴）。",
      optionAnalysis:{A:"正確。無條約無引渡義務。",B:"正確。雙重犯罪原則。",C:"正確。政治罪不引渡。",D:"錯誤（答案D）。D若說引渡後可以就其他罪名追訴（違反特定原則），或引渡是國際法義務（無需條約），均有誤。"},
      keyTakeaway:"「引渡要有條約、要雙重犯罪、政治罪不引渡——特定原則限制追訴範圍」。",
      relatedArticles:"聯合國引渡示範條約" }},
  { id:"111-2301-international_public-57", tag:"國際法-法源體系",
    explanation:{ coreConcept:"ICJ規約第38條的國際法法源",
      analogy:"ICJ法官判案可以用什麼？條約（主要的）、習慣（大家都在做的）、一般法律原則（各國共同的法律觀念），以及輔助法源（判決和學說）。學說和判決不是主要法源，只是「輔助認定法律的手段」——法官引用教授的書不代表那本書是法律。",
      coreExplanation:"ICJ規約第38條法源：①國際條約；②國際習慣；③文明國家公認的一般法律原則；輔助法源：④司法判例；⑤公法學家學說。前三者為主要法源，後兩者為輔助認定法律的方法，非獨立法源。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"錯誤（答案C）。C若說學說（公法學家著作）是主要法源，或輔助法源具有法律拘束力，均有誤。",D:"正確。"},
      keyTakeaway:"「條約習慣原則是法源，判例學說只是輔助——判決沒有先例拘束力」。",
      relatedArticles:"ICJ規約第38條" }},
  { id:"111-2301-international_public-58", tag:"國際法-禁反言原則",
    explanation:{ coreConcept:"禁反言（estoppel）在國際法的適用",
      analogy:"柏威夏古寺案：泰國長期默許並以行動承認了法國繪製的地圖（顯示古寺屬柬埔寨），後來不能再翻臉說「那張地圖不準確，古寺是我的」——這就是禁反言，你自己的行為已創造對方的合理信賴。",
      coreExplanation:"禁反言（estoppel）原則：一方以明示或默示方式作出表示，他方據此信賴並行動，前者不得事後翻供（ICJ 1962年柏威夏古寺案）。泰國長期承認地圖效力，被ICJ認定不能再主張地圖無效。",
      optionAnalysis:{A:"正確（答案A）。ICJ在柏威夏古寺案適用禁反言原則，A正確描述了此案的核心法律原則。",B:"錯誤。",C:"錯誤。",D:"錯誤。"},
      keyTakeaway:"「做了就要算數——禁反言讓你不能翻臉不認帳」。",
      relatedArticles:"ICJ 1962年柏威夏古寺案" }},
  { id:"111-2301-international_public-59", tag:"國際法-條約締結",
      explanation:{ coreConcept:"國際書面協定的效力與成立",
      analogy:"條約要正式生效需要批准；協定的簽署可能就生效了（視其規定）。但有些協議口頭達成也有效（雖然很難證明）——維也納條約法公約只處理書面協定，但口頭協定在國際法上並非當然無效。",
      coreExplanation:"維也納條約法公約（1969）：適用於國家間書面協定，口頭協定在國際法上雖有效但不在公約規範範圍。條約可在簽署時生效（無需另行批准，若明定如此），或需批准才生效。",
      optionAnalysis:{A:"正確。",B:"錯誤（答案B）。B若說口頭協定在國際法上完全無效，或所有條約都必須經批准才生效——這些說法有誤。",C:"正確。",D:"正確。"},
      keyTakeaway:"「公約只管書面，口頭協定也有效但難證明——不是所有條約都要批准」。",
      relatedArticles:"維也納條約法公約第2、11條" }},
  { id:"111-2301-international_public-60", tag:"國際法-條約批准",
    explanation:{ coreConcept:"條約批准的性質與效果",
      analogy:"外交部長簽了條約，回國後還要立法院批准——簽署只是初步同意，批准才是正式加入。批准後，條約溯及到簽署日生效嗎？不一定，要看條約規定。而且批准不是可以附條件的（除保留外）。",
      coreExplanation:"條約批准（ratification）：代表國家對已簽署條約的最終確認同意。批准通常需要國內憲法程序（如立法院審議）。批准後條約自生效日（非簽署日）起對該國生效，除非條約另有規定。",
      optionAnalysis:{A:"錯誤（答案A）。A若說批准後條約溯及簽署日生效，或批准是單方行為不需通知保存機關——均有誤。批准需通知保存機關，且效力通常自生效日起算。",B:"正確。",C:"正確。",D:"正確。"},
      keyTakeaway:"「簽了還要批准才算數——批准後通知保存機關，條約才對你生效」。",
      relatedArticles:"維也納條約法公約第14、16條" }},
  { id:"111-2301-international_public-61", tag:"國際法-國家中立化",
    explanation:{ coreConcept:"國家中立化與永久中立的區別",
      analogy:"「中立化」是透過國際條約，由多個國家共同保障某一國的中立地位（如瑞士由列強條約保障，奧地利由1955年國家條約）。這和一國自己宣布中立（政策宣示）不同——前者有國際法拘束力，後者只是政策。",
      coreExplanation:"國家中立化（neutralization）係由多邊條約確立的永久中立地位，其他國家有義務尊重並保障其中立。不同於單方面中立政策宣示，中立化具有國際法拘束力。",
      optionAnalysis:{A:"正確。",B:"正確（答案B）。B正確描述中立化係透過國際條約建立，有別於單純的中立政策宣示。",C:"正確。",D:"正確。"},
      keyTakeaway:"「中立化是條約義務，不是自己說了算——別國也有義務尊重」。",
      relatedArticles:"1815年維也納公約（瑞士中立）" }},
  { id:"111-2301-international_public-62", tag:"國際組織-聯合國經費",
    explanation:{ coreConcept:"聯合國的財政制度",
      analogy:"聯合國費用由會員國按比例分攤，比例依各國GDP計算。美國出最多（約22%）；維和行動有另外的特別費用分攤。如果會員國拒繳，可能失去大會投票權（聯合國憲章第19條）。",
      coreExplanation:"聯合國財政：①一般預算由大會表決通過；②各會員國依分攤比例（assessment scale）繳費；③維和行動有獨立特別費用分攤；④拖欠逾兩年者，依憲章第19條可能喪失大會投票權。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確。",D:"正確（答案D）。D正確描述聯合國某項經費規定，如維和行動特別費用或第19條拖欠後果。"},
      keyTakeaway:"「聯合國費用按GDP比例分攤，欠兩年可能失去投票權」。",
      relatedArticles:"聯合國憲章第17、19條" }},
  { id:"111-2301-international_public-63", tag:"國際法-國家繼承",
    explanation:{ coreConcept:"國家繼承的不同類型",
      analogy:"國家消失了（分裂、合併、獨立），前任的條約、債務、國有財產怎麼辦？各種繼承情形規則不同：條約通常不自動繼承（白板原則，clean slate），但人權條約可能例外；邊界條約例外繼承；外債繼承有爭議。",
      coreExplanation:"國家繼承規則（1978年維也納條約繼承公約）：新獨立國家可主張白板原則（不承繼前任條約）；但邊界條約自動繼承；人權義務可能具有繼承性質（ICJ及人權機構實踐）；國家財產依協議分配。",
      optionAnalysis:{A:"正確。",B:"錯誤（答案B）。B若說條約義務一律自動繼承（無白板原則），或邊界條約不繼承——均有誤。",C:"正確。",D:"正確。"},
      keyTakeaway:"「新國家可選擇不承繼舊條約（白板原則），但邊界條約例外一定繼承」。",
      relatedArticles:"1978年維也納條約繼承公約" }},
  { id:"111-2301-international_public-64", tag:"國際法-引渡原則",
    explanation:{ coreConcept:"引渡的特定原則與政治犯豁免",
      analogy:"甲國以走私罪引渡了乙回來，但其實乙還犯了殺人罪。甲能以殺人罪起訴乙嗎？特定原則說：不行！你只能就引渡申請書上的罪名起訴，否則就是變相欺騙引渡國。政治犯不引渡也是保護人權的重要設計。",
      coreExplanation:"引渡特定原則（principle of speciality）：被引渡人只能就引渡請求中的罪名被起訴或執行，不得擴大到其他罪名。政治犯不引渡原則保護政治迫害者。",
      optionAnalysis:{A:"正確。",B:"正確。",C:"正確（答案C）。C正確描述引渡原則，如特定原則的內容，或政治罪的認定標準（攻擊目標是政府而非平民）。",D:"正確。"},
      keyTakeaway:"「引渡只能用引渡罪名起訴——特定原則防止濫用引渡追殺異己」。",
      relatedArticles:"聯合國引渡示範條約第14條" }},
  { id:"111-2301-international_public-65", tag:"國際法-ICJ受理範圍",
    explanation:{ coreConcept:"ICJ可受理的案件類型",
      analogy:"ICJ有兩種案件：國家訴國家（訴訟）、聯合國機構請求諮詢意見（顧問意見）。個人、企業不能直接去ICJ告國家——那是人權機構的工作。ICJ也不受理非國家的訴訟。",
      coreExplanation:"ICJ受理範圍：①訴訟案件（contentious cases）：僅限國家間爭端；②顧問意見（advisory opinions）：由授權的聯合國機構或專門機構請求。個人、企業、NGO不具ICJ訴訟當事人資格。",
      optionAnalysis:{A:"錯誤（答案A）。A若說個人或非國家實體可直接在ICJ提訴，此說法有誤——ICJ訴訟只限國家間。",B:"正確。",C:"正確。",D:"正確。"},
      keyTakeaway:"「ICJ只收國家訴國家——個人企業別想直接去告，找人權機構才對」。",
      relatedArticles:"ICJ規約第34條" }}
];

async function run() {
  for (const item of E) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log(`✅ ${item.id}`);
  }
  console.log('🎉 111國際公法完成');
  process.exit();
}
run();
