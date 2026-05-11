const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const explanations = [
  {
    id: "114-304-legal_english-56", tag: "法學英文-民法-共同侵權",
    explanation: {
      coreConcept: "Joint and several liability 意指「連帶責任」，數人對同一損害皆負有全部賠償之責。",
      analogy: "當兩個人一起砸壞別人的車（共同侵權），車主可以向其中任何一個人要求賠償「全部」的修車費，這叫做「連帶責任」（Joint and several）。",
      coreExplanation: "本題測驗民法第185條共同侵權行為之英譯。法條中「連帶負損害賠償責任」對應的英文法律術語為「joint and several liability」。(A) joint and several：連帶的；(B) discrete：分離的、個別的；(C) independent：獨立的；(D) increased：增加的。故選(A)。",
      optionAnalysis: {
        A: "【正確（本題答案）】joint and several liability（連帶責任）。",
        B: "【錯誤】discrete 指分離的。",
        C: "【錯誤】independent 指獨立的。",
        D: "【錯誤】increased 指增加的。"
      },
      keyTakeaway: "看到「民法第185條（共同侵權）」＋「two or more persons（數人）」，就是考「連帶責任」＝ joint and several liability。",
      relatedArticles: "民法第185條"
    }
  },
  {
    id: "114-304-legal_english-57", tag: "法學英文-侵權行為-妨害安寧",
    explanation: {
      coreConcept: "Nuisance 指「滋擾、妨害安寧」，如製造噪音、惡臭干擾他人對土地之和平使用權利。",
      analogy: "半夜放重低音音樂吵醒鄰居，雖然沒有「闖進」鄰居的房子（Trespass），但噪音已經嚴重干擾了鄰居睡覺的權益，這在英美法上稱為「Nuisance（滋擾/妨害安寧）」。",
      coreExplanation: "題目敘述 Oliver 半夜大聲播放音樂吵醒鄰居 Smith 夫婦，此種對他人居住環境與安寧的干擾，構成英美法上的「Nuisance」（滋擾）。(A) trespass：擅闖、侵害實體財產，必須有實體的侵入；(B) nuisance：妨害安寧、滋擾，如噪音、氣味干擾；(C) pain and suffering：精神與肉體上的痛苦（通常是人身傷害的損害賠償項目）；(D) mental distress：精神創傷。故選(B)。",
      optionAnalysis: {
        A: "【錯誤】trespass 須有實體侵入（如擅自跑進別人家院子）。",
        B: "【正確（本題答案）】nuisance 為滋擾、妨害安寧（如噪音）。",
        C: "【錯誤】pain and suffering 為損害賠償之一種項目。",
        D: "【錯誤】mental distress 為精神創傷。"
      },
      keyTakeaway: "噪音干擾（loud music）＝ Nuisance（滋擾）。未經同意進入別人家＝ Trespass（擅闖）。",
      relatedArticles: "侵權行為法（Tort Law）- Nuisance"
    }
  },
  {
    id: "114-304-legal_english-58", tag: "法學英文-侵權行為-替代責任",
    explanation: {
      coreConcept: "Vicarious liability 指「替代責任」，即一方（如雇主）雖無直接過失，但須為另一方（如員工）的侵權行為負責。",
      analogy: "外送員送餐時撞到人，雖然外送平台的老闆當時乖乖坐在辦公室沒有錯，但法律規定老闆要幫員工的過失買單。這種「代人受過」的責任就叫做「替代責任」（Vicarious liability）。",
      coreExplanation: "題目描述 A 因為 B 是其員工（employee）、代理人（agent）而須對 B 的侵權行為負責，即使 A 本身並無過失（without fault on the part of A）。此種責任在法律上稱為「Vicarious liability」（替代責任/僱用人責任）。(A) Contributory liability：與有過失責任；(B) Vicarious liability：替代責任；(C) Strict liability：嚴格責任（從事危險活動本身直接負責，非因僱用關係）；(D) Joint liability：共同責任。故選(B)。",
      optionAnalysis: {
        A: "【錯誤】Contributory liability 指被害人自己也有過失。",
        B: "【正確（本題答案）】Vicarious liability 指雇主為員工負責的替代責任。",
        C: "【錯誤】Strict liability 指無過失責任/嚴格責任。",
        D: "【錯誤】Joint liability 指共同連帶責任。"
      },
      keyTakeaway: "Employee/Agent (員工/代理人做錯) ＋ Employer is liable (老闆負責) ＝ Vicarious liability (替代責任)。",
      relatedArticles: "侵權行為法（Tort Law）- Vicarious Liability"
    }
  },
  {
    id: "114-304-legal_english-59", tag: "法學英文-侵權行為-嚴格責任",
    explanation: {
      coreConcept: "Strict liability 指「嚴格責任 / 無過失責任」，原告不須證明被告有過失即可求償。",
      analogy: "如果你家養了一隻獅子當寵物，獅子跑出去咬傷人，受害者不需要證明你「籠子沒鎖好」或「有疏忽」，只要你是獅子的主人，你就要賠錢。這種不管你有沒有錯都要負責的規定，叫「嚴格責任」（Strict liability）。",
      coreExplanation: "題目敘述「___ is liability regardless of fault. The plaintiff does not have to prove... that the defendant was at fault.」（不論過失之責任，原告無須證明被告有過失）。這正是「Strict liability」（嚴格責任/無過失責任）的定義。(A) Negligent liability：過失責任（須證明過失）；(B) Intentional liability：故意責任；(C) Strict liability：嚴格責任；(D) Inducing liability：引誘責任。故選(C)。",
      optionAnalysis: {
        A: "【錯誤】Negligent liability 必須證明被告有過失（fault）。",
        B: "【錯誤】Intentional liability 必須證明被告有故意（intent）。",
        C: "【正確（本題答案）】Strict liability 意為無須證明過失的嚴格責任。",
        D: "【錯誤】法律上無此專門術語。"
      },
      keyTakeaway: "regardless of fault (不論有無過失) ＝ Strict liability (嚴格責任 / 無過失責任)。",
      relatedArticles: "侵權行為法（Tort Law）- Strict Liability"
    }
  },
  {
    id: "114-304-legal_english-61", tag: "法學英文-證券交易法-私募",
    explanation: {
      coreConcept: "Private placement 指「私募」，係指向特定人（如專業投資機構）招募有價證券，不對一般大眾公開。",
      analogy: "公司缺錢想募資，如果不昭告天下，而是私底下找幾家有錢的保險公司或退休基金來投資，這種「不對外公開的私下募資」就叫做「私募」（Private placement）。",
      coreExplanation: "題目敘述「offer the securities only to professional investors... outside of a public offering」（僅向專業投資者如保險公司、退休基金等提供證券，而非公開發行）。此即為證券交易法上所稱之「Private placement」（私募）。(A) gun-jumping：偷跑（在准許發行前即先進行推銷）；(B) private placement：私募；(C) public issuance / public offering：公開發行（對一般大眾）；(D) spin-off：分拆（將公司部分業務獨立為新公司）。故選(B)。",
      optionAnalysis: {
        A: "【錯誤】gun-jumping 指違法提早推銷證券。",
        B: "【正確（本題答案）】private placement 為私募。",
        C: "【錯誤】public issuance 係指公開發行。",
        D: "【錯誤】spin-off 為公司業務分拆。"
      },
      keyTakeaway: "only to professional investors (僅向專業投資者) ＋ outside of public offering (非公開發行) ＝ Private placement (私募)。",
      relatedArticles: "證券法（Securities Law）- Private Placement"
    }
  },
  {
    id: "114-304-legal_english-62", tag: "法學英文-刑法-量刑",
    explanation: {
      coreConcept: "我國刑法之量刑目的兼具應報（Retribution）與威嚇/預防（Deterrence）。",
      analogy: "為什麼要處罰壞人？第一是因為他做錯事要付出代價（應報）；第二是為了嚇阻他和其他人未來不要再犯（威嚇/預防）。這兩個是我國刑法量刑的核心目標。",
      coreExplanation: "本題因擷取問題，選項文字有嚴重錯置。正確的題意分析如下：\n本題問我國刑法量刑何者正確。\n(1) 正確敘述（原題選項A）：Both retribution and deterrence are the goals of penalties...（應報與威嚇皆為我國刑法量刑之目標）。\n(2) 錯誤敘述（原題選項B）：Imposing a sentence shall not consider the circumstantial evidence with regard to the defendant's character...（量刑不應考量被告性格、犯後態度等）。此違反刑法第57條。\n(3) 錯誤敘述（原題選項C）：Pursuant to Taiwan’s Constitutional Court Ruling, the recidivist must be punished with an enhanced penalty...（依大法官解釋，累犯「必須」加重其刑）。此違反釋字第775號解釋（不應一律加重）。\n(4) 錯誤敘述（原題選項D）：A probation cannot be imposed with additional condition(s).（緩刑不能附條件）。此違反刑法第74條。本題答案應為(A)。",
      optionAnalysis: {
        A: "【正確（本題答案）】原題A選項為：Both retribution and deterrence are the goals...（應報與威嚇皆為目標）。",
        B: "【錯誤】量刑「必須」考量犯後態度及性格（刑法§57）。",
        C: "【錯誤】大法官釋字第775號宣告累犯一律加重違憲，非「must be punished...」。",
        D: "【錯誤】緩刑得附條件（刑法§74）。"
      },
      keyTakeaway: "Retribution = 應報；Deterrence = 威嚇。刑罰的目的兩者兼具。",
      relatedArticles: "刑法第57條、釋字第775號"
    }
  },
  {
    id: "114-304-legal_english-63", tag: "法學英文-憲法-緊急命令追認",
    explanation: {
      coreConcept: "Ratification 意指「追認/批准」。總統發布緊急命令後，須提交立法院「追認」。",
      analogy: "總統遇到國家大災難時，可以先斬後奏發布「緊急命令」，但事後（10天內）必須交給立法院審查同意，這個事後的同意程序在英文叫做「Ratification（追認）」。",
      coreExplanation: "題目敘述「The emergency decree issued by the President shall be presented to the Legislative Yuan for ______ within 10 days of issuance.」（總統發布之緊急命令，應於發布後10日內提交立法院___）。依憲法增修條文第2條第3項，應提交立法院「追認」。「追認」對應的法律英文為 Ratification。(A) ratification：追認、批准；(B) response：回應；(C) reconciliation：和解、調和；(D) examination：檢查、審查。故選(A)。",
      optionAnalysis: {
        A: "【正確（本題答案）】ratification（追認）。",
        B: "【錯誤】response（回應）非法定術語。",
        C: "【錯誤】reconciliation（和解）與此無關。",
        D: "【錯誤】examination 僅為審查，不足以表達追認同意之效力。"
      },
      keyTakeaway: "Emergency decree (緊急命令) ＋ Legislative Yuan (立法院) ＝ Ratification (追認)。",
      relatedArticles: "憲法增修條文第2條第3項"
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
