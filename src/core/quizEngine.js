/**
 * QuizEngine - 負責管理答題過程的狀態與邏輯
 */
export class QuizEngine {
  constructor(questions, config = {}) {
    this.questions = this.shuffleQuestions(questions); // 題目列表
    this.currentIndex = 0; // 目前題號索引
    this.score = 0; // 目前分數
    this.history = []; // 答題歷史紀錄
    
    // 設定
    this.config = {
      isSimulation: config.isSimulation || false, // 是否為模擬考模式 (不能看解答)
      isMistakeRetry: config.isMistakeRetry || false, // 是否為錯題重考模式
      ...config
    };
  }

  // 洗牌演算法 (Fisher-Yates)
  shuffleQuestions(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 取得目前題目
  getCurrentQuestion() {
    if (this.isFinished()) return null;
    return this.questions[this.currentIndex];
  }

  // 取得總題數
  getTotalQuestions() {
    return this.questions.length;
  }

  // 檢查是否已完成所有題目
  isFinished() {
    return this.currentIndex >= this.questions.length;
  }

  // 提交答案
  submitAnswer(selectedOption) {
    const question = this.getCurrentQuestion();
    const isCorrect = selectedOption === question.answer;
    
    // 記錄答題歷史 (包含觀念標籤，供後續弱點分析使用)
    const record = {
      questionId: question.id,
      subject: question.subject,
      userAnswer: selectedOption,
      correctAnswer: question.answer,
      isCorrect: isCorrect,
      tags: question.tags || [],
      timestamp: Date.now()
    };
    
    this.history.push(record);
    
    if (isCorrect) {
      // 假設每題分數從 question.points 取得，預設為 2 分
      this.score += question.points || 2;
    }

    return {
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
      isMistakeRetry: this.config.isMistakeRetry,
      questionId: question.id
    };
  }

  // 前往下一題
  nextQuestion() {
    if (!this.isFinished()) {
      this.currentIndex++;
    }
    return this.getCurrentQuestion();
  }

  // 取得測驗結果統計
  getResultSummary() {
    const correctCount = this.history.filter(h => h.isCorrect).length;
    const totalCount = this.history.length;
    
    return {
      score: this.score,
      totalQuestions: totalCount,
      correctCount: correctCount,
      accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
      history: this.history
    };
  }
}
