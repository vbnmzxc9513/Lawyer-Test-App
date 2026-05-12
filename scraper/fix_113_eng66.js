const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const explanations = [
  {
    id: "113-4301-legal_english-66", tag: "法學英文-Property Offenses (財產犯罪)",
    explanation: {
      coreConcept: "Property offenses encompass crimes against property such as theft (larceny), robbery, burglary, arson, and embezzlement. Each has distinct legal elements.",
      analogy: "財產犯罪就像一個「偷搶騙」家族——偷 (theft/larceny) 是趁你不注意拿走；搶 (robbery) 是當面用暴力奪取；闖空門 (burglary) 是進入建築物準備幹壞事；縱火 (arson) 是放火燒房子；侵占 (embezzlement) 是你信任我讓我管你的錢，我卻把它塞進自己口袋。每種都有不同的犯罪構成要件。",
      coreExplanation: "Key property offenses: (1) Larceny: unlawful taking + carrying away + personal property of another + intent to permanently deprive; (2) Robbery: larceny + force/threat; (3) Burglary: entry of structure + intent to commit felony; (4) Embezzlement: fraudulent conversion by person in lawful possession; (5) Arson: malicious burning of structure. 正確答案(B)。",
      optionAnalysis: { A: "依題意分析", B: "【正確答案】此選項對財產犯罪的描述有誤", C: "依題意分析", D: "依題意分析" },
      keyTakeaway: "Property offenses 家族：Theft(偷)→Robbery(搶)→Burglary(入侵)→Arson(縱火)→Embezzlement(侵占)。每種構成要件不同！"
    }
  },
  {
    id: "113-4301-legal_english-67", tag: "法學英文-First Amendment (言論自由)",
    explanation: {
      coreConcept: "The First Amendment protects freedom of speech, press, religion, assembly, and petition. Without it, Congress and states could criminalize speech and expression.",
      analogy: "第一修正案是美國言論自由的「金鐘罩」。沒有它，政府可以隨便把人講的話定成犯罪。想像一個沒有金鐘罩的世界——批評政府？犯罪！在網上發表意見？犯罪！第一修正案的存在就是為了防止這種恐怖的情況發生。",
      coreExplanation: "The First Amendment (1791) states: 'Congress shall make no law... abridging the freedom of speech, or of the press...' Without this protection, legislatures could criminalize political speech, protest, and dissent. The question tests understanding that the First Amendment is a structural constraint on government power. 正確答案(C)。",
      optionAnalysis: { A: "依題意分析", B: "依題意分析", C: "【正確答案】", D: "依題意分析" },
      keyTakeaway: "First Amendment = 言論自由的護盾。沒有它→政府可以把任何「言論」定為犯罪。它限制的是政府權力！"
    }
  },
  {
    id: "113-4301-legal_english-68", tag: "法學英文-Constitutional Court Procedure (憲法訴訟程序)",
    explanation: {
      coreConcept: "After exhausting all ordinary judicial remedies, parties may file constitutional complaints to challenge the constitutionality of laws or government actions.",
      analogy: "憲法訴訟是司法救濟的「最終大Boss關」。你必須先打完所有「小關」（普通法院→高等法院→最高法院），全部敗訴後，才能挑戰最終Boss——憲法法庭。在那裡你可以主張「法律本身就違憲」或「政府行為侵害我的基本權利」。",
      coreExplanation: "Under the Constitutional Court Procedure Act (憲法訴訟法), after exhaustion of all ordinary remedies, a party may file a constitutional complaint (裁判憲法審查). The court reviews whether the applied law violates the Constitution or whether the judicial decision itself infringes constitutional rights. 正確答案(C)。",
      optionAnalysis: { A: "依題意分析", B: "依題意分析", C: "【正確答案】", D: "依題意分析" },
      keyTakeaway: "Constitutional complaint = 窮盡救濟後的最終手段。憲法訴訟法→可對「裁判」和「法律」聲請違憲審查。"
    }
  },
  {
    id: "113-4301-legal_english-69", tag: "法學英文-Product Liability (產品責任)",
    explanation: {
      coreConcept: "Product liability holds manufacturers, distributors, and sellers liable for defective products that cause injury, regardless of fault (strict liability).",
      analogy: "一家藥廠生產的藥被廣泛使用，結果發現副作用嚴重。在產品責任法下，藥廠不能說「我不知道會有副作用」來脫責——只要產品有缺陷且造成傷害，藥廠就要負責（嚴格責任）。這就像餐廳賣的食物讓人食物中毒，不管廚師是不是故意的，餐廳都要負責。",
      coreExplanation: "Product liability theories: (1) Strict liability — manufacturer liable regardless of fault if product is defective; (2) Negligence — failure to exercise reasonable care; (3) Breach of warranty — failure to meet express or implied guarantees. Types of defects: manufacturing, design, warning/marketing defects. Taiwan equivalent: Consumer Protection Act §7-8 (企業經營者之無過失責任). 正確答案(B)。",
      optionAnalysis: { A: "依題意分析", B: "【正確答案】", C: "依題意分析", D: "依題意分析" },
      keyTakeaway: "Product liability = 產品有缺陷→製造商負責(strict liability)。不管有沒有過失！Taiwan: 消保法§7。"
    }
  },
  {
    id: "113-4301-legal_english-70", tag: "法學英文-Burden of Proof (舉證責任)",
    explanation: {
      coreConcept: "In a breach of contract case, the plaintiff bears the burden of proving the existence of a contract, breach, and resulting damages.",
      analogy: "打官司就像辯論比賽——誰主張誰舉證。你說對方違約？你得證明三件事：①合約存在（拿出合約來看）→②對方違反了合約（哪裡做得不對）→③你因此受到損害（虧了多少錢）。這三個環節缺一不可，少了一個法官就不買單。",
      coreExplanation: "Burden of proof in contract cases: Plaintiff must prove: (1) existence of a valid contract; (2) defendant's breach; (3) causation; (4) damages. The standard is 'preponderance of the evidence' (more likely than not, >50%). Taiwan CPC §277: 當事人主張有利於己之事實者，就其事實有舉證之責任. 正確答案(C)。",
      optionAnalysis: { A: "依題意分析", B: "依題意分析", C: "【正確答案】此選項對舉證責任的描述有誤", D: "依題意分析" },
      keyTakeaway: "Burden of proof = 誰主張誰舉證。契約訴訟：原告證明合約+違約+損害。標準：優勢證據(>50%)。"
    }
  }
];

async function run() {
  for (const item of explanations) {
    await db.collection('questions').doc(item.id).set({ tag: item.tag, explanation: item.explanation }, { merge: true });
    console.log('OK ' + item.id);
    await new Promise(r => setTimeout(r, 60));
  }
  console.log(`Done: ${explanations.length}`);
  process.exit();
}
run();
