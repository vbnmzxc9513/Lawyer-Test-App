import { app, db } from './core/firebase.js';
import { dataLoader } from './utils/dataLoader.js';
import { QuizEngine } from './core/quizEngine.js';
import { storage } from './utils/storage.js';
import { achievementSystem, ACHIEVEMENTS } from './core/achievementSystem.js';

// 狀態管理
let currentQuizEngine = null;

// ---- SPA 簡易路由系統 ----
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('popstate', () => {
      this.loadRoute(window.location.pathname);
    });
  }

  addRoute(path, renderFunction) {
    this.routes[path] = renderFunction;
  }

  navigate(path, state = {}) {
    window.history.pushState(state, '', path);
    this.loadRoute(path, state);
  }

  loadRoute(path, state = {}) {
    const renderFunction = this.routes[path] || this.routes['/'];
    if (renderFunction) {
      document.getElementById('app').innerHTML = '';
      renderFunction(state);
      this.updateTabBar(path);
    }
  }

  updateTabBar(path) {
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;
    
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-path') === path) {
        item.classList.add('active');
      }
    });
  }
}

export const router = new Router();
window.router = router;

// ---- 輔助函數 ----
function showLoading(message = '載入中...') {
  document.getElementById('app').innerHTML = `
    <div class="loading-screen">
      <div class="loading-icon">⚖️</div>
      <div class="loading-text">${message}</div>
    </div>
  `;
}

