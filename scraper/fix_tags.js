/**
 * fix_tags.js
 * 補齊缺失的 Tag，並標準化現有 Tag 格式
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const SUBJECT_MAP = {
  'constitutional': '憲法',
  'administrative': '行政法',
  'international_public': '國際公法',
  'international_private': '國際私法',
  'criminal': '刑法',
  'criminal_procedure': '刑事訴訟法',
  'legal_ethics': '法律倫理',
  'civil': '民法',
  'civil_procedure': '民事訴訟法',
  'company': '公司法',
  'insurance': '保險法',
  'negotiable_instruments': '票據法',
  'securities': '證券交易法',
  'enforcement': '強制執行法',
  'legal_english': '法學英文'
};

async function run() {
  const snapshot = await db.collection('questions').get();
  console.log(`開始處理 ${snapshot.size} 題標籤...`);
  
  let fixedCount = 0;
  let batch = db.batch();
  let countInBatch = 0;

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const id = doc.id;
    const parts = id.split('-');
    const rawSubj = parts[parts.length - 2]; // e.g., 'civil'
    const subjectName = SUBJECT_MAP[rawSubj] || rawSubj;
    
    let newTag = d.tag || '';
    const exp = d.explanation || {};
    const coreConcept = exp.coreConcept || '';

    // 邏輯 1: 如果完全沒 Tag，嘗試從 coreConcept 提取或直接用科目名稱
    if (!newTag || newTag.trim() === '') {
      if (coreConcept && coreConcept.length < 20) {
        newTag = coreConcept;
      } else {
        newTag = subjectName;
      }
    }

    // 邏輯 2: 標準化格式 - 確保 Tag 包含科目名稱前綴 (如果還沒有的話)
    if (newTag && !newTag.includes(subjectName)) {
      newTag = `${subjectName}-${newTag}`;
    }
    
    // 邏輯 3: 清理冗餘字眼 (如「本題考點涉及」)
    newTag = newTag.replace('本題考點涉及', '').replace('之核心規定', '').replace('之相關規定', '').trim();
    if (newTag.startsWith('-')) newTag = newTag.substring(1);

    // 只有在變動時才更新
    if (newTag !== d.tag) {
      batch.set(doc.ref, { tag: newTag }, { merge: true });
      fixedCount++;
      countInBatch++;
    }

    if (countInBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      countInBatch = 0;
      process.stdout.write('.');
    }
  }

  if (countInBatch > 0) await batch.commit();
  console.log(`\n✅ 完成！總共優化/修補了 ${fixedCount} 題標籤。`);
  process.exit();
}
run();
