/**
 * deep_audit.js - 深度診斷：找出所有「詳解與題目不對應」的問題
 * 
 * 檢查項目：
 * 1. 詳解 optionAnalysis 中標記為「正確」的選項 vs DB answer
 * 2. 詳解 coreConcept 是否存在且有意義
 * 3. ID 格式 vs data 欄位一致性
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('../config/serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

// Official answers (copied from health_check_firestore.js)
const official = {
  111: {
    '2301': {1:'B',2:'C',3:'C',4:'A',5:'D',6:'C',7:'D',8:'D',9:'C',10:'B',11:'B',12:'B',13:'D',14:'A',15:'B',16:'D',17:'D',18:'C',19:'C',20:'C',21:'A',22:'D',23:'D',24:'B',25:'C',26:'D',27:'C',28:'D',29:'C',30:'B',31:'C',32:'A',33:'D',34:'B',35:'D',36:'C',37:'C',38:'C',39:'D',40:'B',41:'D',42:'D',43:'B',44:'A',45:'C',46:'D',47:'C',48:'A',49:'B',50:'A',51:'B',52:'D',53:'B',54:'C',55:'A',56:'C',57:'B',58:'C',59:'B',60:'C',61:'C',62:'B',63:'C',64:'B',65:'B',66:'A',67:'B',68:'C',69:'A',70:'D',71:'B',72:'A',73:'B',74:'B',75:'C'},
    '1301': {1:'D',2:'D',3:'B',4:'A',5:'A',6:'B',7:'A',8:'C',9:'A',10:'A',11:'A',12:'D',13:'B',14:'B',15:'D',16:'B',17:'C',18:'D',19:'A',20:'A',21:'D',22:'C',23:'B',24:'A',25:'C',26:'A',27:'B',28:'A',29:'B',30:'D',31:'C',32:'B',33:'C',34:'A',35:'A',36:'C',37:'B',38:'D',39:'D',40:'C',41:'D',42:'B',43:'D',44:'C',45:'C',46:'D',47:'A',48:'D',49:'D',50:'A',51:'D',52:'C',53:'D',54:'A',55:'B',56:'D',57:'A',58:'D',59:'A',60:'D',61:'C',62:'B',63:'C',64:'D',65:'B',66:'D',67:'C',68:'A',69:'B',70:'D',71:'D',72:'D',73:'A',74:'D',75:'C'},
    '3301': {1:'A',2:'D',3:'C',4:'A',5:'C',6:'D',7:'B',8:'B',9:'C',10:'B',11:'D',12:'D',13:'B',14:'D',15:'A',16:'D',17:'D',18:'D',19:'D',20:'B',21:'A',22:'A',23:'C',24:'B',25:'C',26:'D',27:'A',28:'D',29:'B',30:'C',31:'B',32:'D',33:'D',34:'D',35:'A',36:'D',37:'C',38:'B',39:'A',40:'D',41:'B',42:'A',43:'B',44:'B',45:'B',46:'B',47:'A',48:'B',49:'A',50:'B',51:'C',52:'D',53:'C',54:'B',55:'A',56:'B',57:'D',58:'D',59:'C',60:'C',61:'D',62:'C',63:'B',64:'D',65:'C',66:'A',67:'D',68:'D',69:'B',70:'D',71:'D',72:'C',73:'C',74:'D',75:'B',76:'B',77:'D',78:'D',79:'A',80:'D'},
    '4301': {1:'C',2:'A',3:'C',4:'D',5:'C',6:'B',7:'A',8:'A',9:'C',10:'A',11:'B',12:'D',13:'D',14:'C',15:'C',16:'C',17:'B',18:'D',19:'C',20:'D',21:'A',22:'A',23:'C',24:'B',25:'A',26:'B',27:'B',28:'B',29:'D',30:'C',31:'D',32:'A',33:'D',34:'C',35:'B',36:'D',37:'A',38:'A',39:'C',40:'A',41:'B',42:'A',43:'B',44:'D',45:'C',46:'D',47:'C',48:'B',49:'C',50:'B',51:'C',52:'B',53:'A',54:'D',55:'D',56:'A',57:'D',58:'B',59:'D',60:'B',61:'A',62:'D',63:'C',64:'B',65:'C',66:'B',67:'D',68:'D',69:'A',70:'B'}
  },
  112: {
    '2301': {1:'A',2:'A',3:'D',4:'A',5:'D',6:'B',7:'C',8:'D',9:'C',10:'B',11:'B',12:'C',13:'D',14:'D',15:'D',16:'B',17:'D',18:'C',19:'B',20:'B',21:'D',22:'D',23:'A',24:'A',25:'C',26:'D',27:'D',28:'B',29:'C',30:'A',31:'D',32:'C',33:'D',34:'C',35:'B',36:'D',37:'D',38:'C',39:'D',40:'C',41:'D',42:'D',43:'C',44:'B',45:'A',46:'C',47:'B',48:'C',49:'A',50:'B',51:'D',52:'D',53:'D',54:'C',55:'B',56:'B',57:'A',58:'B',59:'C',60:'C',61:'A',62:'C',63:'C',64:'D',65:'C',66:'A',67:'A',68:'D',69:'C',70:'B',71:'B',72:'C',73:'C',74:'B',75:'B'},
    '1301': {1:'D',2:'B',3:'C',4:'B',5:'D',6:'A',7:'D',8:'D',9:'B',10:'A',11:'D',12:'C',13:'B',14:'C',15:'A',16:'A',17:'D',18:'C',19:'C',20:'D',21:'B',22:'D',23:'A',24:'D',25:'B',26:'A',27:'A',28:'A',29:'C',30:'A',31:'C',32:'B',33:'B',34:'B',35:'B',36:'C',37:'C',38:'D',39:'D',40:'C',41:'C',42:'B',43:'D',44:'C',45:'B',46:'C',47:'B',48:'D',49:'B',50:'B',51:'B',52:'B',53:'B',54:'C',55:'B',56:'B',57:'A',58:'C',59:'C',60:'A',61:'C',62:'C',63:'D',64:'A',65:'D',66:'C',67:'A',68:'B',69:'C',70:'C',71:'B',72:'B',73:'B',74:'C',75:'B'},
    '3301': {1:'A',2:'B',3:'D',4:'C',5:'C',6:'B',7:'A',8:'C',9:'B',10:'C',11:'B',12:'C',13:'C',14:'A',15:'C',16:'A',17:'A',18:'C',19:'B',20:'C',21:'C',22:'B',23:'D',24:'C',25:'C',26:'D',27:'C',28:'B',29:'A',30:'B',31:'C',32:'D',33:'A',34:'B',35:'C',36:'A',37:'C',38:'A',39:'B',40:'C',41:'D',42:'B',43:'C',44:'A',45:'D',46:'B',47:'B',48:'A',49:'D',50:'C',51:'D',52:'D',53:'A',54:'D',55:'B',56:'D',57:'C',58:'A',59:'C',60:'D',61:'C',62:'D',63:'B',64:'C',65:'C',66:'B',67:'D',68:'B',69:'D',70:'C',71:'B',72:'C',73:'A',74:'B',75:'A',76:'A',77:'D',78:'C',79:'B',80:'C'},
    '4301': {1:'C',2:'D',3:'C',4:'A',5:'D',6:'D',7:'A',8:'C',9:'D',10:'B',11:'D',12:'B',13:'B',14:'D',15:'A',16:'D',17:'B',18:'A',19:'C',20:'B',21:'D',22:'D',23:'D',24:'A',25:'D',26:'A',27:'D',28:'D',29:'C',30:'C',31:'D',32:'D',33:'A',34:'D',35:'B',36:'C',37:'D',38:'A',39:'A',40:'B',41:'B',42:'A',43:'B',44:'C',45:'B',46:'D',47:'D',48:'C',49:'C',50:'D',51:'C',52:'B',53:'B',54:'B',55:'A',56:'B',57:'D',58:'B',59:'D',60:'C',61:'B',62:'B',63:'A',64:'B',65:'B',66:'D',67:'D',68:'B',69:'C',70:'C'}
  },
  113: {
    '2301': {1:'D',2:'A',3:'D',4:'D',5:'D',6:'A',7:'D',8:'D',9:'D',10:'A',11:'D',12:'B',13:'C',14:'A',15:'D',16:'A',17:'A',18:'A',19:'C',20:'B',21:'A',22:'D',23:'C',24:'C',25:'C',26:'A',27:'B',28:'D',29:'D',30:'D',31:'A',32:'C',33:'A',34:'D',35:'C',36:'D',37:'D',38:'B',39:'D',40:'B',41:'A',42:'C',43:'C',44:'B',45:'C',46:'A',47:'A',48:'D',49:'D',50:'B',51:'D',52:'D',53:'D',54:'B',55:'B',56:'A',57:'B',58:'D',59:'C',60:'C',61:'C',62:'B',63:'B',64:'A',65:'A',66:'B',67:'C',68:'D',69:'D',70:'C',71:'A',72:'B',73:'C',74:'C',75:'A'},
    '1301': {1:'A',2:'A',3:'D',4:'B',5:'C',6:'C',7:'A',8:'D',9:'B',10:'A',11:'A',12:'C',13:'B',14:'C',15:'C',16:'C',17:'D',18:'C',19:'A',20:'B',21:'D',22:'D',23:'B',24:'D',25:'A',26:'C',27:'C',28:'B',29:'C',30:'C',31:'A',32:'B',33:'D',34:'C',35:'B',36:'D',37:'A',38:'A',39:'C',40:'D',41:'B',42:'C',43:'A',44:'C',45:'D',46:'B',47:'C',48:'B',49:'B',50:'C',51:'B',52:'A',53:'A',54:'B',55:'C',56:'C',57:'D',58:'B',59:'D',60:'B',61:'C',62:'B',63:'C',64:'C',65:'D',66:'D',67:'B',68:'A',69:'B',70:'C',71:'A',72:'A',73:'B',74:'C',75:'A'},
    '3301': {1:'D',2:'C',3:'C',4:'B',5:'B',6:'A',7:'C',8:'B',9:'C',10:'B',11:'B',12:'B',13:'C',14:'A',15:'C',16:'A',17:'D',18:'B',19:'C',20:'C',21:'B',22:'B',23:'C',24:'D',25:'D',26:'A',27:'A',28:'B',29:'B',30:'C',31:'A',32:'C',33:'A',34:'C',35:'C',36:'D',37:'A',38:'C',39:'C',40:'B',41:'D',42:'B',43:'C',44:'A',45:'A',46:'B',47:'B',48:'B',49:'D',50:'A',51:'C',52:'B',53:'A',54:'D',55:'C',56:'C',57:'D',58:'C',59:'B',60:'D',61:'A',62:'C',63:'A',64:'D',65:'A',66:'D',67:'D',68:'C',69:'B',70:'B',71:'A',72:'A',73:'B',74:'C',75:'C',76:'A',77:'D',78:'C',79:'B',80:'B'},
    '4301': {1:'B',2:'C',3:'D',4:'A',5:'D',6:'C',7:'B',8:'C',9:'D',10:'B',11:'B',12:'C',13:'D',14:'D',15:'A',16:'D',17:'B',18:'D',19:'C',20:'D',21:'B',22:'A',23:'A',24:'C',25:'B',26:'A',27:'D',28:'D',29:'B',30:'D',31:'A',32:'C',33:'D',34:'D',35:'C',36:'C',37:'D',38:'C',39:'A',40:'C',41:'B',42:'C',43:'C',44:'B',45:'A',46:'C',47:'C',48:'A',49:'B',50:'A',51:'D',52:'C',53:'B',54:'D',55:'D',56:'C',57:'C',58:'D',59:'B',60:'B',61:'A',62:'D',63:'D',64:'C',65:'D',66:'B',67:'C',68:'C',69:'B',70:'C'}
  },
  114: {
    '301': {1:'A',2:'D',3:'B',4:'D',5:'A',6:'D',7:'A',8:'D',9:'A',10:'B',11:'A',12:'D',13:'B',14:'D',15:'A',16:'D',17:'B',18:'D',19:'D',20:'C',21:'A',22:'D',23:'B',24:'D',25:'C',26:'C',27:'D',28:'B',29:'D',30:'B',31:'C',32:'D',33:'C',34:'D',35:'A',36:'B',37:'D',38:'A',39:'B',40:'C',41:'B',42:'C',43:'D',44:'A',45:'C',46:'D',47:'A',48:'D',49:'C',50:'C',51:'D',52:'A',53:'D',54:'C',55:'D',56:'A',57:'D',58:'D',59:'D',60:'D',61:'C',62:'A',63:'C',64:'D',65:'C',66:'A',67:'C',68:'A',69:'C',70:'C',71:'B',72:'C',73:'D',74:'C',75:'C'},
    '302': {1:'B',2:'C',3:'A',4:'C',5:'D',6:'D',7:'A',8:'D',9:'B',10:'C',11:'B',12:'A',13:'D',14:'B',15:'A',16:'B',17:'A',18:'B',19:'D',20:'C',21:'D',22:'B',23:'D',24:'A',25:'C',26:'D',27:'B',28:'A',29:'C',30:'B',31:'C',32:'B',33:'C',34:'A',35:'C',36:'C',37:'D',38:'A',39:'C',40:'D',41:'B',42:'A',43:'B',44:'D',45:'C',46:'B',47:'D',48:'B',49:'D',50:'A',51:'D',52:'B',53:'A',54:'B',55:'D',56:'B',57:'D',58:'B',59:'C',60:'B',61:'D',62:'B',63:'D',64:'B',65:'D',66:'A',67:'D',68:'C',69:'B',70:'A',71:'C',72:'D',73:'B',74:'A',75:'B'},
    '303': {1:'C',2:'D',3:'C',4:'D',5:'D',6:'B',7:'D',8:'B',9:'C',10:'B',11:'C',12:'B',13:'D',14:'D',15:'C',16:'B',17:'D',18:'A',19:'B',20:'D',21:'D',22:'A',23:'D',24:'B',25:'A',26:'C',27:'C',28:'A',29:'C',30:'B',31:'C',32:'A',33:'B',34:'A',35:'B',36:'A',37:'C',38:'A',39:'C',40:'A',41:'B',42:'C',43:'B',44:'C',45:'B',46:'D',47:'A',48:'B',49:'D',50:'A',51:'A',52:'C',53:'D',54:'B',55:'B',56:'D',57:'C',58:'B',59:'D',60:'B',61:'D',62:'C',63:'D',64:'B',65:'D',66:'B',67:'D',68:'B',69:'D',70:'A',71:'D',72:'A',73:'D',74:'C',75:'A',76:'C',77:'B',78:'C',79:'B',80:'A'},
    '304': {1:'C',2:'B',3:'A',4:'C',5:'A',6:'C',7:'A',8:'B',9:'B',10:'A',11:'C',12:'B',13:'D',14:'B',15:'D',16:'D',17:'D',18:'B',19:'C',20:'A',21:'D',22:'B',23:'D',24:'A',25:'D',26:'C',27:'D',28:'C',29:'A',30:'C',31:'B',32:'C',33:'D',34:'D',35:'A',36:'B',37:'A',38:'C',39:'A',40:'C',41:'B',42:'B',43:'C',44:'B',45:'D',46:'C',47:'B',48:'D',49:'A',50:'D',51:'B',52:'A',53:'C',54:'D',55:'C',56:'A',57:'B',58:'B',59:'C',60:'A',61:'B',62:'A',63:'A',64:'D',65:'B',66:'D',67:'C',68:'A',69:'A',70:'C'}
  }
};

/**
 * Detect which answer the explanation marks as correct
 */
