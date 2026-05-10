const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const explanations = [
  {
    id: "113-2301-constitutional-16",
    tag: "國家機關-考試院",
    explanation: {
      coreConcept: "考試院之職掌與獨立性",
      analogy: "考試院就像是國家的人事部加考選部。它決定誰能進來當員工（考選），進來後怎麼保障權益（保障）。為了怕長官（行政院）隨便塞親戚進來，所以這個部門要獨立運作。",
      coreExplanation: "考試院為國家最高考試機關，掌理考選、銓敘、保障、培訓、任免、考績、級俸、陞遷、褒獎等法制事項。考試委員須超出黨派，依據法律獨立行使職權。考試院雖非立法機關，但可向立法院提出職權相關之法律案。",
      optionAnalysis: {
        A: "正確。獨立性是考試院存在的核心價值。",
        B: "正確。憲法增修條文明定考試委員人數從 19 人精簡為 7 至 9 人（目前實務為 7 人）。",
        C: "正確。保障公務人員不因政治鬥爭而受害是其重要職責。",
        D: "錯誤（本題答案）。考試院確有「法律提案權」，可直接向立法院提出與其職掌相關之法律修正案（如公務人員任用法）。"
      },
      keyTakeaway: "「考選銓敘我來管」，考試院是公務員身分的守護者。",
      relatedArticles: "憲法第 83-88 條、增修條文第 6 條"
    }
  },
  {
    id: "113-2301-constitutional-17",
    tag: "國家機關-監察院",
    explanation: {
      coreConcept: "監察院之彈劾與糾舉權",
      analogy: "監察院就像是公司的糾察隊。它不負責「開除」員工（處分），那是懲戒法院的事；纠察隊負責的是「舉報」（彈劾）並移送審理。如果發現行政部門計畫做得太爛，還會發「糾正案」要他們改進。",
      coreExplanation: "監察院為最高監察機關，行使彈劾、糾舉及審計權。彈劾權針對公務人員失職或違法。監察院雖可提出彈劾，但最終的處罰（如撤職、減俸）是由司法院下轄的懲戒法院決定。這體現了「糾彈在監察，懲戒在司法」的分權原則。",
      optionAnalysis: {
        A: "錯誤。訓練屬於行政院（或授權考試院）之職權。",
        B: "錯誤。保障措施通常由考試院（保障培訓委員會）處理。",
        C: "正確。監察院發現公務員違法失職，應提出彈劾案並移送懲戒法院。",
        D: "錯誤。施以懲戒是「司法權」（懲戒法院）之行使結果，而非監察院之職權內容。"
      },
      keyTakeaway: "「糾彈移送歸監察，裁判懲戒歸司法」，分工明確不越權。",
      relatedArticles: "憲法第 90-106 條、增修條文第 7 條"
    }
  },
  {
    id: "113-2301-constitutional-18",
    tag: "司法救濟-憲法訴訟",
    explanation: {
      coreConcept: "法院聲請憲法法庭裁判程序",
      analogy: "法官在審案時，如果覺得手上的「法律武器」可能已經過期或壞掉了（違憲），他不能直接丟掉，必須先暫停比賽（停審），然後向憲法法庭（最高裁判所）請示這支武器還能不能用。",
      coreExplanation: "憲法訴訟法規定，法院於審理案件時，對應適用之法律，確信有牴觸憲法之疑義者，應裁定停止訴訟程序，聲請憲法法庭宣告違憲。此為「法官聲請法規範憲法審查」。",
      optionAnalysis: {
        A: "正確。聲請書必須詳列理由與確信違憲之論據。",
        B: "正確。必須該法律在該案件中是「先決問題」（非用不可），且法官確信違憲。",
        C: "錯誤（本題答案）。聲請主體是審理該案件的「各級法院（承辦官員/合議庭）」，不限於「院長」。實務上是承辦案件的法官或合議庭名義聲請。",
        D: "正確。確信適用之法律違憲是聲請的必要前提。"
      },
      keyTakeaway: "「法官懷疑法律，憲法法庭定奪」，裁判停止是聲請的前提。",
      relatedArticles: "憲法訴訟法第 55-58 條"
    }
  },
  {
    id: "113-2301-constitutional-19",
    tag: "國家機關-權力分立",
    explanation: {
      coreConcept: "憲政機關之忠誠義務與同意權",
      analogy: "這就像是規定家裡一定要有兩個家教，爸爸（總統）要找人，媽媽（立法院）要點頭。如果媽媽故意一直搖頭（或不理不睬），導致家教一直空缺，這就不符合「為了小孩好（國家運作）」的初衷。",
      coreExplanation: "各憲政機關間應負有「憲法忠誠義務」，共同維護憲法秩序。總統具有人事提名權，立法院具有同意權。若立法院刻意消極不行使同意權，導致憲政機關（如監察院、考試院）無法運作，即違反權力分立之功能性要求。",
      optionAnalysis: {
        A: "錯誤。提名行為本身不必然違憲，問題在於立法院的不作為。",
        B: "正確。若立法院遲不行使同意權，造成憲政機關功能停擺，即屬違憲之作為（釋字 632 號重點）。",
        C: "錯誤。雖然涉及議事，但若造成憲政功能毀滅，即受憲法司法審查。",
        D: "錯誤。這不只是爭議，而是涉及憲法義務之違反。"
      },
      keyTakeaway: "「機關不能空轉」，行使同意權是義務，不是選擇權。",
      relatedArticles: "釋字第 632 號解釋"
    }
  },
  {
    id: "113-2301-constitutional-20",
    tag: "地方自治-自治條例",
    explanation: {
      coreConcept: "地方自治權限與法律保留",
      analogy: "甲縣政府可以在自己的公園規定「不准餵鴿子」（自治事項），但不能規定「在甲縣簽的結婚契約通通無效」（民事法律），因為結婚的規矩全國要統一，不能一縣一制。",
      coreExplanation: "地方自治團體於其權限範圍內，得制定自治條例。自治事項包含管理地方事務、辦理上級委辦事項。但關於人民權利義務之「民事」、「刑事」或「全國性制度」，屬於中央立法權，地方不得逾越。",
      optionAnalysis: {
        A: "錯誤。契約生效要件屬於「民法」，應由中央立法，以維持私法秩序之統一。",
        B: "正確。公園管理屬於典型的「地方自治事項」。",
        C: "錯誤。度量衡衡制屬於全國一致之制度，由中央立法。",
        D: "錯誤。雖然地方得辦理教育，但「教育制度」之核心框架（如學制）應由中央統一規定。"
      },
      keyTakeaway: "「地方管家，不管國法」，自治條例不能踩到中央法律的底線。",
      relatedArticles: "地方制度法第 18-20 條、憲法第 108 條"
    }
  }
];

async function updateExplanations() {
  for (const item of explanations) {
    const docRef = db.collection('questions').doc(item.id);
    await docRef.set({
      tag: item.tag,
      explanation: item.explanation
    }, { merge: true });
    console.log(`✅ Updated: ${item.id}`);
  }
}

updateExplanations().then(() => {
  console.log('🎉 Batch 3 update finished.');
  process.exit();
});
