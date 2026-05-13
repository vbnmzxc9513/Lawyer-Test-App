require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// 1. 初始化 Firebase Admin
let db;
try {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // 若設定了模擬器，即使沒有金鑰也能初始化
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
    db = getFirestore();
    console.log(`✅ Firebase Admin 初始化成功 (連線至本地模擬器: ${process.env.FIRESTORE_EMULATOR_HOST})`);
  } else {
    // 檢查是否提供了 serviceAccountKey.json
    const serviceAccountPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS || '../config/serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
      });
      db = getFirestore();
      console.log("✅ Firebase Admin 初始化成功 (連線至正式雲端)");
    } else {
      console.warn("⚠️ 找不到 serviceAccountKey.json 且未設定模擬器，寫入資料庫功能將被跳過。");
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin 初始化失敗:", error.message);
}

// 2. 初始化 Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 模擬從網路爬取題目的函數
 * 實務上這裡會使用 axios + cheerio 或 puppeteer 從目標網站抓取
 */
async function scrapeQuestions() {
  console.log("🕵️ 模擬爬取題目中...");
  // 假設這是爬蟲抓下來的原始資料（包含題目與詳解）
  return [
    {
      id: "113-1-constitutional-01",
      year: 113,
      paper: 1,
      subject: "constitutional",
      questionNumber: 1,
      questionText: "依司法院大法官解釋，關於言論自由之敘述，下列何者正確？",
      options: {
        A: "言論自由保障範圍僅限於政治性言論",
        B: "商業言論不受憲法言論自由之保障",
        C: "國家對言論之事前審查，原則上為違憲",
        D: "誹謗性言論不論真假皆不受保障"
      },
      answer: "C",
      explanation: "依據釋字第744號等解釋，國家對於言論之事前審查，尤其是化妝品廣告之事前審查，原則上違反憲法第11條保障言論自由之意旨。"
    },
    {
      id: "113-1-constitutional-02",
      year: 113,
      paper: 1,
      subject: "constitutional",
      questionNumber: 2,
      questionText: "關於總統之解散立法院權，下列敘述何者正確？",
      options: {
        A: "總統得隨時解散立法院",
        B: "立法院通過對行政院院長之不信任案後，總統得經諮詢立法院院長後，宣告解散立法院",
        C: "解散立法院須經司法院大法官會議同意",
        D: "解散立法院後，應於三個月內重新選舉"
      },
      answer: "B",
      explanation: "依憲法增修條文第2條第5項規定，總統於立法院通過對行政院院長之不信任案後十日內，經諮詢立法院院長後，得宣告解散立法院。"
    }
  ];
}

/**
 * 使用 Gemini AI 分析題目並產生觀念標籤
 */
async function generateTags(questionData) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ 缺少 GEMINI_API_KEY，略過 AI 標記");
    return ["未分類"];
  }

  const prompt = `
你是一位精通台灣法律的法學專家。請閱讀以下的司律一試測驗題與詳解，並歸納出 1 到 3 個精確的「法學觀念標籤」。
標籤應該要是具體的法理、法條章節或重要概念（例如：「言論自由」、「違憲審查」、「權力分立」、「解散立法院」等）。
請僅回傳 JSON 陣列格式，不要包含任何其他文字解釋。

題目內容：
科目: ${questionData.subject}
題目: ${questionData.questionText}
解答: ${questionData.answer}
詳解: ${questionData.explanation}

請回傳 JSON 陣列，例如：["言論自由", "事前審查"]
`;

  try {
    console.log(`🤖 正在為題目 ${questionData.id} 產生標籤...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text();
    const tags = JSON.parse(responseText);
    console.log(`✨ 產生標籤成功: ${tags.join(', ')}`);
    return tags;
  } catch (error) {
    console.error(`❌ 產生標籤失敗:`, error.message);
    return ["AI標籤失敗"];
  }
}

/**
 * 將處理好的題目上傳到 Firestore
 */
async function uploadToFirestore(question) {
  if (!db) return;
  
  try {
    const docRef = db.collection('questions').doc(question.id);
    await docRef.set(question);
    console.log(`☁️ 成功上傳題目 ${question.id} 到 Firestore`);
  } catch (error) {
    console.error(`❌ 上傳題目失敗:`, error.message);
  }
}

/**
 * 主流程
 */
async function runScraper() {
  console.log("=== 開始執行爬蟲與 AI 標註任務 ===");
  
  // 1. 抓取題目
  const rawQuestions = await scrapeQuestions();
  console.log(`共抓取到 ${rawQuestions.length} 題`);

  // 2. 處理每一題：AI 標註 -> 上傳 Firebase
  for (const q of rawQuestions) {
    // 取得 AI 標籤
    const tags = await generateTags(q);
    q.tags = tags;
    
    // 儲存到本地供確認 (選用)
    fs.writeFileSync(path.join(__dirname, `${q.id}.json`), JSON.stringify(q, null, 2));

    // 上傳到雲端
    await uploadToFirestore(q);
    
    // 稍作延遲以避免觸發 API 頻率限制
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log("=== 任務完成 ===");
}

runScraper();
