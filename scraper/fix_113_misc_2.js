const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const explanations = [
  {
    id: "113-4301-insurance-19", tag: "保險法-財產保險代位vs人身保險無代位",
    explanation: {
      coreConcept: "財產保險（火險）賠付後有代位權，可向第三人求償。人身保險（壽險、意外險）賠付後「無」代位權，因為人命不能用金錢衡量，保險公司不能說「我賠了你的命，讓我去找兇手討錢」。",
      analogy: "你的房子被員工丙縱火燒了，火險公司A賠你500萬後，可以代替你去找丙討這500萬——因為房子有明確的市場價值，A公司賠了等值的錢，當然可以去找真正的加害人要回來。但你老婆乙也在火災中過世了，意外險公司B賠了1000萬。B公司不能去找丙討這1000萬——因為人命是無價的，保險金不是「彌補市場價值」，而是「給遺族的經濟保障」。所以人身保險沒有代位權。",
      coreExplanation: "依保險法§53規定，保險代位僅適用於「財產保險」。§103規定：「人壽保險之保險人，不得代位行使要保人或受益人因保險事故所生對於第三人之請求權。」§135準用§103，傷害保險亦同。\nA公司（火災保險＝財產保險）→賠付後得依§53對丙代位求償。✓有理由。\nB公司（意外保險＝人身保險）→依§103，不得代位求償。✗無理由。\n故(C)正確：A有理由，B無理由。",
      optionAnalysis: {
        A: "【錯誤】B公司（人身保險）無代位權。",
        B: "【錯誤】A公司（財產保險）有代位權。",
        C: "【正確（本題答案）】A有代位權，B無代位權。",
        D: "【錯誤】方向相反。"
      },
      keyTakeaway: "財產保險（房子車子） ＝ 賠完可以去找壞人討錢（有代位權）。人身保險（你的命） ＝ 人命無價不能代位（無代位權）！",
      relatedArticles: "保險法第53條、第103條"
    }
  },
  {
    id: "113-4301-insurance-20", tag: "保險法-保險契約為不要式不要物契約",
    explanation: {
      coreConcept: "保險契約為「不要式」「不要物」之諾成契約。不以保險單之交付或保費之繳納為契約成立生效要件。雙方意思表示合致（核保通過）時，契約即成立生效。",
      analogy: "你跟保險公司簽保險就像網購——你下單（填要保書）、賣家確認接單（核保通過）＝ 買賣成立！不是等貨到了（保險單寄到）或你付了款（繳保費）才算成立。\n甲6/2送出要保書，6/5繳費，6/10收到核保通過簡訊（保險公司同意承保）。在6/10那一刻，雙方意思表示合致，契約就成立生效了。甲6/12出事，契約已生效，保險公司要賠。",
      coreExplanation: "(A)錯誤：保險契約為不要式契約，不以保險單為成立要件。保險單僅為證明文件。\n(B)錯誤：保險契約非要物契約，不以繳納保費為成立生效要件。\n(C)錯誤：乙為業務員（招攬人），其接受要保書並轉送公司之行為非代表公司之承諾。契約成立需保險公司核保後始完成。\n(D)正確：保險契約為不要式不要物之「諾成契約」。A公司核保通過時（6/10），雙方意思表示合致，契約成立生效。甲於6/12死亡，契約已生效，保險人應依約給付。",
      optionAnalysis: {
        A: "【錯誤】保險單非契約成立要件。",
        B: "【錯誤】非要物契約。",
        C: "【錯誤】業務員收件非承諾。",
        D: "【正確（本題答案）】核保通過即成立生效。"
      },
      keyTakeaway: "保險契約 ＝ 保險公司點頭（核保通過）那一刻就生效了。不用等保單寄到、也不用等你繳錢！",
      relatedArticles: "保險法第21條、第43條"
    }
  },
  {
    id: "113-4301-insurance-21", tag: "保險法-違反特約條款之解除權",
    explanation: {
      coreConcept: "被保險人違反保險契約的特約條款（如「航行不得超出臺北港」），保險人的救濟方式是「解除契約」，而非自動失效。且解除權有行使期間限制（知悉後一個月內）。",
      analogy: "你的老船保了保險，保單上寫「不能開出臺北港」。結果你把船開到馬公港途中擱淺了。保險公司能不能拒賠？可以！但不是「保單自動失效」——保險公司必須在「知道你違約後一個月內」正式通知你「我要解除合約」。如果保險公司知道了卻超過一個月沒動作，解除權就過期了，你可能反而還可以理賠。",
      coreExplanation: "依保險法§68規定：「保險契約當事人之一方違背特約條款時，他方得解除契約；其危險發生後亦同。」依實務見解，違反特約條款之法律效果為保險人取得「解除權」，而非保單「自動失效」。且依§64第3項準用之規定，解除權應於知悉後一個月內行使。\n(A)錯誤：非自動失效，須保險人行使解除權。(B)正確：保險人於知悉後一個月內解除契約，即無須理賠。(C)(D)錯誤：特約條款非當然無效。",
      optionAnalysis: {
        A: "【錯誤】非自動失效。",
        B: "【正確（本題答案）】保險人須於一個月內解除契約。",
        C: "【錯誤】特約條款非當然無效。",
        D: "【錯誤】特約條款非當然無效。"
      },
      keyTakeaway: "違反保單特約 ≠ 保單自動失效。保險公司要「主動解約」（一個月內），不解約就失去機會！",
      relatedArticles: "保險法第68條"
    }
  },
  {
    id: "113-4301-insurance-23", tag: "保險法-同業公會自律規範須報主管機關核備",
    explanation: {
      coreConcept: "保險同業公會訂定自律規範後，不是「請專家審核」就可以了，而是必須報請「主管機關」核備後才能讓會員遵循。",
      analogy: "保險業的同業公會就像一個行業協會，它可以訂自己的「會內規矩」（自律規範）。但這份規矩不是找幾個專家看看就能生效——你必須把它送到「金管會」（主管機關）報備，金管會說OK了，才能要求會員遵守。選項說「請專家審核後即可」，少了最重要的一步：送主管機關！",
      coreExplanation: "本題問何者「錯誤」。\n(A)錯誤（本題答案）：依保險法§166條之規定，保險業同業公會訂定之自律規範，應「報請主管機關備查」後提供會員遵循，非僅「請專家審核後即可」。\n(B)正確：公會就會員經營業務紛爭得為必要協調。\n(C)正確：辦理主管機關委託辦理之事項。\n(D)正確：訂立實務作業規定得要求會員提供資料。",
      optionAnalysis: {
        A: "【正確（本題答案）此為錯誤敘述】須報主管機關核備，非僅專家審核。",
        B: "【正確敘述】得協調會員紛爭。",
        C: "【正確敘述】辦理委託事項。",
        D: "【正確敘述】得要求提供資料。"
      },
      keyTakeaway: "同業公會訂規矩 ＝ 要送「金管會」報備！不是找專家看看就好。主管機關的核備才是關鍵！",
      relatedArticles: "保險法第166條"
    }
  },
  {
    id: "113-4301-insurance-24", tag: "保險法-特約條款不合法但契約仍有效",
    explanation: {
      coreConcept: "關於「未來事項」的特約條款，在訂約地為不合法而未履行者，依保險法§69規定，保險契約「依然有效」。不合法的特約等於不存在，但不影響契約本體。",
      analogy: "你的保單裡有一條特約說「你必須在A地做某件事」。但這件事在A地是違法的，你當然不可能做。法律怎麼處理？不是整份保單作廢，而是「這條特約當作沒寫」，但保單本身還是有效的。就像你跟房東簽約，其中一條寫「你必須在陽台養獅子」（違法），這條當然無效，但租約本身還是有效。",
      coreExplanation: "依保險法§69規定：「關於未來事項之特約條款，於契約訂立後，其情事已非其所能控制者，或在訂約地為不合法而未履行者，保險契約不因之而失效。」故(C)「依然有效」正確。",
      optionAnalysis: {
        A: "【錯誤】非客觀不能而無效。",
        B: "【錯誤】非不拘束保險人。",
        C: "【正確（本題答案）】契約依然有效。",
        D: "【錯誤】非不拘束被保險人。"
      },
      keyTakeaway: "保單的特約條款在當地違法做不到？→ 那條特約等於沒寫，但保單本身還是有效的！",
      relatedArticles: "保險法第69條"
    }
  },
  {
    id: "113-4301-insurance-25", tag: "保險法-保險代理人經紀人公證人資格兼任限制",
    explanation: {
      coreConcept: "兼有保險代理人、經紀人、公證人資格者，依法不得同時申領執業證照。必須擇一申領，不得兼營。",
      analogy: "你同時考到了保險代理人、經紀人、公證人三張證照，你以為可以三個都掛在牆上同時執業？不行！法律規定你只能「選一個」來做。就像你不能同時當法官又當律師——角色會衝突。代理人代表保險公司、經紀人代表客戶，兩個角色立場相反，怎麼能同一個人做？",
      coreExplanation: "本題問何者「錯誤」。\n(A)正確：依§9，保險經紀人對被保險人負善良管理人注意義務及忠實義務。\n(B)錯誤（本題答案）：依保險法§163-1等規定，兼有代理人、經紀人、公證人資格者，「不得」同時申領執業證照，須擇一申領。選項稱「得同時申領」但「代理人與經紀人應擇一」，前後矛盾且不符法律規定。\n(C)正確：銀行得經主管機關許可擇一兼營代理人或經紀人業務。\n(D)正確：保險經紀人須經許可、繳保證金、投保責任保險與保證保險、領證照後始得執業。",
      optionAnalysis: {
        A: "【正確敘述】經紀人對被保險人負善良管理人義務。",
        B: "【正確（本題答案）此為錯誤敘述】不得同時申領，須擇一。",
        C: "【正確敘述】銀行得擇一兼營。",
        D: "【正確敘述】須許可繳保證金投保後領照。"
      },
      keyTakeaway: "代理人（代表保險公司）vs 經紀人（代表客戶）＝ 立場相反，不能同一個人做！有多張證照也只能選一個執業。",
      relatedArticles: "保險法第163條之1"
    }
  },
  {
    id: "113-4301-securities-37", tag: "證交法-薪資報酬委員會召開次數",
    explanation: {
      coreConcept: "薪資報酬委員會至少「每年召開二次」，不是四次。這是選項故意提高次數來混淆考生。",
      analogy: "薪酬委員會的工作是審議董事和經理人的薪水、獎金。法規規定至少一年開兩次會（通常配合上下半年的考核週期）。選項說「四次」，那是董事會的最低開會頻率，不是薪酬委員會的。搞混兩者是常見陷阱。",
      coreExplanation: "本題問何者「錯誤」。\n(A)正確：薪酬委員會成員由董事會決議委任，不得少於三人。\n(B)正確：薪酬委員會得決議委任專業人員協助，費用由公司負擔。\n(C)正確：董事會通過之薪酬優於薪酬委員會建議者，應載明差異並於二日內公告申報。\n(D)錯誤（本題答案）：依「股票上市或於證券商營業處所買賣公司薪資報酬委員會設置及行使職權辦法」規定，薪酬委員會至少每年召開「二次」，非四次。",
      optionAnalysis: {
        A: "【正確敘述】由董事會委任，不少於三人。",
        B: "【正確敘述】得委任專業人員協助。",
        C: "【正確敘述】差異應載明並公告。",
        D: "【正確（本題答案）此為錯誤敘述】至少每年二次，非四次。"
      },
      keyTakeaway: "薪酬委員會 ＝ 至少一年開「2次」。不是4次！4次是董事會的頻率，別搞混！",
      relatedArticles: "薪資報酬委員會設置及行使職權辦法"
    }
  },
  {
    id: "113-4301-securities-39", tag: "證交法-庫藏股買回總金額上限",
    explanation: {
      coreConcept: "公司買回庫藏股的總金額上限 ＝ 保留盈餘 ＋ 已實現之資本公積。法定盈餘公積不計入。",
      analogy: "公司想從市場上買回自家股票（庫藏股），口袋裡能拿出多少錢？法律規定上限 ＝ 「保留盈餘」＋「已實現的資本公積」。法定盈餘公積（法律強制保留的錢）不能動用。\n本題：保留盈餘1億 ＋ 已實現資本公積2億 ＝ 3億。法定盈餘公積5億不算進去。所以上限是3億元。",
      coreExplanation: "依證券交易法§28-2第2項規定：「公司買回股份之總金額，不得逾保留盈餘加已實現之資本公積之金額。」\n本題A公司：\n法定盈餘公積5億 → 不計入（法定保留，不得用於買回）\n保留盈餘1億 → 計入\n已實現之資本公積2億 → 計入\n上限 = 1億 + 2億 = 3億元。(A)正確。",
      optionAnalysis: {
        A: "【正確（本題答案）】3億 = 保留盈餘1億 + 已實現資本公積2億。",
        B: "【錯誤】6億錯誤計入法定盈餘公積。",
        C: "【錯誤】7億包含全部公積，計算錯誤。",
        D: "【錯誤】8億包含全部金額，計算錯誤。"
      },
      keyTakeaway: "庫藏股買回上限 ＝ 保留盈餘 ＋ 已實現資本公積。法定盈餘公積是鐵金庫，不能動！",
      relatedArticles: "證券交易法第28條之2"
    }
  },
  {
    id: "113-4301-securities-63", tag: "證交法-公開說明書（Prospectus）英文題",
    explanation: {
      coreConcept: "「Prospectus」（公開說明書）是發行人向公眾提供的書面說明文件，用於公開募集或銷售有價證券。",
      analogy: "A prospectus is like a restaurant's menu with detailed ingredient lists. When a company wants to sell stocks to the public, it must prepare this document explaining everything about the company and the securities being offered — so investors can make informed decisions. It's NOT a warranty (保證書), NOT a proxy statement (委託書), and NOT a representation (聲明). It's specifically the 'prospectus' = 公開說明書。",
      coreExplanation: "Under Taiwan's Securities and Exchange Act (§30-31), a 'prospectus' (公開說明書) is a written document that an issuer provides to the general public for the purpose of offering or selling securities. It contains comprehensive information about the issuer, its financial condition, and the securities being offered.\n(A) Warranty = 保證書 → incorrect.\n(B) Proxy statement = 委託書 → used for shareholder voting, not securities offering.\n(C) Representation = 聲明 → too general.\n(D) Prospectus = 公開說明書 → correct.",
      optionAnalysis: {
        A: "【錯誤】Warranty is a guarantee, not a disclosure document.",
        B: "【錯誤】Proxy statement relates to voting, not securities offering.",
        C: "【錯誤】Representation is too general a term.",
        D: "【正確（本題答案）】Prospectus = 公開說明書。"
      },
      keyTakeaway: "Prospectus（公開說明書）＝ 公司公開賣股票時必須給投資人看的「說明書」。就像產品的使用手冊。",
      relatedArticles: "證券交易法第30條"
    }
  },
  {
    id: "113-4301-enforcement-54", tag: "強制執行法-假扣押追加查封不受30日限制",
    explanation: {
      coreConcept: "假扣押裁定的30日執行期限，僅限「第一次」聲請執行。之後若發現債務人有其他財產需要追加查封，不受30日限制，隨時可以聲請。",
      analogy: "法院給你一張假扣押令，你必須在收到後30天內去法院聲請查封債務人的財產（否則令就過期了）。你在期限內查封了一塊200萬的A地。後來發現債務人還有一塊300萬的B地，你想追加查封——需要重新申請假扣押令嗎？不用！第一次執行（查封A地）已經在30天內完成了，之後的追加查封不受30天限制。就像機票的登機時間只管你「第一次登機」，上了飛機後要不要在機上多買一杯咖啡，不受登機時間限制。",
      coreExplanation: "依強制執行法§132規定：「假扣押之執行，應在假扣押裁定送達後三十日內為之。」此30日限制僅指「第一次聲請執行」。\n債權人甲已於30日內聲請查封A地（第一次執行合法），其後發現乙另有B地而聲請追加查封，依實務見解，追加查封屬同一假扣押裁定之繼續執行，不受30日期限之限制。\n(A)(B)(C)錯誤：追加查封不需在30日內，也不需另行取得新裁定。\n(D)正確：追加查封雖已逾30日，仍屬合法。",
      optionAnalysis: {
        A: "【錯誤】追加查封不受30日限制。",
        B: "【錯誤】30日只限第一次執行。",
        C: "【錯誤】不須另行取得假扣押裁定。",
        D: "【正確（本題答案）】追加查封逾30日仍合法。"
      },
      keyTakeaway: "假扣押的30天期限只管「第一次查封」。之後追加查封不受限制——就像登機時間只管你上飛機，上了之後隨便你！",
      relatedArticles: "強制執行法第132條"
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