function showToast(icon, message) {
  const toast = document.createElement('div');
  toast.className = 'toast-container';
  toast.innerHTML = `
    <div class="toast">
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---- 頁面渲染函數 ----

function renderHome() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="home-hero section">
        <div class="hero-emoji animate-pop-in">⚖️</div>
        <h1 class="hero-title">司律一試複習平台</h1>
        <p class="hero-subtitle">掌握每個法學觀念</p>
      </div>
      
      <div class="quick-actions section">
        <div class="quick-action-card" onclick="window.router.navigate('/practice')">
          <div class="qa-icon">📝</div>
          <div class="qa-title">開始測驗</div>
          <div class="qa-desc">依科目 / 弱點觀念</div>
        </div>
        <div class="quick-action-card" onclick="window.router.navigate('/dashboard')">
          <div class="qa-icon">📊</div>
          <div class="qa-title">弱點分析</div>
          <div class="qa-desc">檢視觀念標籤</div>
        </div>
        <div class="quick-action-card" onclick="window.router.navigate('/achievements')">
          <div class="qa-icon">🏆</div>
          <div class="qa-title">成就徽章</div>
          <div class="qa-desc">解鎖里程碑</div>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

import { spacedRepetition } from './core/spacedRepetition.js';

function renderPractice() {
  const appDiv = document.getElementById('app');
  const recommendedTags = spacedRepetition.getTodaysRecommendedTags();
  
  let recommendHtml = '';
  if (recommendedTags.length > 0) {
    recommendHtml = `
      <div class="card section mb-4" style="border-color: var(--color-accent); background: rgba(245, 158, 11, 0.05);">
        <h3 class="mb-3 text-accent">🧠 今日智慧推薦複習</h3>
        <p class="text-sm text-muted mb-3">系統基於艾賓浩斯遺忘曲線與您的弱點所挑選</p>
        <div class="stagger-children">
          ${recommendedTags.map(tag => `
            <div class="practice-mode-card mb-2" onclick="startTagQuiz('${tag}')">
              <div class="pm-icon">🎯</div>
              <div class="pm-info">
                <div class="pm-title">觀念：${tag}</div>
                <div class="pm-desc">系統強烈建議您現在複習</div>
              </div>
              <div class="pm-arrow">→</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <h2 class="section-title">選擇練習模式</h2>
      </div>
      
      ${recommendHtml}

      <div class="practice-mode-list section">
        <h3 class="mb-3">一般題庫</h3>
        <div class="practice-mode-card" onclick="startSubjectQuiz('constitutional')">
          <div class="pm-icon">📜</div>
          <div class="pm-info">
            <div class="pm-title">憲法</div>
            <div class="pm-desc">點擊開始練習憲法</div>
          </div>
          <div class="pm-arrow">→</div>
        </div>
        <div class="practice-mode-card" onclick="startSubjectQuiz('administrative')">
          <div class="pm-icon">🏛️</div>
          <div class="pm-info">
            <div class="pm-title">行政法</div>
            <div class="pm-desc">點擊開始練習行政法</div>
          </div>
          <div class="pm-arrow">→</div>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

// 啟動科目測驗
window.startSubjectQuiz = async (subjectId) => {
  showLoading('載入題庫中...');
  const questions = await dataLoader.getQuestionsBySubject(subjectId);
  if (questions.length === 0) {
    alert("目前該科目沒有題目。");
    router.navigate('/practice');
    return;
  }
  currentQuizEngine = new QuizEngine(questions);
  router.navigate('/quiz');
};

// 啟動標籤測驗
window.startTagQuiz = async (tag) => {
  showLoading(`載入「${tag}」相關題庫中...`);
  const questions = await dataLoader.getQuestionsByTag(tag);
  if (questions.length === 0) {
    alert("目前該觀念沒有題目，自動使用預設示範題。");
    const mock = await dataLoader.getQuestionsBySubject('mock');
    currentQuizEngine = new QuizEngine(mock);
  } else {
    currentQuizEngine = new QuizEngine(questions);
  }
  router.navigate('/quiz');
};

function renderQuiz() {
  if (!currentQuizEngine || currentQuizEngine.isFinished()) {
    router.navigate('/practice');
    return;
  }

  const appDiv = document.getElementById('app');
  const question = currentQuizEngine.getCurrentQuestion();
  const currentQNum = currentQuizEngine.currentIndex + 1;
  const totalQNum = currentQuizEngine.getTotalQuestions();
  const progressPercent = (currentQNum / totalQNum) * 100;

  // 標籤 Chip
  const tagsHtml = (question.tags || []).map(t => `<span class="chip">${t}</span>`).join('');

  appDiv.innerHTML = `
    <div class="page" style="padding-bottom: 80px;">
      <div class="quiz-header">
        <div class="quiz-back" onclick="window.router.navigate('/practice')">←</div>
        <div class="quiz-info">
          <div class="quiz-subject">題庫練習</div>
          <div class="quiz-progress-text">第 ${currentQNum} 題 / 共 ${totalQNum} 題</div>
        </div>
        <div class="quiz-actions">
        </div>
      </div>
      
      <div class="progress-bar quiz-progress">
        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <div class="question-container animate-fade-in">
        <div class="question-number">觀念標籤: ${tagsHtml}</div>
        <div class="question-text">${question.questionText}</div>
        
        <div class="question-options">
          ${Object.entries(question.options).map(([key, value]) => `
            <button class="option-btn" onclick="submitAnswer('${key}')" id="opt-${key}">
              <div class="option-label">${key}</div>
              <div class="option-text">${value}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 解答區塊 (預設隱藏) -->
      <div id="explanation-box" class="card mt-4 hidden animate-slide-up">
        <h4 class="mb-2">📖 詳解</h4>
        <p class="text-sm" id="explanation-text"></p>
      </div>
    </div>

    <!-- 底部按鈕區 -->
    <div class="quiz-footer hidden" id="quiz-footer">
      <button class="btn btn-primary btn-block" onclick="nextQuestion()">下一題 →</button>
    </div>
  `;
}

// 提交答案邏輯
window.submitAnswer = (selectedKey) => {
  if (!currentQuizEngine) return;
  
  // 避免重複作答
  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => btn.classList.add('disabled'));

  const result = currentQuizEngine.submitAnswer(selectedKey);
  
  // 顯示正確/錯誤 UI
  const selectedBtn = document.getElementById(`opt-${selectedKey}`);
  const correctBtn = document.getElementById(`opt-${result.correctAnswer}`);
  
  if (result.isCorrect) {
    selectedBtn.classList.add('correct');
  } else {
    selectedBtn.classList.add('wrong');
    correctBtn.classList.add('correct'); // 提示正確答案
  }

  // 顯示詳解
  if (result.explanation) {
    document.getElementById('explanation-text').innerText = result.explanation;
    document.getElementById('explanation-box').classList.remove('hidden');
  }

  // 顯示下一題按鈕
  document.getElementById('quiz-footer').classList.remove('hidden');
};

// 下一題邏輯
window.nextQuestion = () => {
  currentQuizEngine.nextQuestion();
  if (currentQuizEngine.isFinished()) {
    // 儲存紀錄
    const summary = currentQuizEngine.getResultSummary();
    storage.saveQuizHistory(summary.history);
    
    // 檢查成就
    const newAchievements = achievementSystem.checkAchievements(summary);
    if (newAchievements.length > 0) {
      newAchievements.forEach((ach, index) => {
        setTimeout(() => {
          showToast(ach.icon, `解鎖成就：${ach.name}!`);
        }, index * 800);
      });
    }

    router.navigate('/result');
  } else {
    renderQuiz();
  }
};

function renderResult() {
  if (!currentQuizEngine) {
    router.navigate('/');
    return;
  }
  
  const summary = currentQuizEngine.getResultSummary();
  const appDiv = document.getElementById('app');
  
  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="result-hero section">
        <div class="result-emoji animate-pop-in">${summary.accuracy >= 60 ? '🎉' : '💪'}</div>
        <div class="result-score">
          ${Math.round(summary.accuracy)}<span class="result-total">%</span>
        </div>
        <div class="result-label">正確率</div>
        <div class="result-message">${summary.accuracy >= 60 ? '表現不錯！繼續保持' : '別灰心，多練習觀念就會通！'}</div>
      </div>
      
      <div class="stats-grid section">
        <div class="stat-card">
          <div class="stat-value">${summary.correctCount}</div>
          <div class="stat-label">答對題數</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.totalQuestions}</div>
          <div class="stat-label">總題數</div>
        </div>
      </div>

      <div class="section">
        <button class="btn btn-primary btn-block mb-3" onclick="window.router.navigate('/dashboard')">查看觀念分析報告</button>
        <button class="btn btn-outline btn-block" onclick="window.router.navigate('/practice')">繼續練習</button>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

function renderDashboard() {
  const appDiv = document.getElementById('app');
  const tagStats = storage.getTagStats();
  const subjectStats = storage.getSubjectStats();
  const dailyTrend = storage.getDailyTrend();
  
  const tags = Object.keys(tagStats);

  let contentHtml = '';

  if (tags.length === 0) {
    contentHtml = `
      <div class="empty-state section">
        <div class="empty-icon">📈</div>
        <div class="empty-text">完成幾次測驗後，這裡會顯示您的「觀念弱點分析」。</div>
        <button class="btn btn-primary" onclick="window.router.navigate('/practice')">去測驗</button>
      </div>
    `;
  } else {
    // 列出觀念清單
    const listHtml = tags.map(tag => {
      const stat = tagStats[tag];
      const acc = Math.round(stat.accuracy);
      let colorClass = acc >= 70 ? 'success' : (acc >= 50 ? 'warning' : 'error');
      
      return `
        <div class="subject-item">
          <div class="subject-icon">🏷️</div>
          <div class="subject-info">
            <div class="subject-name">${tag}</div>
            <div class="subject-stats">${stat.correct} / ${stat.total} 題</div>
          </div>
          <div class="subject-bar">
            <div class="progress-bar"><div class="progress-bar-fill ${colorClass}" style="width: ${acc}%;"></div></div>
          </div>
          <div class="subject-rate text-${colorClass}">${acc}%</div>
        </div>
      `;
    }).join('');

    contentHtml = `
      <div class="card section mb-4">
        <h3 class="mb-2">整體進步趨勢</h3>
        <div class="trend-container">
          <canvas id="trendChart" class="trend-canvas"></canvas>
        </div>
      </div>

      <div class="card section mb-4">
        <h3 class="mb-2">科目雷達圖</h3>
        <div class="radar-container">
          <canvas id="radarChart" class="radar-canvas"></canvas>
        </div>
      </div>

      <div class="card section">
        <h3 class="mb-3">觀念弱點雷達</h3>
        <p class="text-sm text-muted mb-4">細顆粒度觀念分析</p>
        <div class="subject-list">
          ${listHtml}
        </div>
      </div>
    `;
  }

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <h2 class="section-title">數據分析</h2>
      </div>
      ${contentHtml}
    </div>
    ${renderTabBar()}
  `;

  // 若有資料，延遲一點時間等待 DOM 渲染後畫圖
  if (tags.length > 0) {
    setTimeout(() => {
      drawCharts(subjectStats, dailyTrend);
    }, 100);
  }
}

// 繪製 Chart.js 圖表
function drawCharts(subjectStats, dailyTrend) {
  if (typeof Chart === 'undefined') return;
  
  // 1. 繪製雷達圖
  const radarCtx = document.getElementById('radarChart');
  if (radarCtx) {
    const labels = Object.keys(subjectStats);
    const data = labels.map(sub => subjectStats[sub].accuracy);
    
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: '正確率 (%)',
          data: data,
          backgroundColor: 'rgba(37, 99, 235, 0.2)', // Primary 色
          borderColor: '#2563EB',
          pointBackgroundColor: '#F59E0B',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#F59E0B'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(0,0,0,0.1)' },
            grid: { color: 'rgba(0,0,0,0.1)' },
            pointLabels: { font: { family: 'Inter', size: 12 }, color: '#4B5563' },
            ticks: { backdropColor: 'transparent', color: '#9CA3AF', min: 0, max: 100, stepSize: 20 }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 2. 繪製趨勢圖
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx && dailyTrend.length > 0) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: dailyTrend.map(d => d.date),
        datasets: [{
          label: '每日正確率',
          data: dailyTrend.map(d => d.accuracy),
          borderColor: '#10B981', // Success 色
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function renderAchievements() {
  const appDiv = document.getElementById('app');
  const unlocked = achievementSystem.getUnlockedAchievements();
  
  const gridHtml = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
    `;
  }).join('');

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">成就徽章</h2>
        <div style="width: 24px;"></div>
      </div>
      <p class="text-sm text-muted mb-4 text-center">解鎖 ${unlocked.length} / ${ACHIEVEMENTS.length} 個成就</p>
      
      <div class="achievement-grid section">
        ${gridHtml}
      </div>
    </div>
    ${renderTabBar()}
  `;
}

import { predictor } from './core/predictor.js';

function renderPrediction() {
  const appDiv = document.getElementById('app');
  const prediction = predictor.calculateProbability();
  
  const score = prediction.score;
  // 計算在量表上的百分比 (滿分 600)
  const scorePercent = Math.min(100, Math.max(0, (score / 600) * 100));

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">落點預測</h2>
        <div style="width: 24px;"></div>
      </div>
      
      <div class="prediction-gauge animate-pop-in">
        <div class="gauge-circle">
          <svg viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-accent)" stroke-width="3" stroke-dasharray="${scorePercent}, 100" class="gauge-fill" />
          </svg>
          <div class="gauge-score">${score}</div>
          <div class="gauge-label">預估總分 (滿分 600)</div>
        </div>
      </div>

      <div class="cutoff-bar section animate-fade-in" style="animation-delay: 0.3s">
        <h3 class="mb-2">錄取線對比</h3>
        <div class="cutoff-track">
          <div class="cutoff-fill" style="width: ${scorePercent}%;"></div>
          <!-- 律師線 354 -> 59% -->
          <div class="cutoff-marker lawyer" style="left: 59%;" data-label="律師線(354)"></div>
          <!-- 司法官線 362 -> 60.33% -->
          <div class="cutoff-marker judge" style="left: 60.33%;" data-label="司法官線(362)"></div>
          
          <div class="cutoff-marker you" style="left: ${scorePercent}%;" data-label="預估落點"></div>
        </div>
      </div>

      <div class="probability-cards section animate-fade-in" style="animation-delay: 0.6s">
        <div class="probability-card">
          <div class="prob-title">律師上榜機率</div>
          <div class="prob-value text-${prediction.lawyerProb >= 60 ? 'success' : 'warning'}">${prediction.lawyerProb}%</div>
          <div class="prob-bar progress-bar"><div class="progress-bar-fill ${prediction.lawyerProb >= 60 ? 'success' : 'warning'}" style="width: ${prediction.lawyerProb}%;"></div></div>
        </div>
        <div class="probability-card">
          <div class="prob-title">司法官上榜機率</div>
          <div class="prob-value text-${prediction.judgeProb >= 60 ? 'success' : 'warning'}">${prediction.judgeProb}%</div>
          <div class="prob-bar progress-bar"><div class="progress-bar-fill ${prediction.judgeProb >= 60 ? 'success' : 'warning'}" style="width: ${prediction.judgeProb}%;"></div></div>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

function renderTabBar() {
  return `
    <nav class="tab-bar">
      <div class="tab-item" data-path="/" onclick="window.router.navigate('/')">
        <span class="tab-icon">🏠</span>
        首頁
      </div>
      <div class="tab-item" data-path="/practice" onclick="window.router.navigate('/practice')">
        <span class="tab-icon">📝</span>
        練習
      </div>
      <div class="tab-item" data-path="/prediction" onclick="window.router.navigate('/prediction')">
        <span class="tab-icon">🎯</span>
        預測
      </div>
      <div class="tab-item" data-path="/dashboard" onclick="window.router.navigate('/dashboard')">
        <span class="tab-icon">📊</span>
        分析
      </div>
    </nav>
  `;
}

// 註冊路由
router.addRoute('/', renderHome);
router.addRoute('/practice', renderPractice);
router.addRoute('/quiz', renderQuiz);
router.addRoute('/result', renderResult);
router.addRoute('/dashboard', renderDashboard);
router.addRoute('/achievements', renderAchievements);
router.addRoute('/prediction', renderPrediction);

// 初始載入
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    router.loadRoute(window.location.pathname);
  }, 800);
});
