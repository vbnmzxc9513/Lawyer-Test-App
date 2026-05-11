const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const E = [
{id:"114-304-commercial-26",explanation:{coreConcept:"海商法-船舶所有人責任限制",analogy:"船東責任有上限——不會因為一次海難就傾家蕩產（鼓勵航海業）。",keyTakeaway:"海商法§21責任限制。§24船舶抵押權。",relatedArticles:"海商法§21"}},
{id:"114-304-commercial-27",explanation:{coreConcept:"海上貨物運送與載貨證券",analogy:"載貨證券（提單）＝貨物的「身分證」。持有提單＝控制貨物。",keyTakeaway:"海商法§53載貨證券。§60運送人責任。",relatedArticles:"海商法§53、§60"}},
{id:"114-304-commercial-28",explanation:{coreConcept:"海上保險",analogy:"船和貨物在海上風險大→海上保險分擔風險。共同海損＝大家一起分擔。",keyTakeaway:"海商法§127海上保險。§110共同海損。",relatedArticles:"海商法§110、§127"}},
{id:"114-304-commercial-29",explanation:{coreConcept:"公司法-清算與解散",analogy:"公司不玩了→先清算（還債分財產）→再登記解散。清算人負責善後。",keyTakeaway:"§24解散事由。§79清算程序。§84清算人職務。",relatedArticles:"公司法§24、§79"}},
{id:"114-304-commercial-30",explanation:{coreConcept:"關係企業與母子公司",analogy:"母公司控制子公司→母公司要對子公司債務負連帶責任（揭穿公司面紗）。",keyTakeaway:"§369之1關係企業。§369之4控制公司責任。",relatedArticles:"公司法§369之1"}},
{id:"114-304-commercial-31",explanation:{coreConcept:"強制執行法-執行名義",analogy:"打贏官司→拿判決書去法院聲請強制執行→法院幫你拿回錢。",keyTakeaway:"§4執行名義種類。§6聲請程序。§14債務人異議之訴。",relatedArticles:"強執法§4、§14"}},
{id:"114-304-commercial-32",explanation:{coreConcept:"動產執行-查封拍賣",analogy:"欠錢不還→法院查封你的車、家具→拍賣還債。",keyTakeaway:"§45查封動產。§58拍賣程序。§53查封效力。",relatedArticles:"強執法§45、§58"}},
{id:"114-304-commercial-33",explanation:{coreConcept:"不動產執行-拍賣抵押物",analogy:"房貸繳不出→銀行聲請法院拍賣房子→拍賣所得清償債務。",keyTakeaway:"§75不動產查封。§80拍賣最低價。§98拍定效力。",relatedArticles:"強執法§75、§98"}},
{id:"114-304-commercial-34",explanation:{coreConcept:"第三人異議之訴",analogy:"法院查封的東西其實是別人的→那個人可以提「第三人異議之訴」。",keyTakeaway:"§15第三人異議之訴。所有權或足以排除執行之權利。",relatedArticles:"強執法§15"}},
{id:"114-304-commercial-35",explanation:{coreConcept:"債務人異議之訴",analogy:"你說我已經還了/時效過了→提債務人異議之訴→阻止執行。",keyTakeaway:"§14債務人異議之訴。消滅或妨礙債權人請求之事由。",relatedArticles:"強執法§14"}},
{id:"114-304-commercial-36",explanation:{coreConcept:"假扣押執行",analogy:"怕對方脫產→先假扣押凍結財產→贏了官司再正式執行。",keyTakeaway:"§132假扣押執行。§134假處分執行。擔保金。",relatedArticles:"強執法§132"}},
{id:"114-304-commercial-37",explanation:{coreConcept:"間接強制-代替執行與怠金",analogy:"叫你拆違建你不拆→法院找人幫你拆（代替執行）費用你出。",keyTakeaway:"§127代替執行。§128怠金。§129直接強制。",relatedArticles:"強執法§127、§128"}},
{id:"114-304-commercial-38",explanation:{coreConcept:"執行分配與優先權",analogy:"債務人的錢不夠還所有債權人→按順序分→有抵押的優先。",keyTakeaway:"§32參與分配。§38分配表。§39分配表異議。",relatedArticles:"強執法§32、§38"}},
{id:"114-304-commercial-39",explanation:{coreConcept:"法學英文-Legal Terminology",analogy:"法學英文考基本法律術語→jurisdiction管轄、tort侵權、statute法規。",keyTakeaway:"基礎法律英文術語。jurisdiction/tort/statute/remedy/liability。",relatedArticles:"N/A"}},
{id:"114-304-commercial-40",explanation:{coreConcept:"法學英文-Contract Law",analogy:"offer要約+acceptance承諾＝contract契約。consideration對價＝契約的代價。",keyTakeaway:"offer/acceptance/consideration/breach/damages。",relatedArticles:"N/A"}},
{id:"114-304-commercial-41",explanation:{coreConcept:"法學英文-Constitutional Law",analogy:"due process正當程序＝政府不能隨便對人民做事。equal protection平等保護。",keyTakeaway:"due process/equal protection/judicial review/separation of powers。",relatedArticles:"N/A"}},
{id:"114-304-commercial-42",explanation:{coreConcept:"法學英文-Criminal Law",analogy:"beyond reasonable doubt超越合理懷疑＝刑事定罪標準。presumption of innocence無罪推定。",keyTakeaway:"mens rea/actus reus/beyond reasonable doubt/plea bargain。",relatedArticles:"N/A"}},
{id:"114-304-commercial-43",explanation:{coreConcept:"法學英文-Civil Procedure",analogy:"plaintiff原告/defendant被告/jurisdiction管轄/discovery證據開示。",keyTakeaway:"plaintiff/defendant/jurisdiction/venue/discovery/summary judgment。",relatedArticles:"N/A"}},
{id:"114-304-commercial-44",explanation:{coreConcept:"法學英文-International Law",analogy:"sovereignty主權/treaty條約/customary international law國際習慣法。",keyTakeaway:"sovereignty/treaty/jus cogens/extradition/diplomatic immunity。",relatedArticles:"N/A"}},
{id:"114-304-commercial-45",explanation:{coreConcept:"法學英文-Human Rights",analogy:"human rights人權/fundamental freedoms基本自由/non-discrimination不歧視。",keyTakeaway:"UDHR/ICCPR/ICESCR/non-refoulement/habeas corpus。",relatedArticles:"N/A"}}
];
async function run(){for(const e of E){await db.collection('questions').doc(e.id).set({explanation:e.explanation},{merge:true});console.log('OK',e.id);}console.log('Done: commercial Q26-45 + enforcement + legal english');process.exit();}
run();
