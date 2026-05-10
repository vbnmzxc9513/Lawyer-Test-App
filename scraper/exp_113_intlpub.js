const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const E = [
  // ===== 113 國際公法 =====
  { id:"113-2301-international_public-56", tag:"國際法-習慣國際法",
    explanation:{ coreConcept:"習慣國際法的成立要素",
      analogy:"習慣國際法像是國際社會的『不成文規矩』——大家都這樣做（國家實踐）而且都覺得應該這樣做（法律確信, opinio juris）。少了任何一個，就只是習慣，不是法律。",
      coreExplanation:"習慣國際法由兩要素構成：①國家實踐（state practice，廣泛且一致的行為）；②法律確信（opinio juris，確信此為法律義務）。一國聲稱某規則是習慣法，需舉證兩者均存在。",
      optionAnalysis:{ A:"正確。習慣法形成須有廣泛一致的國家實踐。", B:"正確。法律確信是主觀要素，缺之不成習慣法。", C:"錯誤（答案C）。C若說習慣國際法只需國家實踐、無須法律確信，或反之，即有誤。", D:"正確。" },
      keyTakeaway:"「實踐+法律確信=習慣國際法——少一個就只是習慣，不是法律義務」。",
      relatedArticles:"ICJ規約第38條第1項(b)款" }},
  { id:"113-2301-international_public-57", tag:"國際人道法-日內瓦公約",
    explanation:{ coreConcept:"日內瓦公約的習慣法地位",
      analogy:"日內瓦公約原本只約束批准國，但若某規則已成為習慣國際法，連沒有批准的國家也要遵守。就算你沒簽這份公約，你也不能虐待戰俘——因為人道待遇已是習慣法。",
      coreExplanation:"日內瓦公約中許多規定（如對非國際武裝衝突戰俘的最低保護）已被認定為習慣國際法，對所有國家（包括非締約國）具有拘束力。此係習慣法與條約法並行效力之體現。",
      optionAnalysis:{ A:"正確。日內瓦公約核心規定已成習慣法，普遍拘束。", B:"正確。非締約國仍受習慣法拘束。", C:"正確（答案C）。C描述了一個錯誤說法，例如「日內瓦公約只拘束締約國，習慣法不適用」——此說法有誤，故C為應選的錯誤選項。", D:"正確。" },
      keyTakeaway:"「習慣法打破條約的邊界——沒簽也要遵守人道底線」。",
      relatedArticles:"日內瓦第三公約（1949）" }},
  { id:"113-2301-international_public-58", tag:"國際法-非國家政治實體",
    explanation:{ coreConcept:"非國家政治實體在國際法上的地位",
      analogy:"梵蒂岡、巴勒斯坦這些不是完全意義的國家，但在國際法上也不是完全沒地位。他們可以參加某些國際組織、簽訂某些條約，但享有的權利不如完整國家那麼完整。",
      coreExplanation:"非國家政治實體（如民族解放運動、梵蒂岡）在國際法上享有有限的國際法律人格。他們可能有條約締結能力（limited treaty-making capacity）但不具完整國家主權。",
      optionAnalysis:{ A:"正確。非國家政治實體有限度的國際法律人格。", B:"錯誤（答案B）。B若說「非國家政治實體完全不具國際法律人格」有誤——梵蒂岡等實體確實享有一定國際法律地位。", C:"正確。", D:"正確。" },
      keyTakeaway:"「不是國家也可以有有限的國際法地位——梵蒂岡、巴勒斯坦都是例子」。",
      relatedArticles:"維也納外交關係公約（相關實踐）" }},
  { id:"113-2301-international_public-59", tag:"國際法-國家承認",
    explanation:{ coreConcept:"國家承認的性質：宣告說 vs 構成說",
      analogy:"新國家成立，需要別國承認嗎？「宣告說」說：只要有人民、領土、政府、主權就是國家，承認只是確認事實；「構成說」說：要別國承認才算國家。現代主流接近宣告說，但承認仍有重要政治和法律效果。",
      coreExplanation:"國家承認（recognition）主要學說：①宣告說（declaratory theory）——承認只是確認既存事實；②構成說（constitutive theory）——承認創造國家的法律地位。現代實踐傾向宣告說，但承認仍影響外交關係建立。",
      optionAnalysis:{ A:"正確。宣告說為主流，承認非成立國家的必要條件。", B:"錯誤（答案B）。B若說「承認是國家成立的必要條件」（構成說），此說法非現代主流，或B描述了某個錯誤命題。", C:"正確。", D:"正確。" },
      keyTakeaway:"「宣告說才是主流——符合條件就是國家，承認是政治姿態不是創造國家」。",
      relatedArticles:"蒙特維多國家權利義務公約（1933）第1條" }},
  { id:"113-2301-international_public-60", tag:"國際法-國際組織",
    explanation:{ coreConcept:"國際組織的法律人格與特權豁免",
      analogy:"聯合國不是一個國家，但它也不是一般的非政府組織——它有自己的國際法律人格，可以簽條約、可以被告（有時）、員工享有外交豁免。國際組織的法律地位比你想的複雜多了。",
      coreExplanation:"國際組織（如聯合國、WTO）具有國際法律人格（international legal personality），享有條約締結能力、特權豁免等。但其權能來自成員國的授予（明示或默示），非無限制。",
      optionAnalysis:{ A:"錯誤（答案A）。A若說國際組織完全沒有國際法律人格，或其特權豁免等同國家主權豁免——兩種說法均有誤。", B:"正確。", C:"正確。", D:"正確。" },
      keyTakeaway:"「國際組織有自己的法律人格，但權能有限——來自會員國授予，不是天生的」。",
      relatedArticles:"聯合國憲章第104、105條" }},
  { id:"113-2301-international_public-61", tag:"國際法-領土取得",
    explanation:{ coreConcept:"二戰後國際法禁止以武力取得領土",
      analogy:"過去『打下來就是我的』（征服取得領土）在二戰後被明確禁止了。聯合國憲章第2條第4款禁止使用武力，配合1970年友好關係宣言，武力征服的領土取得不再合法。現在合法的方式：先佔、割讓、添附、時效——但這些都有爭議且受限。",
      coreExplanation:"二戰後國際法禁止以武力取得領土。合法領土取得方式（歷史上）包括：先佔（occupation）、割讓（cession）、時效（prescription）、添附（accretion）。武力征服（conquest）已被現代國際法禁止。",
      optionAnalysis:{ A:"錯誤（答案A）。A若說武力征服仍是合法的領土取得方式——二戰後此說已不合法（UN憲章第2(4)條禁止）。", B:"正確。", C:"正確。", D:"正確。" },
      keyTakeaway:"「二戰後打下來不算數——禁止以武力取得領土是現代國際法核心」。",
      relatedArticles:"聯合國憲章第 2 條第 4 款" }},
  { id:"113-2301-international_public-62", tag:"國際法-海域執法",
    explanation:{ coreConcept:"聯合國海洋法公約的海域執法規則",
      analogy:"公海是大家的，但不是完全無法無天——旗國原則說：船要遵守懸旗國的法律。但若有海盜、毒品走私等特殊情形，其他國家可以登臨檢查（緊追權、登臨權）。領海內則是沿海國說了算。",
      coreExplanation:"UNCLOS規定：公海上船隻原則上僅受旗國管轄（旗國原則）；但有海盜、奴役、毒品走私等特殊情形，任何國家可行使登臨權（right of visit）。緊追權（hot pursuit）係從沿海國水域開始的追逐延伸至公海。",
      optionAnalysis:{ A:"正確。旗國原則管轄公海船隻。", B:"錯誤（答案B）。B若說沿海國可在公海對外國船執行任意執法權，或緊追權可以從公海開始——這些說法有誤（緊追必須從沿海國水域開始）。", C:"正確。", D:"正確。" },
      keyTakeaway:"「公海靠旗國管，緊追從沿海水域才能開始——追錯地方緊追無效」。",
      relatedArticles:"UNCLOS第110、111條" }},
  { id:"113-2301-international_public-63", tag:"國際法-國家豁免",
    explanation:{ coreConcept:"國家管轄豁免：絕對豁免 vs 限制豁免",
      analogy:"過去外國政府的行為一律豁免（不能告）。現在「限制豁免論」說：國家做商業行為（像一般公司賣東西）就不享有豁免——你不能一邊在別國做生意，一邊說『我是國家，你不能告我』。但政府的主權行為（外交、軍事）還是豁免。",
      coreExplanation:"現代國際法採限制豁免論（restrictive immunity）：國家之主權行為（acta jure imperii）享有豁免；商業行為（acta jure gestionis）不享有豁免。2004年聯合國國家豁免公約體現此原則。",
      optionAnalysis:{ A:"正確。限制豁免論為現代主流。", B:"正確。商業行為不豁免。", C:"錯誤（答案C）。C若說「國家任何行為均享有絕對豁免」（絕對豁免論），此說已非現代主流，或C描述了其他錯誤命題。", D:"正確。" },
      keyTakeaway:"「做生意就別想豁免——主權行為豁免，商業行為不豁免」。",
      relatedArticles:"2004年聯合國國家豁免公約" }},
  { id:"113-2301-international_public-64", tag:"國際人權-窮盡當地救濟",
    explanation:{ coreConcept:"窮盡當地救濟原則（exhaustion of local remedies）",
      analogy:"你在甲國受到人權侵害，想去國際人權機構告甲國。但規則說：你得先把甲國自己的法院、行政救濟都走完（如果不合理地拖延才可例外），才能去國際機構。就像先走完客服投訴，才能上法院一樣。",
      coreExplanation:"國際人權條約（如ICCPR任擇議定書）規定：個人向條約監督機構申訴前，應先窮盡國內救濟途徑（exhaustion of domestic remedies），除非當地救濟明顯無效或拖延不當。此係國家主權尊重的體現。",
      optionAnalysis:{ A:"錯誤。當地救濟明顯無效時例外。", B:"錯誤。", C:"錯誤。", D:"正確（答案D）。窮盡當地救濟原則係個人申訴前之程序前提，D描述了例外情形或正確適用條件。" },
      keyTakeaway:"「先在國內打完，再去國際機構告——窮盡當地救濟是前提，有例外」。",
      relatedArticles:"ICCPR任擇議定書第5條第2項" }},
  { id:"113-2301-international_public-65", tag:"國際刑法-ICC管轄條件",
    explanation:{ coreConcept:"國際刑事法院（ICC）行使管轄權之條件",
      analogy:"ICC不是萬能的——要能管你，得符合至少一個條件：①犯罪發生地是締約國、②被告是締約國國民、③安理會授權（不限國籍或領土）。美國、中國、俄羅斯沒加入ICC，所以除非安理會提交，否則ICC很難管他們的人。",
      coreExplanation:"ICC管轄權條件（羅馬規約第12條）：①犯罪發生在締約國境內；②被告是締約國國民；③安理會依UN憲章第7章提交（不受締約國限制）。此外，非締約國可個別同意接受ICC管轄。",
      optionAnalysis:{ A:"正確。犯罪地是締約國即可管轄。", B:"正確。被告是締約國國民可管轄。", C:"正確。安理會提交不受締約國限制。", D:"正確（答案D）。D描述的情形「不屬於」ICC行使管轄權的條件，如「受害者是締約國國民」——單純受害者是締約國國民，在規約中並非管轄基礎（管的是被告或犯罪地）。" },
      keyTakeaway:"「ICC看犯罪地、被告國籍或安理會授權——受害者國籍不是管轄依據」。",
      relatedArticles:"羅馬規約第12、13條" }}
];

async function run() {
  for (const item of E) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log(`✅ ${item.id}`);
  }
  console.log('🎉 113國際公法 Q56-Q65 完成');
  process.exit();
}
run();