function detectExplanationAnswer(exp, dbAnswer) {
  if (!exp || typeof exp !== 'object' || !exp.optionAnalysis) return null;
  
  const oa = exp.optionAnalysis;
  const results = {};
  
  for (const opt of ['A', 'B', 'C', 'D']) {
    const text = (oa[opt] || '').toLowerCase();
    const hasCorrectMarkers = 
      text.includes('正確') || text.includes('本題答案') || 
      text.includes('✅') || text.includes('答案') && text.includes('為') && text.includes(opt);
    const hasWrongMarkers = 
      text.includes('錯誤') || text.includes('不正確') || text.includes('❌') || text.includes('有誤');
    
    results[opt] = { correct: hasCorrectMarkers, wrong: hasWrongMarkers };
  }
  
  // Find which option is marked as THE correct one
  // Strategy: option marked correct but NOT wrong
  const correctOpts = Object.entries(results)
    .filter(([k, v]) => v.correct && !v.wrong)
    .map(([k]) => k);
  
  if (correctOpts.length === 1) return correctOpts[0];
  if (correctOpts.length > 1) return correctOpts.join('+'); // ambiguous
  return null; // can't determine
}

async function run() {
  console.log('🔍 Deep Audit: 開始全面診斷...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    byYear: {},
    mismatches: []
  };
  
  let totalChecked = 0, totalWithExp = 0, totalMismatch = 0;
  let totalAnswerWrong = 0, totalNoExp = 0;
  
  for (const year of [111, 112, 113, 114]) {
    const snap = await db.collection('questions').where('year', '==', year).get();
    const byPaper = {};
    
    snap.forEach(doc => {
      const data = doc.data();
      const parts = doc.id.split('-');
      const paper = parts[1];
      if (!byPaper[paper]) byPaper[paper] = [];
      byPaper[paper].push({ docId: doc.id, ...data });
    });
    
    const yearStats = { total: snap.size, withExp: 0, mismatch: 0, answerWrong: 0, noExp: 0, byType: {} };
    
    for (const [paper, questions] of Object.entries(byPaper)) {
      for (const q of questions) {
        totalChecked++;
        
        // Check 1: DB answer vs official
        const officialAns = official[year]?.[paper]?.[q.questionNumber];
        if (officialAns && q.answer !== officialAns) {
          totalAnswerWrong++;
          yearStats.answerWrong++;
        }
        
        // Check 2: Has explanation?
        const exp = q.explanation;
        if (!exp || typeof exp !== 'object' || !exp.coreConcept) {
          totalNoExp++;
          yearStats.noExp++;
          continue;
        }
        
        totalWithExp++;
        yearStats.withExp++;
        
        // Check 3: What does the explanation say is the correct answer?
        const expSaysCorrect = detectExplanationAnswer(exp, q.answer);
        
        if (expSaysCorrect && !expSaysCorrect.includes('+') && expSaysCorrect !== q.answer) {
          totalMismatch++;
          yearStats.mismatch++;
          
          const mType = (officialAns && q.answer !== officialAns) 
            ? 'DB_ANSWER_WRONG_AND_EXP_FOLLOWS' 
            : 'EXP_MARKS_WRONG_OPTION';
          
          yearStats.byType[mType] = (yearStats.byType[mType] || 0) + 1;
          
          report.mismatches.push({
            id: q.docId,
            year, paper,
            subject: q.subject,
            qnum: q.questionNumber,
            officialAnswer: officialAns || '?',
            dbAnswer: q.answer,
            expSaysCorrect,
            mismatchType: mType,
            coreConcept: (exp.coreConcept || '').substring(0, 80),
            questionPreview: (q.questionText || '').substring(0, 60)
          });
        } else if (!expSaysCorrect) {
          // Can't determine - might be ambiguous
          const mType = 'UNCLEAR_MARKING';
          yearStats.byType[mType] = (yearStats.byType[mType] || 0) + 1;
        }
      }
    }
    
    report.byYear[year] = yearStats;
    console.log(`${year}年: ${yearStats.total}題, 有詳解${yearStats.withExp}, 不一致${yearStats.mismatch}, 答案錯${yearStats.answerWrong}`);
  }
  
  report.summary = {
    totalChecked, totalWithExp, totalMismatch, totalAnswerWrong, totalNoExp,
    mismatchRate: totalWithExp > 0 ? (totalMismatch / totalWithExp * 100).toFixed(1) + '%' : 'N/A'
  };
  
  // Group mismatches by year+subject for easy reading
  console.log('\n=== 不一致詳細 (按年+科目) ===');
  const grouped = {};
  for (const m of report.mismatches) {
    const key = `${m.year}-${m.subject}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  for (const [key, items] of Object.entries(grouped).sort()) {
    console.log(`\n  ${key}: ${items.length} 題`);
    items.sort((a, b) => a.qnum - b.qnum);
    for (const m of items) {
      console.log(`    Q${m.qnum}: DB=${m.dbAnswer} Official=${m.officialAnswer} Exp→${m.expSaysCorrect} [${m.mismatchType}]`);
    }
  }
  
  // Save report
  fs.writeFileSync(require('path').join(__dirname, '../reports/deep_audit_report.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📊 報告已存入 ../reports/deep_audit_report.json`);
  console.log(`\n=== 總結 ===`);
  console.log(`  檢查題數: ${totalChecked}`);
  console.log(`  有詳解: ${totalWithExp}`);
  console.log(`  無詳解: ${totalNoExp}`);
  console.log(`  答案錯誤(vs官方): ${totalAnswerWrong}`);
  console.log(`  詳解標記不一致: ${totalMismatch} (${report.summary.mismatchRate})`);
  
  process.exit();
}

run();
