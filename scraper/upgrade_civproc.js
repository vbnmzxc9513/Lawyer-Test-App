/**
 * 為民訴低品質模板詳解升級：讀取 Firestore 題目資料，生成比模板更好的詳解
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// 民訴常見考點對應知識庫
const CIVPROC_TOPICS = {
  '管轄': { concept: '管轄權決定哪個法院有權審理案件', law: '民事訴訟法§1-31', analogy: '管轄就像劃分地盤——案子該歸哪個法院管，要看「人在哪」（被告住所地）、「事在哪」（不動產所在地）、「約在哪」（合意管轄）。搞錯法院就像寄信寄錯地址，法院會退回。' },
  '訴訟能力': { concept: '當事人有無進行訴訟之能力', law: '民事訴訟法§40-51', analogy: '訴訟能力就像「打官司的資格證」。未成年人不能自己開車上路，同樣也不能自己上法院打官司——要由法定代理人代為訴訟。' },
  '訴之變更追加': { concept: '原告在訴訟進行中變更或追加訴訟標的', law: '民事訴訟法§255-256', analogy: '訴之變更追加像是餐廳點菜後改菜單——原則上已經點了就不能改（保護被告），但如果對方同意、或是基於同一事實、或是不影響訴訟——法院會允許你改菜單。' },
  '當事人適格': { concept: '原告或被告是否為適格之當事人', law: '民事訴訟法§40', analogy: '當事人適格就像確認「對的人上了對的擂台」。你的房子被隔壁佔了，打官司要告的是佔你房子的人，不是路人甲。告錯人→法院判你敗訴（當事人不適格）。' },
  '既判力': { concept: '確定判決之效力範圍', law: '民事訴訟法§400-401', analogy: '既判力是法院的「最終裁決」——案子判了就不能再打。像考試改完卷分數確定了，不能一直要求重改。目的是維護法律安定性，避免無止境的訴訟。' },
  '假執行': { concept: '判決尚未確定即可先行執行', law: '民事訴訟法§389-395', analogy: '假執行就像「先預支薪水」——判決還沒確定（對方可能上訴），但法院允許你先拿到錢。風險是如果上訴後改判，你就要把錢吐回去。' },
  '上訴': { concept: '對第一審判決不服向上級法院聲明不服', law: '民事訴訟法§436-442、§466-476', analogy: '上訴是法律的「申訴管道」——一審判輸不服氣，可以請更高的法院重新看看。但有期限（收到判決20天內），超過就只能認命了。' },
  '證據': { concept: '舉證責任與證據調查', law: '民事訴訟法§277-380', analogy: '打官司就像辯論——光說嘴沒用，要拿出證據。「誰主張誰舉證」是基本規則：你說對方欠你錢，你就要拿出借條來證明。拿不出來？法院只好判你輸。' },
  '送達': { concept: '訴訟文書送達之方式與效力', law: '民事訴訟法§123-153', analogy: '送達就像法院寄掛號信——必須確保對方收到才算數。親手交給本人最好（直接送達），家人代收也行（補充送達），找不到人就貼在門口（寄存送達）。沒合法送達→程序無效。' },
  '訴訟標的': { concept: '原告請求法院裁判之對象', law: '民事訴訟法§244', analogy: '訴訟標的就像你去法院「點的菜」——你要法院判什麼？要對方還錢（給付之訴）、確認你有某個權利（確認之訴）、還是要改變某個法律關係（形成之訴）？' },
  '言詞辯論': { concept: '法院審理案件時雙方當面陳述', law: '民事訴訟法§195-221', analogy: '言詞辯論就像法庭版的「正式辯論會」——原告被告面對面，各自陳述理由、提出證據、互相質問。法官在旁邊聽完後做出判決。沒有言詞辯論就做出判決→程序違法。' },
  '調解': { concept: '訴訟外或訴訟中之和解調解程序', law: '民事訴訟法§403-426', analogy: '調解就像找一個公正的中間人來幫你們談判——不用上法庭對簿公堂，雙方各退一步。調解成立的效力等同法院判決，省時省力又省錢。' },
  '保全程序': { concept: '假扣押假處分等暫時性保護措施', law: '民事訴訟法§522-538', analogy: '保全程序就像先把嫌疑人的財產「凍結」起來——怕他在打官司期間把錢轉走或把東西藏起來。假扣押凍結金錢，假處分凍結其他權利。' },
};

function generateQualityExplanation(questionData) {
  const qText = questionData.questionText || '';
  const answer = questionData.answer || '?';
  const opts = questionData.options || {};

  // Find matching topic
  let bestTopic = null;
  let bestScore = 0;
  for (const [keyword, topic] of Object.entries(CIVPROC_TOPICS)) {
    const score = (qText.includes(keyword) ? 3 : 0) +
      Object.values(opts).filter(v => v && v.includes(keyword)).length;
    if (score > bestScore) { bestScore = score; bestTopic = { keyword, ...topic }; }
  }

  // Fallback generic but still better than template
  if (!bestTopic || bestScore === 0) {
    // Use keywords from question text
    const keywords = ['管轄','送達','上訴','調解','假扣押','假處分','證據','判決','既判力',
      '訴訟標的','當事人','言詞辯論','訴之變更','保全','強制執行','再審','抗告','第三人'];
    for (const kw of keywords) {
      if (qText.includes(kw)) {
        bestTopic = CIVPROC_TOPICS[kw] || { keyword: kw, concept: `民事訴訟法中「${kw}」相關規定`, law: '民事訴訟法', analogy: `「${kw}」是民事訴訟的核心程序之一，考生需熟悉其構成要件及法律效果。` };
        break;
      }
    }
  }

  if (!bestTopic) {
    bestTopic = { keyword: '民事訴訟程序', concept: '民事訴訟法之基本程序規定', law: '民事訴訟法', analogy: '民事訴訟是解決私人糾紛的正式管道。從起訴→送達→言詞辯論→舉證→判決→執行，每個環節都有嚴格的法律規定，確保雙方公平對待。' };
  }

  const optAnalysis = {};
  for (const [k, v] of Object.entries(opts)) {
    optAnalysis[k] = k === answer ? `【正確答案】${v}` : v;
  }

  return {
    coreConcept: bestTopic.concept,
    analogy: bestTopic.analogy,
    coreExplanation: `依據${bestTopic.law}相關規定，本題正確答案為(${answer})。\n\n${qText.substring(0, 200)}${qText.length > 200 ? '...' : ''}`,
    optionAnalysis: optAnalysis,
    keyTakeaway: `掌握「${bestTopic.keyword}」的法條依據（${bestTopic.law}）及實務見解是答題關鍵。正確答案(${answer})。`
  };
}

async function run() {
  const report = JSON.parse(require('fs').readFileSync('final_audit_report.json'));
  const lowIds = report.lowQualityIds;
  console.log(`升級 ${lowIds.length} 題低品質詳解...\n`);

  let count = 0;
  for (const id of lowIds) {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) { console.log(`SKIP ${id}`); continue; }
    const data = doc.data();
    const exp = generateQualityExplanation(data);
    await db.collection('questions').doc(id).set({ explanation: exp }, { merge: true });
    console.log(`✅ ${id}`);
    count++;
    await new Promise(r => setTimeout(r, 50));
  }
  console.log(`\n🏁 ${count} docs upgraded`);
  process.exit();
}
run();
