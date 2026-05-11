const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const E = [
{id:"114-304-international-01",explanation:{coreConcept:"國際法主體與國家承認",analogy:"國家像俱樂部會員——要被其他會員承認才能參加活動。但承認有「宣示說」和「構成說」之爭。",keyTakeaway:"國家四要素：人民、領土、政府、主權。承認：宣示說vs構成說。",relatedArticles:"蒙特維多公約§1"}},
{id:"114-304-international-02",explanation:{coreConcept:"條約法-維也納條約法公約",analogy:"國家之間的合約＝條約。要經簽署→批准→生效。保留＝我同意但這條不算。",keyTakeaway:"VCLT§2條約定義。§19保留。§26條約必須遵守（pacta sunt servanda）。",relatedArticles:"VCLT§2、§19、§26"}},
{id:"114-304-international-03",explanation:{coreConcept:"國際法淵源",analogy:"國際法從哪來？條約、習慣法、一般法律原則＝三大淵源。ICJ規約§38。",keyTakeaway:"ICJ規約§38：條約→習慣法→一般法律原則→學說判例（輔助）。",relatedArticles:"ICJ規約§38"}},
{id:"114-304-international-04",explanation:{coreConcept:"國際人權法",analogy:"人權是普世的→不管你是哪國人都有基本權利。UDHR＝世界人權宣言。",keyTakeaway:"UDHR/ICCPR/ICESCR三大人權文件。不可克減權利：生命權、免受酷刑。",relatedArticles:"ICCPR§4"}},
{id:"114-304-international-05",explanation:{coreConcept:"外交與領事關係",analogy:"大使館不可侵犯→即使罪犯躲進去，警察也不能闖入。外交豁免＝外交官免受地主國管轄。",keyTakeaway:"維也納外交關係公約§22使館不可侵犯。§31外交豁免。§41領事職務。",relatedArticles:"VCDR§22、§31"}},
{id:"114-304-international-06",explanation:{coreConcept:"國際爭端解決",analogy:"國家吵架→談判→調解→仲裁→ICJ。和平解決爭端原則。",keyTakeaway:"UN憲章§33和平解決。ICJ管轄：合意管轄/任擇強制管轄。",relatedArticles:"UN憲章§33"}},
{id:"114-304-international-07",explanation:{coreConcept:"海洋法",analogy:"海洋像一圈一圈的洋蔥：領海12海里→鄰接區24→EEZ 200→公海。",keyTakeaway:"UNCLOS：領海12nm、EEZ 200nm、大陸礁層。無害通過權。",relatedArticles:"UNCLOS§3、§57"}},
{id:"114-304-international-08",explanation:{coreConcept:"國際人道法與武裝衝突法",analogy:"打仗也有規則——不能打平民、不能用毒氣、要善待戰俘。日內瓦公約。",keyTakeaway:"日內瓦四公約。區分原則。比例原則。禁止不必要痛苦。",relatedArticles:"日內瓦公約"}},
{id:"114-304-international-09",explanation:{coreConcept:"國際組織法-聯合國",analogy:"聯合國＝全球最大的「社區管委會」。安理會5常任有否決權。",keyTakeaway:"UN憲章§1宗旨。§27安理會表決。§39-§51集體安全。",relatedArticles:"UN憲章§27"}},
{id:"114-304-international-10",explanation:{coreConcept:"國家責任",analogy:"國家做錯事也要負責——違反國際法義務→國家責任→賠償。",keyTakeaway:"ILC國家責任條款。歸因原則。賠償方式：回復原狀/金錢賠償/滿足。",relatedArticles:"ILC國家責任條款"}},
{id:"114-304-international-11",explanation:{coreConcept:"國際私法-法律適用",analogy:"跨國糾紛適用哪國法？涉外民事法律適用法告訴你——看連結因素決定。",keyTakeaway:"涉外民事法律適用法§1。連結因素：國籍、住所、行為地、物之所在地。",relatedArticles:"涉外民事法律適用法§1"}},
{id:"114-304-international-12",explanation:{coreConcept:"國際私法-契約準據法",analogy:"跨國買賣用哪國法？原則：當事人合意選擇（意思自主原則）。沒選→最密切關係。",keyTakeaway:"§20契約準據法：意思自主→最密切關係。§21消費者保護。",relatedArticles:"涉外民事法律適用法§20"}},
{id:"114-304-international-13",explanation:{coreConcept:"國際私法-侵權行為",analogy:"在日本被台灣人撞→用哪國法？原則：侵權行為地法。",keyTakeaway:"§25侵權行為地法。§26當事人共同本國法或住所地法。",relatedArticles:"涉外民事法律適用法§25"}},
{id:"114-304-international-14",explanation:{coreConcept:"國際私法-婚姻與身分",analogy:"台灣人在美國結婚→婚姻效力看哪國法？§46各該當事人之本國法。",keyTakeaway:"§46婚姻成立。§47婚姻效力。§48離婚。§49親子關係。",relatedArticles:"涉外民事法律適用法§46"}},
{id:"114-304-international-15",explanation:{coreConcept:"國際私法-物權",analogy:"日本人在台灣買房→用台灣法（物之所在地法）。動產例外：隨人。",keyTakeaway:"§38物權依物之所在地法。§43船舶依船籍國法。",relatedArticles:"涉外民事法律適用法§38"}},
{id:"114-304-international-16",explanation:{coreConcept:"國際私法-繼承",analogy:"外國人死在台灣留遺產→用被繼承人本國法。但不動產→所在地法。",keyTakeaway:"§58繼承依被繼承人本國法。不動產繼承依所在地法。",relatedArticles:"涉外民事法律適用法§58"}},
{id:"114-304-international-17",explanation:{coreConcept:"國際裁判管轄",analogy:"跨國案件去哪國法院告？看被告住所、契約履行地、侵權行為地。",keyTakeaway:"國際裁判管轄：被告住所地、財產所在地、合意管轄。不便利法庭原則。",relatedArticles:"民訴§1、§12"}},
{id:"114-304-international-18",explanation:{coreConcept:"外國判決之承認與執行",analogy:"外國法院判的→台灣要不要認？§402四要件：管轄權、送達、不違公序。",keyTakeaway:"民訴§402承認要件。§403裁定執行。互惠原則。",relatedArticles:"民訴§402"}},
{id:"114-304-international-19",explanation:{coreConcept:"反致與公序良俗",analogy:"台灣法說用日本法→日本法說用台灣法→反致！§6原則不採反致。公序良俗→§8外國法違反→不適用。",keyTakeaway:"§6反致：原則不採。§8公序良俗條款。§7法律規避。",relatedArticles:"涉外民事法律適用法§6、§8"}}
];
async function run(){for(const e of E){await db.collection('questions').doc(e.id).set({explanation:e.explanation},{merge:true});console.log('OK',e.id);}console.log('Done: international Q1-19');process.exit();}
run();
