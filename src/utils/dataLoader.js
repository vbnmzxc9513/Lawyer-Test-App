import localQuestions from '../data/questions.json';

/**
 * 從本地 JSON 載入題目資料 (因為系統未安裝 Java 無法啟動 Firebase Emulator，改為本地靜態載入)
 */
export const dataLoader = {
  // 快取已下載的題目，減少重複讀取資料庫
  cache: new Map(),

  /**
   * 取得特定科目的題目
   */
  async getQuestionsBySubject(subjectId) {
    if (this.cache.has(`subject_${subjectId}`)) {
      return this.cache.get(`subject_${subjectId}`);
    }

    try {
      // 改為從本地 localQuestions 中過濾
      const questions = localQuestions.filter(q => q.subject === subjectId);
      
      // 如果本地找不到該科目的題目，才回傳假資料
      if (questions.length === 0) {
        return this._getMockQuestions(subjectId);
      }
      
      this.cache.set(`subject_${subjectId}`, questions);
      return questions;
    } catch (error) {
      console.error("載入題目失敗:", error);
      return this._getMockQuestions(subjectId);
    }
  },

  /**
   * 取得特定觀念 (Tag) 的題目
   */
  async getQuestionsByTag(tag) {
    try {
      return localQuestions.filter(q => q.tags && q.tags.includes(tag));
    } catch (error) {
      console.error("載入觀念題目失敗:", error);
      return [];
    }
  },

  /**
   * 取得所有獨特的觀念標籤 (供弱點分析與練習選單使用)
   */
  async getAllTags() {
    try {
      const allTags = new Set();
      localQuestions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(t => allTags.add(t));
        }
      });
      return Array.from(allTags);
    } catch (error) {
      return ["言論自由", "權力分立", "基本國策", "違憲審查", "平等權"];
    }
  },

  // 開發階段用的假資料
  _getMockQuestions(subjectId) {
    return [
      {
        id: "mock-1",
        subject: subjectId,
        questionNumber: 1,
        questionText: `這是關於 ${subjectId} 的測試題目一。以下選項何者正確？`,
        options: {
          A: "選項 A 是錯誤的",
          B: "選項 B 是正確的答案",
          C: "選項 C 也是錯誤的",
          D: "選項 D 完全無關"
        },
        answer: "B",
        explanation: `因為這是一個示範詳解。針對 ${subjectId}，B 選項最符合法理。`,
        tags: ["基本觀念", "測試標籤"]
      },
      {
        id: "mock-2",
        subject: subjectId,
        questionNumber: 2,
        questionText: `這是關於 ${subjectId} 的測試題目二。下列敘述何者錯誤？`,
        options: {
          A: "這句話是正確的描述",
          B: "這句話也是正確的",
          C: "這句話明顯有誤，是本題答案",
          D: "這句話符合實務見解"
        },
        answer: "C",
        explanation: "依據實務見解，C 的描述與現行法規不符，故為錯誤敘述。",
        tags: ["進階觀念"]
      }
    ];
  }
};
