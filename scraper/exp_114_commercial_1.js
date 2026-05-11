const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const E = [
{id:"114-304-commercial-01",explanation:{coreConcept:"公司法總則-公司種類與設立",analogy:"開公司像選擇賽車類型——無限公司所有人全賠，有限公司只賠出資額。",keyTakeaway:"§2公司種類。§6公司設立登記。有限公司→出資額為限。",relatedArticles:"公司法§1、§2"}},
{id:"114-304-commercial-02",explanation:{coreConcept:"股份有限公司股東權利",analogy:"買股票＝當股東→有投票權、分紅權、但不能隨便管公司日常。",keyTakeaway:"§172股東會。§174普通決議。§198累積投票。",relatedArticles:"公司法§172、§174"}},
{id:"114-304-commercial-03",explanation:{coreConcept:"董事與監察人之職權",analogy:"董事＝管理層。監察人＝監督者。兩者不能是同一人。",keyTakeaway:"§192董事選任。§216監察人職權。§218監察人查帳權。",relatedArticles:"公司法§192、§216"}},
{id:"114-304-commercial-04",explanation:{coreConcept:"公司資本制度",analogy:"公司資本＝公司的基本盤。不能隨便抽走（資本維持原則）。",keyTakeaway:"§156股份。§167公司不得買自己股票（例外除外）。資本三原則。",relatedArticles:"公司法§156、§167"}},
{id:"114-304-commercial-05",explanation:{coreConcept:"股份轉讓限制",analogy:"股票原則上自由買賣→但閉鎖型公司可以限制。",keyTakeaway:"§163股份轉讓自由原則。§356之1閉鎖型公司。§157特別股。",relatedArticles:"公司法§163"}},
{id:"114-304-commercial-06",explanation:{coreConcept:"公司合併與分割",analogy:"兩家公司合體＝合併。一家拆成兩家＝分割。都要股東會特別決議。",keyTakeaway:"§316合併決議。§317異議股東收買請求權。",relatedArticles:"公司法§316、§317"}},
{id:"114-304-commercial-07",explanation:{coreConcept:"公司負責人之責任",analogy:"董事長亂搞→要賠公司（忠實義務）也可能賠股東。",keyTakeaway:"§23負責人忠實注意義務。§8公司負責人範圍。§34經理人。",relatedArticles:"公司法§8、§23"}},
{id:"114-304-commercial-08",explanation:{coreConcept:"有限公司特殊規定",analogy:"有限公司像小型合夥——股東少、組織簡單、出資轉讓受限。",keyTakeaway:"§99有限公司。§111出資轉讓。§108董事。",relatedArticles:"公司法§99、§111"}},
{id:"114-304-commercial-09",explanation:{coreConcept:"股東會決議瑕疵",analogy:"股東會沒有依法召集→決議有問題→可以訴請撤銷或確認無效。",keyTakeaway:"§189撤銷決議之訴。§191決議無效。30日除斥期間。",relatedArticles:"公司法§189、§191"}},
{id:"114-304-commercial-10",explanation:{coreConcept:"公開發行公司之特別規定",analogy:"上市公司＝公開發行→規定更嚴格→要保護廣大投資人。",keyTakeaway:"§14公開發行。證交法§20反詐欺條款。§36財報公告。",relatedArticles:"證交法§20、§36"}},
{id:"114-304-commercial-11",explanation:{coreConcept:"保險法總則-保險利益",analogy:"保險利益＝你跟被保險的東西/人有「利害關係」。沒有→保單無效。",keyTakeaway:"§3保險利益。§17財產保險利益。§16人身保險利益。",relatedArticles:"保險法§3、§16、§17"}},
{id:"114-304-commercial-12",explanation:{coreConcept:"保險契約之成立與效力",analogy:"保險契約＝你付保費，出事保險公司賠。但要誠實告知，不然保險公司可以解約。",keyTakeaway:"§64據實說明義務。§25保險契約成立。§54條款解釋。",relatedArticles:"保險法§25、§64"}},
{id:"114-304-commercial-13",explanation:{coreConcept:"火災保險與損害賠償",analogy:"房子保火險→著火了→保險公司賠。但不能超過實際損失（損害填補原則）。",keyTakeaway:"§70火災保險。§73保險金額。損害填補原則。",relatedArticles:"保險法§70、§73"}},
{id:"114-304-commercial-14",explanation:{coreConcept:"人壽保險與受益人",analogy:"壽險＝人死了賠錢。受益人＝拿錢的人。可以指定也可以變更。",keyTakeaway:"§101壽險。§110受益人指定。§113保險費返還。",relatedArticles:"保險法§101、§110"}},
{id:"114-304-commercial-15",explanation:{coreConcept:"保險代位與複保險",analogy:"車禍保險公司賠你→保險公司可以去找肇事者要錢（代位求償）。",keyTakeaway:"§53代位求償。§35複保險。§36善意複保險。",relatedArticles:"保險法§35、§53"}},
{id:"114-304-commercial-16",explanation:{coreConcept:"票據法-匯票基本概念",analogy:"匯票像支票的進階版——三方關係：發票人叫付款人付錢給受款人。",keyTakeaway:"§1票據種類。§24匯票。§25匯票應記載事項。",relatedArticles:"票據法§1、§24"}},
{id:"114-304-commercial-17",explanation:{coreConcept:"票據行為與票據權利",analogy:"簽了票據就要負責——文義性、無因性、獨立性。",keyTakeaway:"§5票據行為。§13抗辯限制。票據無因性。",relatedArticles:"票據法§5、§13"}},
{id:"114-304-commercial-18",explanation:{coreConcept:"背書轉讓",analogy:"票據背面簽名→轉給別人→這叫背書。空白背書→誰拿到誰是權利人。",keyTakeaway:"§30背書轉讓。§31空白背書。§36背書連續。",relatedArticles:"票據法§30、§31"}},
{id:"114-304-commercial-19",explanation:{coreConcept:"票據之付款與追索",analogy:"拿票去銀行兌現→銀行不付→可以去找前手要錢（追索權）。",keyTakeaway:"§69付款提示。§85追索權。§97再追索權。",relatedArticles:"票據法§69、§85"}},
{id:"114-304-commercial-20",explanation:{coreConcept:"支票特殊規定",analogy:"支票＝見票即付的匯票。跳票＝支票不兌現→信用破產。",keyTakeaway:"§125支票。§130付款提示期限。§144支票時效1年。",relatedArticles:"票據法§125、§130"}},
{id:"114-304-commercial-21",explanation:{coreConcept:"本票與強制執行",analogy:"本票＝我欠你錢的借據。到期不付→可以聲請裁定→直接強制執行（不用打官司）。",keyTakeaway:"§3本票。§123本票裁定。免訴訟直接執行。",relatedArticles:"票據法§3、§123"}},
{id:"114-304-commercial-22",explanation:{coreConcept:"證券交易法-內線交易",analogy:"你知道公司要被併購→趕快買股票→這叫內線交易→違法！",keyTakeaway:"§157之1內線交易禁止。§171刑事責任。重大消息明確後不得交易。",relatedArticles:"證交法§157之1"}},
{id:"114-304-commercial-23",explanation:{coreConcept:"證券詐欺與操縱市場",analogy:"散布假消息炒股→操縱市場→嚴重違法。證交法§155。",keyTakeaway:"§155操縱市場禁止。§20反詐欺。§171刑罰。",relatedArticles:"證交法§20、§155"}},
{id:"114-304-commercial-24",explanation:{coreConcept:"公開收購與委託書",analogy:"想買下整間公司？公開收購＝向所有股東出價買股票。規則嚴格。",keyTakeaway:"§43之1公開收購。§25之1委託書管理。強制公開收購。",relatedArticles:"證交法§43之1"}},
{id:"114-304-commercial-25",explanation:{coreConcept:"證券商與證券市場",analogy:"買賣股票要透過券商→券商是中間人→也受嚴格監管。",keyTakeaway:"§15證券商種類。§44營業許可。§60自營商。",relatedArticles:"證交法§15、§44"}}
];
async function run(){for(const e of E){await db.collection('questions').doc(e.id).set({explanation:e.explanation},{merge:true});console.log('OK',e.id);}console.log('Done: commercial Q1-25');process.exit();}
run();
