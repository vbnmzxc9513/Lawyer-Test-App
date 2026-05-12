/**
 * 批次執行所有 exp_*.js 腳本並將詳解寫入正確的 Firestore 文件 ID
 * 
 * 問題：exp_*.js 用了錯誤的 ID 格式，例如：
 *   exp 腳本用：112-2301-civil-1
 *   前端實際用：112-3301-civil-01
 * 
 * 本腳本的策略：
 * 1. 從 exp_*.js 腳本提取詳解內容
 * 2. 將詳解寫入正確的 Firestore 文件 ID
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

// ID 映射規則（exp 腳本 ID → 正確 Firestore ID）
function correctId(expId) {
  // 已知格式：
  // 112-2301-civil-1 → 112-3301-civil-01
  // 112-2301-civil_procedure-36 → 112-3301-civil_procedure-36 (if exists)
  // 112-1301-legal_ethics-61 → keep as is (already correct, just needs to exist)
  
  const parts = expId.split('-');
  const year = parts[0];
  const code = parts[1];
  const subject = parts.slice(2, -1).join('-');
  const num = parts[parts.length - 1];
  
  // Civil paper subjects use 3301
  const civil3301 = ['civil', 'civil_procedure'];
  if (civil3301.includes(subject) && code !== '3301') {
    const paddedNum = num.padStart(2, '0');
    return `${year}-3301-${subject}-${paddedNum}`;
  }
  
  // Other subjects: just ensure number is padded
  const paddedNum = num.padStart(2, '0');
  return `${year}-${code}-${subject}-${paddedNum}`;
}

async function processScript(scriptFile) {
  const content = fs.readFileSync(scriptFile, 'utf8');
  
  // Extract the E/explanations array using eval in a controlled way
  // We'll eval the const declarations but intercept the firebase calls
  let explanations = [];
  const fakeAdmin = { apps: [{}], initializeApp: ()=>{}, firestore: ()=>({ collection: ()=>({ doc: ()=>({ set: ()=>Promise.resolve() }) }) }) };
  
  try {
    // Extract data by running the script's data extraction
    const match = content.match(/const\s+(?:E|explanations)\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      explanations = eval(match[1]);
    }
  } catch(e) {
    console.error(`Failed to parse ${scriptFile}:`, e.message.substring(0, 100));
    return 0;
  }
  
  let count = 0;
  for (const item of explanations) {
    if (!item.id || !item.explanation) continue;
    const correctDocId = correctId(item.id);
    
    // Check if destination doc exists
    const docRef = db.collection('questions').doc(correctDocId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Also try without padding
      const altId = item.id; // original
      const altDoc = await db.collection('questions').doc(altId).get();
      if (!altDoc.exists) {
        console.log(`  ⚠️  SKIP ${correctDocId} (不存在於Firestore)`);
        continue;
      }
    }
    
    await docRef.set({ 
      tag: item.tag || '',
      explanation: item.explanation 
    }, { merge: true });
    console.log(`  ✅ ${correctDocId}`);
    count++;
    await new Promise(r => setTimeout(r, 80));
  }
  return count;
}

async function run() {
  // Process civil scripts for 112 and 113
  const scripts = [
    'exp_112_civil_1.js', 'exp_112_civil_2.js', 'exp_112_civil_3.js', 'exp_112_civil_4.js',
    'exp_113_civil_1.js', 'exp_113_civil_2.js', 'exp_113_civil_3.js', 'exp_113_civil_4.js',
  ];
  
  let total = 0;
  for (const script of scripts) {
    if (!fs.existsSync(script)) { console.log(`SKIP (not found): ${script}`); continue; }
    console.log(`\n📄 Processing ${script}...`);
    const count = await processScript(script);
    total += count;
    console.log(`  → ${count} docs updated`);
  }
  
  console.log(`\n✅ Total: ${total} docs updated`);
  process.exit();
}
run();
