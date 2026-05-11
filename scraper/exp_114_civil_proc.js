const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const E = [
{id:"114-303-civil_procedure-51",explanation:{coreConcept:"民事訴訟管轄與訴之合併",analogy:"告人要找對法院——住哪裡就去哪裡的法院（以原就被原則）。",keyTakeaway:"§1以原就被。§10不動產專屬管轄。§248訴之客觀合併。",relatedArticles:"民訴§1、§10、§248"}},
{id:"114-303-civil_procedure-52",explanation:{coreConcept:"當事人能力與訴訟能力",analogy:"打官司要有「資格」——自然人、法人都有。但未成年人要法定代理人幫忙。",keyTakeaway:"§40當事人能力。§45訴訟能力。非法人團體有當事人能力。",relatedArticles:"民訴§40、§45"}},
{id:"114-303-civil_procedure-53",explanation:{coreConcept:"訴訟代理與強制代理",analogy:"第三審強制律師代理——不能自己來，一定要請律師。",keyTakeaway:"§466之1第三審強制律師代理。§68訴訟代理人之權限。",relatedArticles:"民訴§68、§466之1"}},
{id:"114-303-civil_procedure-54",explanation:{coreConcept:"言詞辯論與闡明義務",analogy:"法官有義務問清楚——當事人講不清楚，法官要幫忙「翻譯」。",keyTakeaway:"§199闡明義務。§221自由心證。§195集中審理。",relatedArticles:"民訴§199、§221"}},
{id:"114-303-civil_procedure-55",explanation:{coreConcept:"證據調查與舉證責任",analogy:"誰主張誰舉證——你說別人欠你錢，你就要拿出證據。",keyTakeaway:"§277舉證責任分配。§282事實推定。§368文書真正推定。",relatedArticles:"民訴§277、§282"}},
{id:"114-303-civil_procedure-56",explanation:{coreConcept:"判決效力與既判力",analogy:"法院判了就定了（既判力）——同一件事不能再告第二次。",keyTakeaway:"§400既判力客觀範圍。§401既判力主觀範圍。§249訴之不合法駁回。",relatedArticles:"民訴§249、§400、§401"}},
{id:"114-303-civil_procedure-57",explanation:{coreConcept:"上訴制度與不利益變更禁止",analogy:"只有你上訴→法院不能判得比原來更重（不利益變更禁止）。",keyTakeaway:"§370不利益變更禁止。§477上訴三審限法律審。",relatedArticles:"民訴§370、§477"}},
{id:"114-303-civil_procedure-58",explanation:{coreConcept:"簡易訴訟與小額訴訟",analogy:"小案子不用大費周章——10萬以下用小額程序，50萬以下用簡易程序。",keyTakeaway:"§427簡易訴訟。§436之8小額訴訟10萬以下。一審終結原則。",relatedArticles:"民訴§427、§436之8"}},
{id:"114-303-civil_procedure-59",explanation:{coreConcept:"保全程序與假扣押假處分",analogy:"怕對方脫產？先聲請法院「凍結」他的財產（假扣押）。怕權利被侵害？假處分保護。",keyTakeaway:"§522假扣押要件。§532假處分要件。§526擔保金。",relatedArticles:"民訴§522、§526、§532"}},
{id:"114-303-civil_procedure-60",explanation:{coreConcept:"督促程序與支付命令",analogy:"欠錢不還→聲請支付命令→對方20天不異議→可以執行。快速討債程序。",keyTakeaway:"§508支付命令。§521異議→轉通常訴訟。§521確定效力。",relatedArticles:"民訴§508、§521"}},
{id:"114-303-civil_procedure-61",explanation:{coreConcept:"訴之變更追加與反訴",analogy:"打官司中途改告的內容→訴之變更。被告也想告原告→反訴。",keyTakeaway:"§255訴之變更追加。§259反訴。§256訴之撤回。",relatedArticles:"民訴§255、§259"}},
{id:"114-303-civil_procedure-62",explanation:{coreConcept:"共同訴訟與訴訟參加",analogy:"多人一起告→共同訴訟。旁邊有利害關係的人插進來幫忙→訴訟參加。",keyTakeaway:"§53普通共同訴訟。§56必要共同訴訟。§58訴訟參加。",relatedArticles:"民訴§53、§56、§58"}},
{id:"114-303-civil_procedure-63",explanation:{coreConcept:"調解與和解",analogy:"法院幫忙喬——調解成立等於確定判決。和解也是。但可以另訴撤銷。",keyTakeaway:"§416調解成立效力。§380和解效力。§416之2調解無效撤銷。",relatedArticles:"民訴§380、§416"}},
{id:"114-303-civil_procedure-64",explanation:{coreConcept:"送達與期日期間",analogy:"法院文書要送到你手上才算數——寄存送達10天生效。",keyTakeaway:"§136寄存送達。§138公示送達。§161期間計算。",relatedArticles:"民訴§136、§138"}},
{id:"114-303-civil_procedure-65",explanation:{coreConcept:"再審之訴",analogy:"判決確定後發現重大瑕疵→再審＝翻案的最後手段。",keyTakeaway:"§496再審事由。§500再審期間30日。§507準再審。",relatedArticles:"民訴§496、§500"}},
{id:"114-303-civil_procedure-66",explanation:{coreConcept:"第三人撤銷訴訟",analogy:"別人的判決影響到你→你可以提第三人撤銷訴訟來保護自己。",keyTakeaway:"§507之1第三人撤銷訴訟。30日內提起。",relatedArticles:"民訴§507之1"}},
{id:"114-303-civil_procedure-67",explanation:{coreConcept:"訴訟費用與訴訟救助",analogy:"沒錢打官司→聲請訴訟救助→暫時免繳裁判費。",keyTakeaway:"§77之1裁判費計算。§107訴訟救助。§78訴訟費用由敗訴人負擔。",relatedArticles:"民訴§77之1、§107"}},
{id:"114-303-civil_procedure-68",explanation:{coreConcept:"家事事件之處理",analogy:"離婚、監護、扶養→家事事件→家事法院處理。調解前置。",keyTakeaway:"家事事件法§23調解前置。§3事件分類。§14合併審理。",relatedArticles:"家事事件法§3、§23"}},
{id:"114-303-civil_procedure-69",explanation:{coreConcept:"非訟事件",analogy:"沒有兩造對立的事→非訟事件。如：公示催告、除權判決。",keyTakeaway:"非訟事件法§1。公示催告程序。",relatedArticles:"民訴§539公示催告"}},
{id:"114-303-civil_procedure-70",explanation:{coreConcept:"強制執行與執行名義",analogy:"有判決還要執行——拿確定判決去法院聲請強制執行。",keyTakeaway:"強執法§4執行名義。§6聲請執行。§12聲明異議。",relatedArticles:"強制執行法§4"}},
{id:"114-303-civil_procedure-71",explanation:{coreConcept:"訴之利益與權利保護必要",analogy:"告人要有「理由」——不能無聊亂告。要有權利保護的必要性。",keyTakeaway:"§249不合法→駁回。確認之訴→確認利益。給付之訴→請求權基礎。",relatedArticles:"民訴§249"}},
{id:"114-303-civil_procedure-72",explanation:{coreConcept:"證人與鑑定人",analogy:"證人講親眼所見→鑑定人用專業知識分析。兩者角色不同。",keyTakeaway:"§302證人義務。§326鑑定。§305拒絕證言權。",relatedArticles:"民訴§302、§326"}},
{id:"114-303-civil_procedure-73",explanation:{coreConcept:"文書提出義務",analogy:"對方手上有關鍵文件→法院可以命他提出（文書提出命令）。不提出→推定你說的是真的。",keyTakeaway:"§342文書提出義務。§345不提出效果。§347文書特定。",relatedArticles:"民訴§342、§345"}},
{id:"114-303-civil_procedure-74",explanation:{coreConcept:"訴訟上自認與擬制自認",analogy:"對方說的你不否認→法院當你承認了（擬制自認）。真正承認＝自認→拘束法院。",keyTakeaway:"§279自認。§280擬制自認。自認撤銷需證明與事實不符。",relatedArticles:"民訴§279、§280"}},
{id:"114-303-civil_procedure-75",explanation:{coreConcept:"訴訟標的與處分權主義",analogy:"你要告什麼、告多少→你決定（處分權主義）。法院不能超過你要求的範圍判。",keyTakeaway:"§388辯論主義。§450不利益變更禁止。處分權主義＝當事人決定範圍。",relatedArticles:"民訴§388"}},
{id:"114-303-civil_procedure-76",explanation:{coreConcept:"選定當事人與團體訴訟",analogy:"一群人受害→選一個人代表大家告→選定當事人制度。",keyTakeaway:"§41選定當事人。§44之1團體訴訟。消費者保護訴訟。",relatedArticles:"民訴§41、§44之1"}},
{id:"114-303-civil_procedure-77",explanation:{coreConcept:"訴之聲明與訴訟類型",analogy:"給付之訴→叫對方做事。確認之訴→確認法律關係。形成之訴→改變法律關係。",keyTakeaway:"三種訴訟類型。§244訴之聲明要求。確認之訴需確認利益。",relatedArticles:"民訴§244"}},
{id:"114-303-civil_procedure-78",explanation:{coreConcept:"抗告與再抗告",analogy:"不服裁定→抗告。不服抗告裁定→再抗告（但限制嚴格）。",keyTakeaway:"§482抗告。§486再抗告→限違法。§487抗告期間10日。",relatedArticles:"民訴§482、§486"}},
{id:"114-303-civil_procedure-79",explanation:{coreConcept:"訴訟上之捨棄認諾",analogy:"原告說我不要了（捨棄）→法院判原告敗訴。被告說你說的都對（認諾）→法院判被告敗訴。",keyTakeaway:"§384捨棄。§384認諾。效力等同判決。",relatedArticles:"民訴§384"}},
{id:"114-303-civil_procedure-80",explanation:{coreConcept:"第三審上訴與法律審",analogy:"第三審只管法律問題→事實認定以二審為準。上訴理由限「判決違背法令」。",keyTakeaway:"§467上訴三審理由。§477法律審。§469絕對上訴理由。",relatedArticles:"民訴§467、§469、§477"}}
];
async function run(){for(const e of E){await db.collection('questions').doc(e.id).set({explanation:e.explanation},{merge:true});console.log('OK',e.id);}console.log('Done: civProc Q51-80');process.exit();}
run();
