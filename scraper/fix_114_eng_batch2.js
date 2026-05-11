const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const explanations = [
  {
    id: "114-304-legal_english-65", tag: "法學英文-代理與授權",
    explanation: {
      coreConcept: "Power of attorney 指「委任狀 / 授權書」，是賦予他人（通常為律師或代理人）代表自己行事權限的法律文件。",
      analogy: "你要請律師幫你打官司，不能只用嘴巴說，必須簽一張「委任狀」交給法院，證明這個律師有權利代表你發言。這張授權文件在英文叫做 Power of attorney。",
      coreExplanation: "題目敘述「A(An) ______ is an agreement... which gives the attorney rights to act in the principal’s position. For example, a lawyer needs to have her client sign such the agreement before representing the client...」（給予代理人權限以本人身分行事之協議。例如律師代表客戶出庭前需請客戶簽署之文件）。此即為委任狀或授權書。(A) agency agreement：代理協議（較廣泛）；(B) power of attorney：委任狀/授權書（專指此特定法律文書）；(C) authorizing statement：授權聲明（非法定專有名詞）；(D) contract of empowerment：賦權契約（非法定專有名詞）。故選(B)。",
      optionAnalysis: {
        A: "【錯誤】agency agreement 泛指代理契約，未精確指涉訴訟或特定授權委任狀。",
        B: "【正確（本題答案）】power of attorney 即為律師委任狀或一般授權書。",
        C: "【錯誤】非法律專有名詞。",
        D: "【錯誤】非法律專有名詞。"
      },
      keyTakeaway: "律師出庭前要客戶簽的文件 ＝ Power of Attorney（POA，委任狀/授權書）。",
      relatedArticles: "民事訴訟法第69條（訴訟代理權之委任）"
    }
  },
  {
    id: "114-304-legal_english-66", tag: "法學英文-憲法-違憲審查",
    explanation: {
      coreConcept: "Standard of scrutiny 意指「審查標準」。最高級別為 strict scrutiny（嚴格審查），法院對政府行為不予寬容與退讓（not defer）。",
      analogy: "法院在審查政府有沒有違憲時，就像戴上不同倍數的「放大鏡」。如果政府侵犯了核心基本權，法院就會戴上最高倍數的放大鏡（嚴格審查，Strict scrutiny），不容許政府隨便找藉口蒙混過關。",
      coreExplanation: "題目敘述「The level of ______ essentially dictates the lens through which the court will analyze the governmental action. Its highest level means that the court will not defer to the government...」（______的程度決定了法院分析政府行為的視角。其最高程度意味著法院對政府目的或手段將毫不退讓/尊讓）。這描述的是憲法違憲審查中的「審查標準」（Standard of scrutiny）。(A) security：安全；(B) protection：保護；(C) deference：尊讓/尊重（指法院對行政或立法機關之判斷予以尊重）；(D) scrutiny：審查。故選(D)。",
      optionAnalysis: {
        A: "【錯誤】security 指安全。",
        B: "【錯誤】protection 指保護。",
        C: "【錯誤】deference 指法院對機關的「尊重/退讓」，與最高級別不退讓之語境不符。",
        D: "【正確（本題答案）】scrutiny（審查），highest level of scrutiny 即嚴格審查標準。"
      },
      keyTakeaway: "Court analyze governmental action (法院分析政府行為) ＋ highest level (最高級別) ＝ Scrutiny (審查，即違憲審查標準)。",
      relatedArticles: "憲法（Constitutional Law）- Standard of Scrutiny"
    }
  },
  {
    id: "114-304-legal_english-67", tag: "法學英文-刑法-量刑原則",
    explanation: {
      coreConcept: "Proportionality principle 即「比例原則」，量刑必須與犯罪的嚴重程度及行為人的罪責成比例（罪刑相當）。",
      analogy: "偷一塊麵包不能判死刑，因為懲罰太重了，不符合「比例原則」。罪多重就判多重，這就是量刑的核心標準。",
      coreExplanation: "題目問關於量刑（sentencing）的敘述何者正確。(A) Sentencing is at the discretion of the prosecutor.（量刑是檢察官的裁量權）：錯誤，量刑是法官（judge）的職權。(B) Sentencing should be imposed based only on consideration of the material elements...（量刑僅需考量客觀構成要件）：錯誤，亦須考量犯後態度、動機等（刑法§57）。(C) Sentencing should comply with the proportionality principle.（量刑應符合比例原則）：正確，即罪刑相當原則。(D) The death penalty can be imposed... on juveniles.（死刑可判處並執行於未成年人）：錯誤，未滿18歲不得處死刑（刑法§63）。故選(C)。",
      optionAnalysis: {
        A: "【錯誤】量刑（sentencing）為法官（judge）之權限，非檢察官（prosecutor）。",
        B: "【錯誤】量刑不能「只（only）」考量犯罪構成要件，還要考量其他情狀。",
        C: "【正確（本題答案）】量刑必須符合比例原則（proportionality principle）。",
        D: "【錯誤】未成年人（juveniles）不得判處死刑。"
      },
      keyTakeaway: "Sentencing (量刑) 必須符合 Proportionality principle (比例原則/罪刑相當原則)。",
      relatedArticles: "刑法第57條、第63條"
    }
  },
  {
    id: "114-304-legal_english-68", tag: "法學英文-公司法-累積投票制",
    explanation: {
      coreConcept: "Cumulative voting 指「累積投票制」，為公司法選舉董事時，保障少數股東能將選票集中投給特定候選人之制度。",
      analogy: "選3個董事，你手上有1張股票。如果是一般投票，你對每個人只能投1票；但在「累積投票制」下，你的1張股票會變成3票，你可以把這3票「全部集中」投給你最支持的那一個候選人，幫助他當選。",
      coreExplanation: "題目敘述「a voting system in which each voter may cast more than one vote for the same candidate... and the total number of votes per share may be consolidated for election of one candidate.」（一種投票制度，每股之選票數等於應選董事人數，且得集中選舉一人）。此即我國公司法第198條規定之「累積投票制」。對應之英文為 cumulative voting。(A) cumulative voting：累積投票制；(B) straight voting：直接/一般投票制（不得集中選票）；(C) collective voting：集體投票；(D) accumulative voting：非正規法律術語。故選(A)。",
      optionAnalysis: {
        A: "【正確（本題答案）】cumulative voting（累積投票制）。",
        B: "【錯誤】straight voting 不允許選票集中於同一人。",
        C: "【錯誤】非專有名詞。",
        D: "【錯誤】正確專有名詞為 cumulative，而非 accumulative。"
      },
      keyTakeaway: "electing directors (選董事) + consolidated for election of one candidate (集中選一人) ＝ Cumulative voting (累積投票制)。",
      relatedArticles: "公司法第198條"
    }
  },
  {
    id: "114-304-legal_english-69", tag: "法學英文-公司法-關係企業",
    explanation: {
      coreConcept: "Controlling company（控制公司）與 Subordinate company（從屬公司）。計算控制持股時，應計入從屬公司對第三家公司之持股（間接持股）。",
      analogy: "A公司是B公司的超級大老闆（佔80%）。B公司又是C公司的百分百老闆（佔100%）。在法律上，既然A控制了B，那B手上的東西也就是A的，所以A也是C的控制公司（間接控制）。",
      coreExplanation: "依我國公司法第369條之2規定，持有他公司有表決權之股份超過半數者，為「控制公司」（controlling company）。同法第369條之11規定，計算股份時，控制公司及其「從屬公司」所持有他公司之股份應合併計算。本題中，ABC持有DEF 80%股份（ABC為控制公司）。DEF持有GHI 100%股份。因此，ABC加上其從屬公司DEF的持股，合計持有GHI 100%股份，故ABC亦為GHI之控制公司。(A) ABC Co. is the controlling company of GHI Co.：正確。(B) DEF控制JKL：錯誤。(C) JKL控制DEF：錯誤。(D) JKL控制GHI：錯誤。故選(A)。",
      optionAnalysis: {
        A: "【正確（本題答案）】ABC透過從屬公司DEF，間接持有GHI全部股份，故ABC為GHI之控制公司。",
        B: "【錯誤】DEF對JKL無持股關係。",
        C: "【錯誤】JKL對DEF無持股關係。",
        D: "【錯誤】JKL對GHI無持股關係。"
      },
      keyTakeaway: "A控制B，B控制C → A也控制C（合併計算持股）。Controlling company = 控制公司。",
      relatedArticles: "公司法第369-2、369-11條"
    }
  },
  {
    id: "114-304-legal_english-70", tag: "法學英文-契約法-要約之客觀判斷",
    explanation: {
      coreConcept: "契約成立與否，英美法採客觀理論（Objective theory of contracts），即判斷是否構成「要約（offer）」時，應以「理性受要約人（offeree）」之客觀認知為準。",
      analogy: "你登廣告說「這台車賣10元」。別人拿10元來買，你說「我只是開玩笑的（主觀想法）」。法律不管你心裡怎麼想，法律只看「一個正常人（客觀標準）看到廣告，會不會覺得你是認真要賣的？」如果會，那就是要約成立。",
      coreExplanation: "題目敘述「whether an offer has been made depends on the reasonableness of the alleged ______'s belief...」（是否構成要約，取決於______認為該廣告為要約的信念是否合理）。英美契約法採「客觀理論」，不探究表意人之主觀（subjective）意圖，而是從「客觀上（objective）」一個理性之「受要約人 / 相對人（offeree）」的角度來判斷該意思表示是否構成要約。故應填入 objective 及 offeree。(A) objective (客觀), offeror (要約人)；(B) subjective (主觀), offeror；(C) objective, offeree (受要約人)；(D) subjective, offeree。故選(C)。",
      optionAnalysis: {
        A: "【錯誤】判斷標準為受要約人（offeree），非要約人（offeror）。",
        B: "【錯誤】契約法不採主觀標準（subjective）。",
        C: "【正確（本題答案）】採客觀標準（objective），且以受要約人（offeree）的合理認知為準。",
        D: "【錯誤】不採主觀標準。"
      },
      keyTakeaway: "契約判斷標準＝ Objective (客觀，看正常人怎麼想)。發出要約的人＝ Offeror；接收要約的人＝ Offeree。",
      relatedArticles: "契約法（Contract Law）- Objective Theory of Contracts"
    }
  }
];

async function run() {
  for (const item of explanations) {
    const dataToUpdate = { tag: item.tag, explanation: item.explanation };
    if (item.answer) dataToUpdate.answer = item.answer;
    await db.collection('questions').doc(item.id).set(dataToUpdate, { merge: true });
    console.log('OK ' + item.id);
  }
  console.log(`Done: ${explanations.length} fixed`);
  process.exit();
}
run();
