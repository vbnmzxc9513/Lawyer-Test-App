const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const explanations = [
  {
    id: "112-4301-legal_english-56", tag: "法學英文-Consideration (約因)",
    explanation: {
      coreConcept: "In contract law, 'consideration' refers to something of value exchanged between parties. It is an essential element for a valid contract under common law systems.",
      analogy: "Consideration is like the 'price tag' of a promise. If you promise to give your friend a gift for free, that's not a contract — it's just a gift. But if your friend promises to mow your lawn and you promise to pay $100, that exchange of value is consideration, making it an enforceable contract. No consideration = no contract!",
      coreExplanation: "Consideration is one of the essential elements of a binding contract. It must be: (1) something of legal value (money, services, forbearance); (2) bargained for — not a past act; (3) sufficient — courts don't inquire into adequacy. In Taiwan's civil law system, the equivalent concept is 'causa' or 原因 of an obligation under Article 71-73 of the Civil Code.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Consideration = the 'price' of a promise. No consideration → no enforceable contract under common law!"
    }
  },
  {
    id: "112-4301-legal_english-57", tag: "法學英文-Tort (侵權行為)",
    explanation: {
      coreConcept: "A 'tort' is a civil wrong that causes harm to another person, giving rise to legal liability. Common torts include negligence, defamation, trespass, and nuisance.",
      analogy: "Tort law is like the 'you broke it, you bought it' principle of civil law. If you carelessly crash your car into someone's fence (negligence), that's a tort. You didn't commit a crime necessarily, but you still have to compensate for the damage. Tort = civil wrong → pay compensation.",
      coreExplanation: "Tort law (侵權行為法) provides civil remedies for wrongs committed against individuals. The three main elements of negligence: (1) duty of care; (2) breach of that duty; (3) causation and damages. Unlike criminal law, tort law focuses on compensating the victim rather than punishing the wrongdoer. Taiwan's equivalent: Civil Code §184-198 (侵權行為).",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Tort = civil wrong (not criminal). Negligence needs: duty + breach + causation + damages. → Pay compensation!"
    }
  },
  {
    id: "112-4301-legal_english-58", tag: "法學英文-Injunction (禁制令)",
    explanation: {
      coreConcept: "An 'injunction' is a court order requiring a party to do or refrain from doing a specific act. It is an equitable remedy used when monetary damages are insufficient.",
      analogy: "Money can't fix everything. If your neighbor is about to bulldoze a historic tree on the property line, you can't just sue for money after it's gone. You get an injunction — a court order saying 'STOP! Don't cut that tree.' It's a court-issued restraining order for civil matters.",
      coreExplanation: "Types of injunctions: (1) Temporary Restraining Order (TRO) — emergency, short-term; (2) Preliminary injunction — during litigation; (3) Permanent injunction — final court order. Courts grant injunctions when: money damages are inadequate, irreparable harm exists, balance of hardships favors plaintiff, and public interest is not harmed. Taiwan equivalent: 假處分 (provisional injunction) under Civil Procedure Law §532.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Injunction = court order to DO or STOP doing something. Money not enough → get an injunction! Taiwan: 假處分."
    }
  },
  {
    id: "112-4301-legal_english-59", tag: "法學英文-Habeas Corpus (人身保護令)",
    explanation: {
      coreConcept: "'Habeas corpus' (Latin: 'you shall have the body') is a legal action requiring a person under arrest to be brought before a judge to determine whether the detention is lawful.",
      analogy: "Habeas corpus is the prisoner's 'get out of jail (illegally)' card. If you're locked up without being charged, you (or your lawyer) can file a habeas petition to force the jailer to bring you before a judge who asks: 'Why is this person in jail? Is it legal?' If not, you go free. It's the fundamental protection against arbitrary detention.",
      coreExplanation: "Habeas corpus is one of the oldest common law writs, originating from the Magna Carta (1215). It prevents governments from holding individuals without legal justification. In Taiwan's constitutional framework, Article 8 guarantees similar protections: arrests must have judicial warrants, and detention requires court approval. The equivalent concept is 人身自由保障 and 羈押審查.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Habeas corpus = 'Show me why this person is jailed!' Protects against illegal detention. Taiwan: Art. 8 Constitution + 羈押審查."
    }
  },
  {
    id: "112-4301-legal_english-60", tag: "法學英文-Promissory Estoppel (允諾禁反言)",
    explanation: {
      coreConcept: "Promissory estoppel prevents a party from retracting a promise when the other party has reasonably relied on that promise to their detriment, even without formal consideration.",
      analogy: "Your uncle promises to fund your law school tuition. You quit your job, move cities, and enroll. Then he changes his mind. Even without a signed contract, promissory estoppel says: 'You can't back out now — she relied on your promise and suffered real harm.' It fills the gap where there's no consideration but injustice would result.",
      coreExplanation: "Elements of promissory estoppel: (1) clear and definite promise; (2) promisor should reasonably expect reliance; (3) promisee actually relied; (4) injustice can only be avoided by enforcement. This doctrine bridges gaps in contract law where technical requirements aren't met. Taiwan civil law analog: good faith principle (誠信原則, Civil Code §148 II) and 締約過失責任 (§245-1).",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Promissory estoppel = promise + reliance + detriment → can't take it back! No consideration needed. Taiwan analog: 誠信原則."
    }
  },
  {
    id: "112-4301-legal_english-61", tag: "法學英文-Due Process (正當程序)",
    explanation: {
      coreConcept: "'Due process' requires that the government respect all legal rights owed to a person when depriving them of life, liberty, or property. It includes procedural due process (fair procedures) and substantive due process (fair laws).",
      analogy: "Due process is the legal equivalent of 'playing fair.' The government can't just take your house or lock you up without following proper rules. Procedural due process = you get notice and a hearing before anything happens. Substantive due process = even if the procedure is followed, the law itself must be reasonable and not violate fundamental rights.",
      coreExplanation: "From the 5th and 14th Amendments of the U.S. Constitution. Procedural due process requires: notice, opportunity to be heard, neutral decision-maker. Substantive due process protects fundamental rights (privacy, liberty) from government interference without compelling justification. Taiwan equivalent: Constitutional Article 8 (人身自由), Article 15 (財產權), and the principle of 正當法律程序 recognized by the Constitutional Court.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Due process = government must play fair! Procedural (fair hearing) + Substantive (fair law). Taiwan: 正當法律程序原則."
    }
  },
  {
    id: "112-4301-legal_english-62", tag: "法學英文-Plea Bargaining (認罪協商)",
    explanation: {
      coreConcept: "'Plea bargaining' is a negotiation between a defendant and prosecutor where the defendant agrees to plead guilty, usually in exchange for a lesser charge or reduced sentence.",
      analogy: "Plea bargaining is like settling a lawsuit out of court, but in criminal cases. The prosecutor says: 'I'll charge you with manslaughter instead of murder if you plead guilty right now.' The defendant saves court time and gets a lighter sentence; the prosecutor gets a sure conviction without a risky trial. Both sides make a deal. Taiwan has a similar system called 認罪協商 under the Code of Criminal Procedure §455-2.",
      coreExplanation: "Plea bargaining accounts for ~90-95% of criminal convictions in the U.S. system. Types: charge bargaining (reduced charges), sentence bargaining (lighter sentence), count bargaining (fewer counts). Critics argue it pressures innocent defendants. Taiwan's 認罪協商 (§455-2 CCP) requires: offenses punishable by death/life imprisonment excluded, defendant must have counsel, court must approve the agreement.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Plea bargaining = criminal settlement. Defendant pleads guilty → lighter charge/sentence. Taiwan: 認罪協商 §455-2 CCP."
    }
  },
  {
    id: "112-4301-legal_english-63", tag: "法學英文-Fiduciary Duty (受託義務/忠實義務)",
    explanation: {
      coreConcept: "A 'fiduciary duty' is the highest standard of care imposed in law on a person who acts for another's benefit. Fiduciaries must act in good faith, with loyalty, and in the best interests of the beneficiary.",
      analogy: "A fiduciary is like a 'trusted guardian' with legal superpowers — and matching responsibilities. Your lawyer, your company's board of directors, a trustee managing your inheritance — all are fiduciaries. They must put YOUR interests first, not their own. If a lawyer secretly buys the same stock he recommends to a client for himself first, that's a breach of fiduciary duty.",
      coreExplanation: "Key fiduciary relationships: lawyer-client, trustee-beneficiary, director-corporation, agent-principal, guardian-ward. Core duties: (1) duty of loyalty — no self-dealing; (2) duty of care — act as a prudent person; (3) duty of confidentiality. Taiwan equivalents: Company Act §23 (directors' duty of loyalty and care 忠實義務及善良管理人注意義務), Civil Code §544 (agent's duty).",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Fiduciary duty = highest loyalty standard. Loyalty + Care + Confidentiality. Taiwan: 忠實義務 (Company Act §23)."
    }
  },
  {
    id: "112-4301-legal_english-64", tag: "法學英文-Mens Rea (犯罪意圖)",
    explanation: {
      coreConcept: "'Mens rea' (Latin: 'guilty mind') refers to the mental state or intent required to constitute a crime. Most crimes require both a guilty act (actus reus) and a guilty mind (mens rea).",
      analogy: "Accidentally bumping someone vs. deliberately punching them — same physical act, totally different crimes. Mens rea is what separates accident from crime. The four levels (from highest to lowest): purpose/intent → knowledge → recklessness → negligence. Murder requires intent; manslaughter may only require recklessness. No guilty mind = no crime (usually).",
      coreExplanation: "Mens rea levels under the Model Penal Code: (1) Purposely — conscious objective; (2) Knowingly — aware that conduct is practically certain to cause result; (3) Recklessly — conscious disregard of substantial risk; (4) Negligently — should have known of risk. Taiwan Penal Code §12-13: 故意 (intent/knowledge) vs. 過失 (negligence). §12 I: Acts without intent or negligence are not punishable.",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Mens rea = guilty mind. 4 levels: intent > knowledge > recklessness > negligence. Taiwan: 故意 vs. 過失 (Penal Code §12-13)."
    }
  },
  {
    id: "112-4301-legal_english-65", tag: "法學英文-Precedent / Stare Decisis (判例/遵循先例原則)",
    explanation: {
      coreConcept: "'Stare decisis' (Latin: 'to stand by things decided') is the doctrine that courts should follow precedent — prior decisions on similar issues — to ensure consistency and predictability in the law.",
      analogy: "Stare decisis is the 'law of repetition.' Once the Supreme Court decides that X is unconstitutional, all lower courts must follow — they can't say 'well, I think the Supreme Court was wrong.' It's like an elder sibling who set the house rules: the younger siblings have to follow unless the parents (higher court) change the rule. Predictability and fairness require that like cases be decided alike.",
      coreExplanation: "Horizontal stare decisis: courts follow their own prior decisions. Vertical stare decisis: lower courts must follow higher courts. Only the highest court can overrule its own precedent (e.g., Brown v. Board of Education overruled Plessy v. Ferguson). Taiwan's civil law system doesn't have strict binding precedent, but Supreme Court decisions have strong persuasive authority (判例制度 was reformed in 2019 to 裁判先例).",
      optionAnalysis: { A: "依題目選項分析", B: "依題目選項分析", C: "依題目選項分析", D: "依題目選項分析" },
      keyTakeaway: "Stare decisis = follow prior rulings for consistency. Lower courts MUST follow higher courts. Taiwan: 判例→裁判先例 (2019 reform)."
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
