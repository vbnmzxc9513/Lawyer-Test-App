import { app, db } from './core/firebase.js';
import { authService } from './core/auth.js';
import { dataLoader } from './utils/dataLoader.js';
import { questionCache } from './utils/questionCache.js';
import { QuizEngine } from './core/quizEngine.js';
import { storage } from './utils/storage.js';
import { achievementSystem, ACHIEVEMENTS } from './core/achievementSystem.js';

// 全局使用者狀態
window.currentUser = null;

// 監聽登入狀態
authService.onAuthStateChanged((user) => {
  window.currentUser = user;
  if (window.location.pathname === '/login' && user) {
    router.navigate('/');
  }
  // 更新 UI 狀態
  const loginTab = document.querySelector('.tab-login');
  if (loginTab) {
    loginTab.innerHTML = user ? '🚪 登出' : '👤 登入';
  }
});

// 科目設定
const SUBJECTS = {
  constitutional:         { name: '憲法',       icon: '📜', paper: '試卷一' },
  administrative:         { name: '行政法',     icon: '🏛️', paper: '試卷一' },
  international_public:   { name: '國際公法',   icon: '🌍', paper: '試卷一' },
  international_private:  { name: '國際私法',   icon: '⚖️', paper: '試卷一' },
  criminal:               { name: '刑法',       icon: '🔒', paper: '試卷二' },
  criminal_procedure:     { name: '刑事訴訟法', icon: '👨‍⚖️', paper: '試卷二' },
  legal_ethics:           { name: '法律倫理',   icon: '📋', paper: '試卷二' },
  civil:                  { name: '民法',       icon: '🏠', paper: '試卷三' },
  civil_procedure:        { name: '民事訴訟法', icon: '📑', paper: '試卷三' },
  company:                { name: '公司法',     icon: '🏢', paper: '試卷四' },
  insurance:              { name: '保險法',     icon: '🛡️', paper: '試卷四' },
  negotiable_instruments: { name: '票據法',     icon: '📄', paper: '試卷四' },
  securities:             { name: '證券交易法', icon: '📈', paper: '試卷四' },
  enforcement:            { name: '強制執行法', icon: '🔨', paper: '試卷四' },
  legal_english:          { name: '法學英文',   icon: '🇬🇧', paper: '試卷四' },
};

const PAPERS = [
  { id: '試卷一', subjects: ['constitutional','administrative','international_public','international_private'] },
  { id: '試卷二', subjects: ['criminal','criminal_procedure','legal_ethics'] },
  { id: '試卷三', subjects: ['civil','civil_procedure'] },
  { id: '試卷四', subjects: ['company','insurance','negotiable_instruments','securities','enforcement','legal_english'] },
];

// 狀態管理
let currentQuizEngine = null;
let selectedPracticeYear = 114;
let currentQuizMeta = { year: null, subject: null };

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
      Promise.resolve(renderFunction(state)).then(() => {
        this.updateTabBar(path);
      });
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
  const user = window.currentUser;
  const username = user ? user.email.replace('@lawyerapp.com', '') : null;

  const authCardHtml = user ? `
    <div class="auth-status-card logged-in section">
      <div class="auth-welcome">
        <span class="auth-avatar">👤</span>
        <div class="auth-welcome-text">
          <div class="auth-greeting">歡迎回來</div>
          <div class="auth-username">${username}</div>
        </div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="window.logoutUser()">登出</button>
    </div>
  ` : `
    <div class="auth-status-card section" onclick="window.router.navigate('/login')">
      <div class="auth-prompt">
        <span class="auth-prompt-icon">🔑</span>
        <div class="auth-prompt-text">
          <div class="auth-prompt-title">登入 / 註冊</div>
          <div class="auth-prompt-desc">同步學習紀錄，跨裝置複習</div>
        </div>
      </div>
      <span class="auth-prompt-arrow">›</span>
    </div>
  `;

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="home-hero section">
        <div class="hero-emoji animate-pop-in">⚖️</div>
        <h1 class="hero-title">司律一試複習平台</h1>
        <p class="hero-subtitle">掌握每個法學觀念</p>
      </div>
      
      ${authCardHtml}

      <div class="quick-actions section">
        <div class="quick-action-card" onclick="window.router.navigate('/custom-quiz')">
          <div class="qa-icon">⚙️</div>
          <div class="qa-title">自訂測驗</div>
          <div class="qa-desc">依弱點抽題</div>
        </div>
        <div class="quick-action-card" onclick="window.router.navigate('/mistakes')">
          <div class="qa-icon">📓</div>
          <div class="qa-title">錯題本</div>
          <div class="qa-desc">複習答錯題目</div>
        </div>
        <div class="quick-action-card" onclick="window.router.navigate('/practice')">
          <div class="qa-icon">📝</div>
          <div class="qa-title">歷屆測驗</div>
          <div class="qa-desc">依科目練習</div>
        </div>
        <div class="quick-action-card" onclick="window.router.navigate('/search')">
          <div class="qa-icon">🔍</div>
          <div class="qa-title">試題搜尋</div>
          <div class="qa-desc">關鍵字找題</div>
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
  const yr = selectedPracticeYear;

  const papersHtml = PAPERS.map(paper => {
    const cardsHtml = paper.subjects.map(sid => {
      const s = SUBJECTS[sid];
      return `<div class="subject-card" onclick="startSubjectQuiz('${sid}', ${yr})">
        <span class="sc-icon">${s.icon}</span>
        <span class="sc-name">${s.name}</span>
        <span class="sc-arrow">›</span>
      </div>`;
    }).join('');
    return `<div class="paper-section">
      <div class="paper-label">${paper.id}</div>
      <div class="sc-grid">${cardsHtml}</div>
    </div>`;
  }).join('');

  appDiv.innerHTML = `
    <div class="page">
      <div class="section-header">
        <h2 class="section-title">📚 選擇練習科目</h2>
      </div>
      <div class="year-tabs">
        ${[114, 113, 112, 111].map(y => `
          <button class="year-tab ${y === yr ? 'active' : ''}" onclick="window.changePracticeYear(${y})">${y}年</button>
        `).join('')}
      </div>
      <div class="papers-container">${papersHtml}</div>
    </div>
    ${renderTabBar()}
  `;
}

window.changePracticeYear = (year) => {
  selectedPracticeYear = year;
  renderPractice();
};

// 啟動科目測驗
window.startSubjectQuiz = async (subjectId, year) => {
  const s = SUBJECTS[subjectId] || { name: subjectId };
  const yearLabel = year || '全部';
  showLoading(`載入 ${yearLabel}年 ${s.name} 題庫中...`);
  const questions = year
    ? await dataLoader.getQuestionsByYearAndSubject(year, subjectId)
    : await dataLoader.getQuestionsBySubject(subjectId);
  if (questions.length === 0) {
    alert(`目前 ${yearLabel}年 ${s.name} 沒有題目。`);
    router.navigate('/practice');
    return;
  }
  currentQuizMeta = { year: year || '全部', subject: subjectId };
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

  const meta = currentQuizMeta;
  const subjectName = SUBJECTS[meta.subject] ? SUBJECTS[meta.subject].name : meta.subject;
  const yearLabel = meta.year || '';

  appDiv.innerHTML = `
    <div class="page" style="padding-bottom: 80px;">
      <div class="quiz-header">
        <div class="quiz-back" onclick="window.router.navigate('/practice')">←</div>
        <div class="quiz-info">
          <div class="quiz-subject">${yearLabel}年 ${subjectName}</div>
          <div class="quiz-progress-text">第 ${currentQNum} 題 / 共 ${totalQNum} 題</div>
        </div>
      </div>

      <div class="progress-bar quiz-progress">
        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <div class="question-container animate-fade-in">
        <div class="question-meta">
          <span class="q-year-badge">${yearLabel}年考古題</span>
          ${tagsHtml}
        </div>
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

      <div id="explanation-box" class="exp-card hidden animate-slide-up"></div>
    </div>

    <div class="quiz-footer hidden" id="quiz-footer">
      <button class="btn btn-primary btn-block" onclick="nextQuestion()">下一題 →</button>
    </div>
  `;
}

// 提交答案邏輯
window.submitAnswer = (selectedKey) => {
  if (!currentQuizEngine) return;

  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.add('disabled'));

  const result = currentQuizEngine.submitAnswer(selectedKey);
  const q = currentQuizEngine.questions[currentQuizEngine.currentIndex];

  document.getElementById(`opt-${selectedKey}`).classList.add(result.isCorrect ? 'correct' : 'wrong');
  if (!result.isCorrect) document.getElementById(`opt-${result.correctAnswer}`).classList.add('correct');

  // 渲染詳解（支援六層富格式 或 純文字 fallback）
  const box = document.getElementById('explanation-box');
  const exp = result.explanation;
  if (exp && typeof exp === 'object') {
    const optHtml = Object.entries(exp.optionAnalysis || {}).map(([k, v]) =>
      `<div class="opt-analysis"><span class="opt-key ${result.correctAnswer === k ? 'opt-correct' : ''}">${k}</span><span>${v}</span></div>`
    ).join('');
    box.innerHTML = `
      <div class="exp-result-badge ${result.isCorrect ? 'badge-correct' : 'badge-wrong'}">
        ${result.isCorrect ? '✅ 答對了！' : `❌ 正確答案是 ${result.correctAnswer}`}
      </div>
      <div class="exp-section"><div class="exp-label">🔑 核心概念</div><div class="exp-concept">${exp.coreConcept || ''}</div></div>
      <div class="exp-section"><div class="exp-label">🌱 生活類比</div><div class="exp-analogy">${exp.analogy || ''}</div></div>
      <div class="exp-section"><div class="exp-label">📖 核心說明</div><div class="exp-body">${exp.coreExplanation || ''}</div></div>
      <div class="exp-section"><div class="exp-label">📋 選項解析</div><div class="exp-options">${optHtml}</div></div>
      <div class="exp-section"><div class="exp-label">💡 考試口訣</div><div class="exp-takeaway">${exp.keyTakeaway || ''}</div></div>
      <div class="exp-section"><div class="exp-label">📜 相關法條</div><div class="exp-articles">${exp.relatedArticles || ''}</div></div>
    `;
  } else if (exp) {
    box.innerHTML = `
      <div class="exp-result-badge ${result.isCorrect ? 'badge-correct' : 'badge-wrong'}">
        ${result.isCorrect ? '✅ 答對了！' : `❌ 正確答案是 ${result.correctAnswer}`}
      </div>
      <div class="exp-section"><div class="exp-label">📖 詳解</div><div class="exp-body">${exp}</div></div>
    `;
  } else {
    box.innerHTML = `<div class="exp-result-badge ${result.isCorrect ? 'badge-correct' : 'badge-wrong'}">${result.isCorrect ? '✅ 答對了！' : `❌ 正確答案是 ${result.correctAnswer}`}</div>`;
  }

  // 錯題重考模式 + 答對 → 顯示移除確認
  if (result.isMistakeRetry && result.isCorrect && result.questionId) {
    const removeHtml = `
      <div class="mistake-remove-confirm">
        <div class="mistake-remove-text">🎉 恭喜答對！是否從錯題本移除此題？</div>
        <div class="mistake-remove-actions">
          <button class="btn btn-sm btn-primary" onclick="window.confirmRemoveMistake('${result.questionId}', this)">✅ 移除</button>
          <button class="btn btn-sm btn-outline" onclick="this.closest('.mistake-remove-confirm').innerHTML='<div class=\\'text-sm text-muted\\' style=\\'padding:8px 0\\'>已保留在錯題本中</div>'">📌 保留</button>
        </div>
      </div>
    `;
    box.innerHTML += removeHtml;
  }

  box.classList.remove('hidden');
  document.getElementById('quiz-footer').classList.remove('hidden');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  const overview = storage.getOverviewStats();
  const subjectTagStats = storage.getSubjectTagStats();
  const subjectStats = storage.getSubjectStats();
  const dailyTrend = storage.getDailyTrend();

  if (!overview) {
    appDiv.innerHTML = `
      <div class="page stagger-children">
        <div class="section-header">
          <h2 class="section-title">📊 數據分析</h2>
        </div>
        <div class="empty-state section">
          <div class="empty-icon">📈</div>
          <div class="empty-text">完成幾次測驗後，這裡會顯示您的專業弱點分析報告。</div>
          <button class="btn btn-primary" onclick="window.router.navigate('/custom-quiz')">去測驗</button>
        </div>
      </div>
      ${renderTabBar()}
    `;
    return;
  }

  // ---- 1. 總覽 Stats ----
  const accClass = overview.overallAccuracy >= 70 ? 'success' : (overview.overallAccuracy >= 50 ? 'warning' : 'error');
  const overviewHtml = `
    <div class="analytics-overview section">
      <div class="ao-card">
        <div class="ao-value">${overview.totalAttempted}</div>
        <div class="ao-label">作答題數</div>
      </div>
      <div class="ao-card ao-highlight">
        <div class="ao-value text-${accClass}">${Math.round(overview.overallAccuracy)}%</div>
        <div class="ao-label">整體正確率</div>
      </div>
      <div class="ao-card">
        <div class="ao-value">${overview.uniqueQuestions}</div>
        <div class="ao-label">不重複題目</div>
      </div>
      <div class="ao-card">
        <div class="ao-value">${overview.mistakeCount}</div>
        <div class="ao-label">待複習錯題</div>
      </div>
    </div>
  `;

  // ---- 2. 科目精熟度（大類）—— 按正確率排序，弱項在前 ----
  const sortedSubjects = Object.entries(subjectTagStats)
    .map(([id, stat]) => ({ id, ...stat, meta: SUBJECTS[id] }))
    .filter(s => s.meta)
    .sort((a, b) => a.accuracy - b.accuracy);

  const subjectMasteryHtml = sortedSubjects.map((s, idx) => {
    const acc = Math.round(s.accuracy);
    const colorClass = acc >= 70 ? 'success' : (acc >= 50 ? 'warning' : 'error');
    const tagCount = Object.keys(s.tags).length;
    const weakTags = Object.entries(s.tags).filter(([, t]) => t.accuracy < 60).length;

    return `
      <div class="mastery-card" onclick="window.toggleSubjectDrill('${s.id}')">
        <div class="mastery-header">
          <div class="mastery-left">
            <span class="mastery-rank ${colorClass}">${idx + 1}</span>
            <span class="mastery-icon">${s.meta.icon}</span>
            <div class="mastery-info">
              <div class="mastery-name">${s.meta.name}</div>
              <div class="mastery-meta">${s.correct}/${s.total} 題${weakTags > 0 ? ` · <span class="text-error">${weakTags} 個弱點觀念</span>` : ''}</div>
            </div>
          </div>
          <div class="mastery-right">
            <div class="mastery-rate text-${colorClass}">${acc}%</div>
            <span class="mastery-arrow" id="drill-arrow-${s.id}">▸</span>
          </div>
        </div>
        <div class="mastery-bar">
          <div class="progress-bar"><div class="progress-bar-fill ${colorClass}" style="width: ${acc}%;"></div></div>
        </div>
      </div>
    `;
  }).join('');

  // ---- 3. 科目 Drill-down 面板（小類）——預先渲染為隱藏，點擊展開 ----
  const drillPanelsHtml = sortedSubjects.map(s => {
    const tagEntries = Object.entries(s.tags)
      .map(([tag, stat]) => ({ tag, ...stat }))
      .sort((a, b) => a.accuracy - b.accuracy); // 弱項在前

    if (tagEntries.length === 0) {
      return `<div class="drill-panel hidden" id="drill-${s.id}">
        <div class="text-sm text-muted" style="padding: 12px 16px;">此科目目前沒有觀念標籤資料</div>
      </div>`;
    }

    const tagListHtml = tagEntries.map(t => {
      const tAcc = Math.round(t.accuracy);
      const tColor = tAcc >= 70 ? 'success' : (tAcc >= 50 ? 'warning' : 'error');
      const isWeak = tAcc < 50;
      return `
        <div class="drill-tag ${isWeak ? 'is-weak' : ''}" onclick="event.stopPropagation(); window.startTagQuiz('${t.tag.replace(/'/g, "\\'")}')">
          <div class="drill-tag-left">
            <span class="drill-tag-dot ${tColor}"></span>
            <span class="drill-tag-name">${t.tag}</span>
          </div>
          <div class="drill-tag-right">
            <span class="drill-tag-stat">${t.correct}/${t.total}</span>
            <span class="drill-tag-rate text-${tColor}">${tAcc}%</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="drill-panel hidden" id="drill-${s.id}">
        <div class="drill-header">
          <span class="text-xs text-muted">${s.meta.icon} ${s.meta.name} — 觀念標籤（小類）</span>
          <span class="text-xs text-muted">${tagEntries.length} 個觀念</span>
        </div>
        <div class="drill-list">${tagListHtml}</div>
      </div>
    `;
  }).join('');

  // ---- 4. 弱點警報 ——找出最弱的 5 個觀念 ----
  const allTags = [];
  sortedSubjects.forEach(s => {
    Object.entries(s.tags).forEach(([tag, stat]) => {
      allTags.push({ tag, subject: s.meta.name, subjectIcon: s.meta.icon, ...stat });
    });
  });
  const weakestTags = allTags
    .filter(t => t.total >= 2) // 至少作答過 2 題才列入
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  let weakAlertHtml = '';
  if (weakestTags.length > 0) {
    const weakListHtml = weakestTags.map(t => {
      const tAcc = Math.round(t.accuracy);
      return `
        <div class="weak-item" onclick="window.startTagQuiz('${t.tag.replace(/'/g, "\\'")}')">
          <span class="weak-icon">⚠️</span>
          <div class="weak-info">
            <div class="weak-tag">${t.tag}</div>
            <div class="weak-subject">${t.subjectIcon} ${t.subject} · ${t.correct}/${t.total}</div>
          </div>
          <span class="weak-rate text-error">${tAcc}%</span>
        </div>
      `;
    }).join('');

    weakAlertHtml = `
      <div class="card section mb-4 weak-alert-card">
        <div class="weak-alert-header">
          <h3>🚨 弱點警報</h3>
          <span class="text-xs text-muted">點擊可直接練習</span>
        </div>
        <div class="weak-list">${weakListHtml}</div>
      </div>
    `;
  }

  // ---- 組裝頁面 ----
  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <h2 class="section-title">📊 數據分析</h2>
      </div>

      ${overviewHtml}

      ${weakAlertHtml}

      <div class="card section mb-4">
        <div class="card-header-row">
          <h3>科目精熟度<span class="text-xs text-muted ml-2">（大類）</span></h3>
          <span class="text-xs text-muted">依正確率排序 · 弱項在前</span>
        </div>
        <div class="mastery-list">${subjectMasteryHtml}</div>
        ${drillPanelsHtml}
      </div>

      <div class="card section mb-4">
        <h3 class="mb-2">科目雷達圖</h3>
        <div class="radar-container">
          <canvas id="radarChart" class="radar-canvas"></canvas>
        </div>
      </div>

      <div class="card section mb-4">
        <h3 class="mb-2">每日正確率趨勢</h3>
        <div class="trend-container">
          <canvas id="trendChart" class="trend-canvas"></canvas>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;

  // 畫圖表
  setTimeout(() => {
    drawCharts(subjectStats, dailyTrend);
  }, 120);
}

// 科目展開/收合
window.toggleSubjectDrill = (subjectId) => {
  const panel = document.getElementById(`drill-${subjectId}`);
  const arrow = document.getElementById(`drill-arrow-${subjectId}`);
  if (!panel) return;
  const isOpen = !panel.classList.contains('hidden');
  // 先收合所有其他面板
  document.querySelectorAll('.drill-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.mastery-arrow').forEach(a => { a.textContent = '▸'; });
  if (!isOpen) {
    panel.classList.remove('hidden');
    if (arrow) arrow.textContent = '▾';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// 從分析頁直接練習特定觀念
window.startTagQuiz = async (tag) => {
  showLoading(`正在載入「${tag}」相關題目...`);
  const questions = await dataLoader.getQuestionsByTag(tag);
  if (questions.length === 0) {
    alert(`找不到「${tag}」相關的題目`);
    router.navigate('/dashboard');
    return;
  }
  currentQuizMeta = { year: '觀念練習', subject: tag };
  currentQuizEngine = new QuizEngine(questions);
  router.navigate('/quiz');
};

// 繪製 Chart.js 圖表
function drawCharts(subjectStats, dailyTrend) {
  if (typeof Chart === 'undefined') return;
  
  // 1. 雷達圖 — 用中文名稱
  const radarCtx = document.getElementById('radarChart');
  if (radarCtx) {
    const entries = Object.entries(subjectStats);
    const labels = entries.map(([id]) => SUBJECTS[id] ? SUBJECTS[id].name : id);
    const data = entries.map(([, s]) => Math.round(s.accuracy));
    
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '正確率 (%)',
          data,
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderColor: '#2563EB',
          borderWidth: 2,
          pointBackgroundColor: data.map(v => v >= 70 ? '#10B981' : (v >= 50 ? '#F59E0B' : '#EF4444')),
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(0,0,0,0.08)' },
            grid: { color: 'rgba(0,0,0,0.06)' },
            pointLabels: { font: { family: 'Noto Sans TC, Inter', size: 11, weight: '500' }, color: '#4B5563' },
            ticks: { backdropColor: 'transparent', color: '#9CA3AF', min: 0, max: 100, stepSize: 20, font: { size: 10 } },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 2. 趨勢折線圖
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx && dailyTrend.length > 0) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: dailyTrend.map(d => d.date),
        datasets: [{
          label: '每日正確率',
          data: dailyTrend.map(d => Math.round(d.accuracy)),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2563EB',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: v => v + '%' } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `正確率: ${ctx.parsed.y}%` } }
        }
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
  const r = predictor.getFullReport();

  if (r.totalQuestions === 0) {
    appDiv.innerHTML = `
      <div class="page stagger-children">
        <div class="section-header">
          <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
          <h2 class="section-title">🎯 落點預測</h2>
          <div style="width: 24px;"></div>
        </div>
        <div class="empty-state section">
          <div class="empty-icon">🎯</div>
          <div class="empty-text">至少完成一次測驗後才能產生落點預測報告。</div>
          <button class="btn btn-primary" onclick="window.router.navigate('/custom-quiz')">開始測驗</button>
        </div>
      </div>
      ${renderTabBar()}
    `;
    return;
  }

  const scorePercent = Math.min(100, Math.max(0, (r.totalScore / 600) * 100));

  // ---- 1. 預估分數圓環 ----
  const gaugeHtml = `
    <div class="pred-gauge-section">
      <div class="pred-gauge animate-pop-in">
        <svg viewBox="0 0 36 36" class="pred-gauge-svg">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="${r.verdictClass === 'excellent' || r.verdictClass === 'safe' ? '#10B981' : (r.verdictClass === 'risky' ? '#F59E0B' : '#EF4444')}"
            stroke-width="3" stroke-dasharray="${scorePercent}, 100" stroke-linecap="round" class="gauge-fill" />
        </svg>
        <div class="pred-gauge-inner">
          <div class="pred-gauge-score">${r.totalScore}</div>
          <div class="pred-gauge-label">/ 600 分</div>
        </div>
      </div>
      <div class="pred-confidence-badge">
        <span>預測信心度</span>
        <span class="pred-confidence-value">${r.confidence}%</span>
      </div>
      <div class="pred-sample-info">
        已作答 ${r.totalQuestions} 題 · 覆蓋 ${r.attemptedSubjects}/15 科
      </div>
    </div>
  `;

  // ---- 2. 判定結果 Banner ----
  const verdictHtml = `
    <div class="pred-verdict pred-verdict-${r.verdictClass}">
      <span class="pred-verdict-emoji">${r.verdictEmoji}</span>
      <div class="pred-verdict-text">${r.verdict}</div>
    </div>
  `;

  // ---- 3. 試卷別分數 ----
  const paperHtml = Object.entries(r.paperScores).map(([name, p]) => {
    const pPct = Math.round((p.score / p.maxScore) * 100);
    const pColor = pPct >= 70 ? 'success' : (pPct >= 50 ? 'warning' : 'error');
    return `
      <div class="pred-paper-card">
        <div class="pred-paper-header">
          <span class="pred-paper-name">${name}</span>
          <span class="pred-paper-score">${p.score} <span class="text-muted">/ ${p.maxScore}</span></span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill ${pColor}" style="width: ${pPct}%;"></div></div>
        <div class="pred-paper-meta">${p.attemptedSubjects}/${p.totalSubjects} 科已作答</div>
      </div>
    `;
  }).join('');

  // ---- 4. 上榜機率卡片 ----
  const probHtml = `
    <div class="pred-prob-row">
      <div class="pred-prob-card">
        <div class="pred-prob-label">律師上榜機率</div>
        <div class="pred-prob-value ${r.lawyerProb >= 60 ? 'text-success' : (r.lawyerProb >= 40 ? 'text-warning' : 'text-error')}">${r.lawyerProb}%</div>
        <div class="progress-bar"><div class="progress-bar-fill ${r.lawyerProb >= 60 ? 'success' : (r.lawyerProb >= 40 ? 'warning' : 'error')}" style="width: ${r.lawyerProb}%;"></div></div>
        <div class="pred-prob-gap">${r.lawyerGap >= 0 ? `超出均線 +${r.lawyerGap}` : `差 ${Math.abs(r.lawyerGap)} 分`}</div>
      </div>
      <div class="pred-prob-card">
        <div class="pred-prob-label">司法官上榜機率</div>
        <div class="pred-prob-value ${r.judgeProb >= 60 ? 'text-success' : (r.judgeProb >= 40 ? 'text-warning' : 'text-error')}">${r.judgeProb}%</div>
        <div class="progress-bar"><div class="progress-bar-fill ${r.judgeProb >= 60 ? 'success' : (r.judgeProb >= 40 ? 'warning' : 'error')}" style="width: ${r.judgeProb}%;"></div></div>
        <div class="pred-prob-gap">${r.judgeGap >= 0 ? `超出均線 +${r.judgeGap}` : `差 ${Math.abs(r.judgeGap)} 分`}</div>
      </div>
    </div>
  `;

  // ---- 5. 錄取線對比軌道 ----
  const cutoffTrackHtml = `
    <div class="pred-cutoff-track-section">
      <div class="pred-cutoff-track">
        <div class="pred-cutoff-fill" style="width: ${scorePercent}%;"></div>
        <div class="pred-cutoff-marker pred-cutoff-lawyer" style="left: ${(r.avgLawyerCutoff / 600) * 100}%;" data-label="律師線 ${r.avgLawyerCutoff}"></div>
        <div class="pred-cutoff-marker pred-cutoff-judge" style="left: ${(r.avgJudgeCutoff / 600) * 100}%;" data-label="司法官線 ${r.avgJudgeCutoff}"></div>
        <div class="pred-cutoff-marker pred-cutoff-you" style="left: ${scorePercent}%;" data-label="你 ${r.totalScore}"></div>
      </div>
      <div class="pred-cutoff-legend">
        <span><span class="legend-dot" style="background:#3B82F6"></span>你的預估</span>
        <span><span class="legend-dot" style="background:#F59E0B"></span>律師線(${r.avgLawyerCutoff})</span>
        <span><span class="legend-dot" style="background:#8B5CF6"></span>司法官線(${r.avgJudgeCutoff})</span>
      </div>
    </div>
  `;

  // ---- 6. 歷年錄取線比較表 ----
  const cutoffTableRows = Object.entries(r.cutoffComparison)
    .sort(([a], [b]) => b - a)
    .map(([year, data]) => `
      <tr>
        <td>${year}年</td>
        <td>${data.lawyer.cutoff}</td>
        <td class="${data.lawyer.pass ? 'text-success' : 'text-error'}">${data.lawyer.gap >= 0 ? '+' : ''}${data.lawyer.gap}</td>
        <td>${data.lawyer.pass ? '✅' : '❌'}</td>
        <td>${data.judge.cutoff}</td>
        <td class="${data.judge.pass ? 'text-success' : 'text-error'}">${data.judge.gap >= 0 ? '+' : ''}${data.judge.gap}</td>
        <td>${data.judge.pass ? '✅' : '❌'}</td>
      </tr>
    `).join('');

  // ---- 7. 補分策略建議 ----
  const topStrategies = r.strategies.slice(0, 6);
  const strategyHtml = topStrategies.map(s => {
    const priorityLabel = s.priority === 'high' ? '🔴 高' : (s.priority === 'medium' ? '🟡 中' : '🟢 低');
    return `
      <div class="strategy-item ${s.priority === 'high' ? 'is-high' : ''}">
        <div class="strategy-left">
          <span class="strategy-priority">${priorityLabel}</span>
          <div class="strategy-info">
            <div class="strategy-name">${s.name}</div>
            <div class="strategy-detail">正確率 ${s.accuracy}% · 目前 ${s.currentScore}/${s.maxScore} 分</div>
          </div>
        </div>
        <div class="strategy-gain">+${s.potentialGain} 分</div>
      </div>
    `;
  }).join('');

  // ---- 8. 未作答科目警告 ----
  let unattemptedHtml = '';
  if (r.unattemptedSubjects.length > 0) {
    const names = r.unattemptedSubjects.map(s => predictor.subjectNames[s] || s).join('、');
    unattemptedHtml = `
      <div class="pred-warning section">
        <div class="pred-warning-icon">⚠️</div>
        <div class="pred-warning-text">
          <strong>尚有 ${r.unattemptedSubjects.length} 科未作答：</strong>${names}<br>
          <span class="text-xs text-muted">這些科目以猜測機率(25%)估算，實際分數可能有較大偏差。建議盡快補做練習以提高預測準確度。</span>
        </div>
      </div>
    `;
  }

  // ---- 組裝頁面 ----
  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">🎯 落點預測</h2>
        <div style="width: 24px;"></div>
      </div>

      ${gaugeHtml}
      ${verdictHtml}

      <div class="card section mb-4">
        <h3 class="mb-3">試卷別分數</h3>
        <div class="pred-papers">${paperHtml}</div>
      </div>

      ${probHtml}

      <div class="card section mb-4">
        <h3 class="mb-3">錄取線對比</h3>
        ${cutoffTrackHtml}
      </div>

      <div class="card section mb-4">
        <div class="card-header-row">
          <h3>歷年錄取線比較</h3>
          <span class="text-xs text-muted">近3年均線為基準</span>
        </div>
        <div class="pred-table-wrapper">
          <table class="pred-table">
            <thead>
              <tr>
                <th>年度</th>
                <th colspan="3">律師</th>
                <th colspan="3">司法官</th>
              </tr>
              <tr>
                <th></th>
                <th>錄取線</th><th>差距</th><th>通過</th>
                <th>錄取線</th><th>差距</th><th>通過</th>
              </tr>
            </thead>
            <tbody>${cutoffTableRows}</tbody>
          </table>
        </div>
      </div>

      <div class="card section mb-4">
        <div class="card-header-row">
          <h3>📈 補分策略建議</h3>
          <span class="text-xs text-muted">依投資報酬率排序</span>
        </div>
        <p class="text-xs text-muted mb-3">以下是提升空間最大的科目，優先加強可最快提升總分。</p>
        <div class="strategy-list">${strategyHtml}</div>
      </div>

      ${unattemptedHtml}
    </div>
    ${renderTabBar()}
  `;
}

function renderTabBar() {
  const isLoggedIn = !!window.currentUser;
  return `
    <nav class="tab-bar">
      <div class="tab-item" data-path="/" onclick="window.router.navigate('/')">
        <span class="tab-icon">🏠</span>
        首頁
      </div>
      <div class="tab-item" data-path="/custom-quiz" onclick="window.router.navigate('/custom-quiz')">
        <span class="tab-icon">⚙️</span>
        自訂測驗
      </div>
      <div class="tab-item" data-path="/prediction" onclick="window.router.navigate('/prediction')">
        <span class="tab-icon">🎯</span>
        預測
      </div>
      <div class="tab-item" data-path="/dashboard" onclick="window.router.navigate('/dashboard')">
        <span class="tab-icon">📊</span>
        分析
      </div>
      <div class="tab-item tab-login" data-path="${isLoggedIn ? '/profile' : '/login'}" onclick="window.router.navigate('${isLoggedIn ? '/profile' : '/login'}')">
        <span class="tab-icon">${isLoggedIn ? '👤' : '🔑'}</span>
        ${isLoggedIn ? '我的' : '登入'}
      </div>
    </nav>
  `;
}

function renderLogin() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <h2 class="section-title">會員登入 / 註冊</h2>
      </div>
      <div class="section">
        <div class="card mb-4">
          <div class="mb-3">
            <label class="form-label">使用者名稱 (帳號)</label>
            <input type="text" id="auth-username" class="form-control" placeholder="請輸入您的帳號">
          </div>
          <div class="mb-4">
            <label class="form-label">密碼</label>
            <input type="password" id="auth-password" class="form-control" placeholder="至少 6 個字元">
          </div>
          <button class="btn btn-primary btn-block mb-3" onclick="window.handleLogin()">登入</button>
          <button class="btn btn-outline btn-block" onclick="window.handleRegister()">註冊</button>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

window.handleLogin = async () => {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  if(!username || !password) return alert('請填寫帳號與密碼');
  showLoading('登入中...');
  const email = username + '@lawyerapp.com';
  const res = await authService.login(email, password);
  if(res.success) {
    // 登入後同步雲端紀錄到本地
    await storage.syncHistoryFromFirestore();
    await achievementSystem.syncAchievementsFromFirestore();
    showToast('✅', '登入成功');
    router.navigate('/');
  } else {
    alert('登入失敗: ' + res.error);
    router.navigate('/login');
  }
};

window.handleRegister = async () => {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  if(!username || !password) return alert('請填寫帳號與密碼');
  showLoading('註冊中...');
  const email = username + '@lawyerapp.com';
  const res = await authService.register(email, password);
  if(res.success) {
    showToast('✅', '註冊成功');
    router.navigate('/');
  } else {
    alert('註冊失敗: ' + res.error);
    router.navigate('/login');
  }
};

window.logoutUser = async () => {
  if (confirm('確定要登出嗎？')) {
    await authService.logout();
    showToast('✅', '已登出');
    router.navigate('/');
  }
};

async function renderMistakes() {
  const appDiv = document.getElementById('app');
  
  // 先渲染載入中的骨架
  appDiv.innerHTML = `
    <div class="page">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">📓 錯題本</h2>
        <div style="width: 24px;"></div>
      </div>
      <div class="section" style="text-align:center; padding: 60px 0;">
        <div style="font-size:2rem;">⏳</div>
        <div class="text-sm text-muted mt-2">載入錯題中...</div>
      </div>
    </div>
    ${renderTabBar()}
  `;

  const mistakeRecords = storage.getMistakes();

  if (mistakeRecords.length === 0) {
    appDiv.innerHTML = `
      <div class="page stagger-children">
        <div class="section-header">
          <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
          <h2 class="section-title">📓 錯題本</h2>
          <div style="width: 24px;"></div>
        </div>
        <div class="empty-state section">
          <div class="empty-icon">🎉</div>
          <div class="empty-text">太棒了！您目前沒有任何錯題紀錄。</div>
          <button class="btn btn-primary" onclick="window.router.navigate('/custom-quiz')">去測驗</button>
        </div>
      </div>
      ${renderTabBar()}
    `;
    return;
  }

  // 根據 questionId 批次撈取完整題目資料
  const questionIds = mistakeRecords.map(m => m.questionId);
  let fullQuestions = await dataLoader.getQuestionsByIds(questionIds);
  let questionMap = new Map(fullQuestions.map(q => [q.id, q]));

  // 若批次查找結果不完整 → 嘗試從 IndexedDB 全量快取中補充
  const missingIds = questionIds.filter(id => !questionMap.has(id));
  if (missingIds.length > 0) {
    console.log(`⚠️ 錯題本: ${missingIds.length} 題在批次查詢中缺失，嘗試全量快取...`);
    try {
      const allCachedQuestions = await questionCache.getAllQuestions();
      allCachedQuestions.forEach(q => {
        if (!questionMap.has(q.id)) questionMap.set(q.id, q);
      });
      // 更新 fullQuestions
      fullQuestions = questionIds.map(id => questionMap.get(id)).filter(Boolean);
    } catch (e) {
      console.warn('全量快取補充失敗:', e);
    }
  }

  // 儲存到 window 供 retry 功能使用（只存有完整資料的題目）
  window._mistakeQuestions = fullQuestions;
  window._mistakeRecords = mistakeRecords;

  // 建立科目篩選清單
  const subjectSet = new Set(mistakeRecords.map(m => m.subject));
  const filterChips = Array.from(subjectSet).map(sid => {
    const s = SUBJECTS[sid];
    const name = s ? s.name : sid;
    const count = mistakeRecords.filter(m => m.subject === sid).length;
    return `<span class="chip mistake-filter-chip" data-subject="${sid}" onclick="window.filterMistakes('${sid}')">${name} (${count})</span>`;
  }).join('');

  const listHtml = mistakeRecords.map((m, index) => {
    const subjectMeta = SUBJECTS[m.subject];
    const subjectName = subjectMeta ? subjectMeta.name : (m.subject || '未知科目');
    const subjectIcon = subjectMeta ? subjectMeta.icon : '📝';
    const fullQ = questionMap.get(m.questionId);
    const dateStr = new Date(m.timestamp).toLocaleDateString();

    // ---- 有完整題目資料 ----
    if (fullQ) {
      const questionText = fullQ.questionText || '（題目內容未載入）';
      const truncatedText = questionText.length > 60 ? questionText.substring(0, 60) + '…' : questionText;

      // 選項 HTML
      const optionsHtml = Object.entries(fullQ.options || {}).map(([k, v]) => {
        let cls = '';
        if (k === fullQ.answer) cls = 'is-correct';
        else if (k === m.userAnswer) cls = 'is-wrong';
        return `
          <div class="mk-option ${cls}">
            <span class="mk-opt-key">${k}</span>
            <span class="mk-opt-text">${v}</span>
          </div>
        `;
      }).join('');

      // 詳解 HTML
      const exp = fullQ.explanation;
      let expHtml = '';
      if (exp && typeof exp === 'object') {
        const optAnalysis = Object.entries(exp.optionAnalysis || {}).map(([k, v]) =>
          `<div class="opt-analysis"><span class="opt-key ${fullQ.answer === k ? 'opt-correct' : ''}">${k}</span><span>${v}</span></div>`
        ).join('');
        expHtml = `
          <div class="mk-explanation">
            ${exp.coreConcept ? `<div class="exp-section"><div class="exp-label">🔑 核心概念</div><div class="exp-concept">${exp.coreConcept}</div></div>` : ''}
            ${exp.analogy ? `<div class="exp-section"><div class="exp-label">🌱 生活類比</div><div class="exp-analogy">${exp.analogy}</div></div>` : ''}
            ${exp.coreExplanation ? `<div class="exp-section"><div class="exp-label">📖 核心說明</div><div class="exp-body">${exp.coreExplanation}</div></div>` : ''}
            ${optAnalysis ? `<div class="exp-section"><div class="exp-label">📋 選項解析</div><div class="exp-options">${optAnalysis}</div></div>` : ''}
            ${exp.keyTakeaway ? `<div class="exp-section"><div class="exp-label">💡 考試口訣</div><div class="exp-takeaway">${exp.keyTakeaway}</div></div>` : ''}
            ${exp.relatedArticles ? `<div class="exp-section"><div class="exp-label">📜 相關法條</div><div class="exp-articles">${exp.relatedArticles}</div></div>` : ''}
          </div>
        `;
      } else if (exp) {
        expHtml = `<div class="mk-explanation"><div class="exp-section"><div class="exp-label">📖 詳解</div><div class="exp-body">${exp}</div></div></div>`;
      }

      return `
        <div class="mk-card animate-fade-in" data-subject="${m.subject}" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s" id="mc-${index}">
          <div class="mk-card-top" onclick="window.toggleMistake(${index})">
            <div class="mk-card-top-left">
              <span class="mk-subject-icon">${subjectIcon}</span>
              <div class="mk-card-info">
                <div class="mk-card-title">${subjectName}<span class="text-xs text-muted ml-2">${fullQ.year ? fullQ.year + '年' : ''} 第${fullQ.questionNumber || '?'}題</span></div>
                <div class="mk-card-preview">${truncatedText}</div>
              </div>
            </div>
            <div class="mk-card-top-right">
              <div class="mk-answer-badge">
                <span class="mk-badge-wrong">${m.userAnswer}</span>
                <span class="mk-badge-arrow">→</span>
                <span class="mk-badge-correct">${m.correctAnswer}</span>
              </div>
              <span class="mk-toggle" id="mt-icon-${index}">▸</span>
            </div>
          </div>

          <div class="mk-card-detail hidden" id="mc-detail-${index}">
            <div class="mk-question-text">${questionText}</div>
            <div class="mk-options">${optionsHtml}</div>
            ${expHtml}
            <div class="mk-card-actions">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.retryOneMistake(${index})">🔄 重考此題</button>
              <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); window.manualRemoveMistake('${m.questionId}', this)">🗑️ 移除</button>
            </div>
          </div>
        </div>
      `;
    }

    // ---- 無完整題目資料（fallback 簡化版） ----
    return `
      <div class="mk-card mk-card-minimal animate-fade-in" data-subject="${m.subject}" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
        <div class="mk-card-top">
          <div class="mk-card-top-left">
            <span class="mk-subject-icon">${subjectIcon}</span>
            <div class="mk-card-info">
              <div class="mk-card-title">${subjectName}</div>
              <div class="mk-card-preview text-muted">題號：${m.questionId}</div>
            </div>
          </div>
          <div class="mk-card-top-right">
            <div class="mk-answer-badge">
              <span class="mk-badge-wrong">${m.userAnswer}</span>
              <span class="mk-badge-arrow">→</span>
              <span class="mk-badge-correct">${m.correctAnswer}</span>
            </div>
            <span class="text-xs text-muted">${dateStr}</span>
          </div>
        </div>
        <div class="mk-card-actions" style="padding: 8px 16px 12px; border-top: var(--border-subtle);">
          <button class="btn btn-sm btn-outline" onclick="window.manualRemoveMistake('${m.questionId}', this)">🗑️ 移除</button>
        </div>
      </div>
    `;
  }).join('');

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">📓 錯題本</h2>
        <div style="width: 24px;"></div>
      </div>
      <div class="section">
        <div class="mistake-filter-bar mb-3">
          <span class="chip mistake-filter-chip active" data-subject="all" onclick="window.filterMistakes('all')">全部 (${mistakeRecords.length})</span>
          ${filterChips}
        </div>
        <div class="mistake-action-bar mb-4">
          <button class="btn btn-sm btn-accent" onclick="window.retryRandomMistakes()">🎲 隨機抽樣重考</button>
          <button class="btn btn-sm btn-primary" onclick="window.retryAllMistakes()">🔥 全部重考</button>
        </div>
        <div id="mistake-list">
          ${listHtml}
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

window.toggleMistake = (index) => {
  const detail = document.getElementById(`mc-detail-${index}`);
  const icon = document.getElementById(`mt-icon-${index}`);
  if (!detail) return;
  const isOpen = !detail.classList.contains('hidden');
  if (isOpen) {
    detail.classList.add('hidden');
    if (icon) icon.textContent = '▸';
  } else {
    detail.classList.remove('hidden');
    if (icon) icon.textContent = '▾';
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.retryOneMistake = (index) => {
  const q = window._mistakeQuestions?.[index];
  if (!q) return alert('找不到題目資料');
  currentQuizMeta = { year: '錯題重考', subject: q.subject };
  currentQuizEngine = new QuizEngine([q], { isMistakeRetry: true });
  router.navigate('/quiz');
};

window.retryAllMistakes = () => {
  const questions = window._mistakeQuestions;
  if (!questions || questions.length === 0) return alert('沒有錯題可以重考');
  currentQuizMeta = { year: '錯題重考', subject: '綜合' };
  currentQuizEngine = new QuizEngine(questions, { isMistakeRetry: true });
  router.navigate('/quiz');
};

// 隨機抽樣重考（預設 10 題）
window.retryRandomMistakes = () => {
  const questions = window._mistakeQuestions;
  if (!questions || questions.length === 0) return alert('沒有錯題可以重考');
  const count = Math.min(10, questions.length);
  // Fisher-Yates 洗牌後取前 N 題
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const sampled = shuffled.slice(0, count);
  currentQuizMeta = { year: '錯題重考', subject: '隨機抽樣' };
  currentQuizEngine = new QuizEngine(sampled, { isMistakeRetry: true });
  showToast('🎲', `已隨機抽取 ${count} 題錯題`);
  router.navigate('/quiz');
};

// 科目篩選錯題
window.filterMistakes = (subject) => {
  // 更新 chip 的 active 狀態
  document.querySelectorAll('.mistake-filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.subject === subject);
  });
  // 篩選顯示
  document.querySelectorAll('#mistake-list .mk-card').forEach(card => {
    if (subject === 'all' || card.dataset.subject === subject) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
};

// 手動從錯題本移除
window.manualRemoveMistake = (questionId, btn) => {
  if (!confirm('確定要從錯題本移除此題嗎？')) return;
  storage.removeMistake(questionId);
  showToast('✅', '已從錯題本移除');
  // 淡出該卡片
  const card = btn.closest('.mk-card');
  if (card) {
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(50px)';
    setTimeout(() => card.remove(), 300);
  }
};



function renderSearch() {
  const appDiv = document.getElementById('app');

  // 最近搜尋紀錄
  const recentSearches = JSON.parse(localStorage.getItem('lawyer_search_history') || '[]');
  const recentHtml = recentSearches.length > 0
    ? `<div class="search-recent mb-4">
        <div class="search-recent-label text-xs text-muted mb-2">最近搜尋</div>
        <div class="search-recent-chips">
          ${recentSearches.map(k => `<span class="chip search-recent-chip" onclick="window.handleSearch('${k.replace(/'/g, "\\'")}')">${k}</span>`).join('')}
          <span class="chip search-clear-chip" onclick="window.clearSearchHistory()">✕ 清除</span>
        </div>
      </div>`
    : '';

  // 科目篩選 chips
  const subjectChips = Object.entries(SUBJECTS).map(([id, s]) =>
    `<label class="chip search-subject-chip"><input type="checkbox" class="search-sub-cb" value="${id}" checked hidden>${s.icon} ${s.name}</label>`
  ).join('');

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">🔍 試題搜尋</h2>
        <div style="width: 24px;"></div>
      </div>
      <div class="section">
        <div class="search-bar mb-3">
          <input type="text" id="search-input" class="form-control search-input" placeholder="輸入法條、關鍵字或法律概念..." autocomplete="off">
          <button class="btn btn-primary search-btn" id="search-btn" onclick="window.handleSearch()">搜尋</button>
        </div>

        ${recentHtml}

        <details class="search-filter-details mb-3">
          <summary class="text-xs text-muted" style="cursor:pointer; user-select:none;">⚙️ 進階篩選（科目 / 年份）</summary>
          <div class="search-filter-panel mt-2">
            <div class="search-filter-section mb-2">
              <div class="text-xs text-muted mb-1">科目篩選</div>
              <div class="search-filter-chips">${subjectChips}</div>
            </div>
            <div class="search-filter-section">
              <div class="text-xs text-muted mb-1">年份篩選</div>
              <div class="search-filter-chips">
                <label class="chip search-year-chip"><input type="checkbox" class="search-year-cb" value="113" checked hidden>113年</label>
                <label class="chip search-year-chip"><input type="checkbox" class="search-year-cb" value="112" checked hidden>112年</label>
                <label class="chip search-year-chip"><input type="checkbox" class="search-year-cb" value="111" checked hidden>111年</label>
              </div>
            </div>
          </div>
        </details>

        <div id="search-results">
          <div class="search-empty-state">
            <div class="search-empty-icon">🔎</div>
            <div class="search-empty-text">輸入法條、法律概念或關鍵字以搜尋歷屆試題</div>
            <div class="search-empty-examples text-xs text-muted mt-2">
              例如：「善意取得」「違憲審查」「票據法第14條」「強制執行」
            </div>
          </div>
        </div>
      </div>
    </div>
    ${renderTabBar()}
  `;

  // Enter 鍵觸發搜尋
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') window.handleSearch();
  });

  // 科目 chip 切換
  document.querySelectorAll('.search-subject-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cb = chip.querySelector('input');
      cb.checked = !cb.checked;
      chip.classList.toggle('active', cb.checked);
    });
    chip.classList.add('active'); // 預設全選
  });

  // 年份 chip 切換
  document.querySelectorAll('.search-year-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cb = chip.querySelector('input');
      cb.checked = !cb.checked;
      chip.classList.toggle('active', cb.checked);
    });
    chip.classList.add('active');
  });
}

// 關鍵字高亮
function highlightKeyword(text, keyword) {
  if (!text || !keyword) return text || '';
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

window.handleSearch = async (prefillKeyword) => {
  const input = document.getElementById('search-input');
  const keyword = prefillKeyword || input.value.trim();
  if (!keyword) return;

  // 更新 input
  if (prefillKeyword) input.value = prefillKeyword;

  // 儲存搜尋紀錄
  let history = JSON.parse(localStorage.getItem('lawyer_search_history') || '[]');
  history = [keyword, ...history.filter(k => k !== keyword)].slice(0, 8);
  localStorage.setItem('lawyer_search_history', JSON.stringify(history));

  // 取得篩選條件
  const selectedSubjects = Array.from(document.querySelectorAll('.search-sub-cb:checked')).map(cb => cb.value);
  const selectedYears = Array.from(document.querySelectorAll('.search-year-cb:checked')).map(cb => Number(cb.value));

  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '<div class="search-loading"><div class="search-loading-icon">⏳</div><div class="text-sm text-muted">搜尋中...</div></div>';

  const allResults = await dataLoader.searchQuestions(keyword);

  // 篩選科目 + 年份
  const results = allResults.filter(q => {
    const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(q.subject);
    const yearMatch = selectedYears.length === 0 || selectedYears.includes(Number(q.year));
    return subjectMatch && yearMatch;
  });

  if (results.length === 0) {
    resultsDiv.innerHTML = `
      <div class="search-empty-state">
        <div class="search-empty-icon">😔</div>
        <div class="search-empty-text">找不到包含「${keyword}」的題目</div>
        <div class="text-xs text-muted mt-2">試試其他關鍵字，或調整篩選條件</div>
      </div>
    `;
    return;
  }

  // 統計分布
  const subjectCount = {};
  const yearCount = {};
  results.forEach(q => {
    const sn = SUBJECTS[q.subject] ? SUBJECTS[q.subject].name : q.subject;
    subjectCount[sn] = (subjectCount[sn] || 0) + 1;
    if (q.year) yearCount[q.year] = (yearCount[q.year] || 0) + 1;
  });

  const statsChips = Object.entries(subjectCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<span class="chip chip-stats">${name} ${count}</span>`)
    .join('');

  const yearChips = Object.entries(yearCount)
    .sort((a, b) => b[0] - a[0])
    .map(([year, count]) => `<span class="chip chip-stats chip-year">${year}年 ${count}</span>`)
    .join('');

  // 結果卡片
  const listHtml = results.map((q, index) => {
    const subjectMeta = SUBJECTS[q.subject];
    const subjectName = subjectMeta ? subjectMeta.name : q.subject;
    const subjectIcon = subjectMeta ? subjectMeta.icon : '📝';
    const qText = highlightKeyword(q.questionText || '', keyword);
    const truncText = (q.questionText || '').length > 80
      ? highlightKeyword(q.questionText.substring(0, 80), keyword) + '…'
      : qText;

    const optionsHtml = Object.entries(q.options || {}).map(([k, v]) => {
      const isAnswer = k === (q.answer || q.correctAnswer);
      return `
        <div class="sr-option ${isAnswer ? 'is-answer' : ''}">
          <span class="sr-opt-key ${isAnswer ? 'is-answer' : ''}">${k}</span>
          <span class="sr-opt-text">${highlightKeyword(v, keyword)}</span>
        </div>
      `;
    }).join('');

    // 詳解 (簡化版)
    const exp = q.explanation;
    let expHtml = '';
    if (exp && typeof exp === 'object') {
      expHtml = `<div class="sr-explanation">
        ${exp.coreConcept ? `<div class="exp-section"><div class="exp-label">🔑 核心概念</div><div class="exp-body">${highlightKeyword(exp.coreConcept, keyword)}</div></div>` : ''}
        ${exp.coreExplanation ? `<div class="exp-section"><div class="exp-label">📖 說明</div><div class="exp-body">${highlightKeyword(exp.coreExplanation, keyword)}</div></div>` : ''}
        ${exp.keyTakeaway ? `<div class="exp-section"><div class="exp-label">💡 口訣</div><div class="exp-body">${highlightKeyword(exp.keyTakeaway, keyword)}</div></div>` : ''}
        ${exp.relatedArticles ? `<div class="exp-section"><div class="exp-label">📜 法條</div><div class="exp-body">${highlightKeyword(exp.relatedArticles, keyword)}</div></div>` : ''}
      </div>`;
    } else if (exp) {
      expHtml = `<div class="sr-explanation"><div class="exp-section"><div class="exp-label">📖 詳解</div><div class="exp-body">${highlightKeyword(String(exp), keyword)}</div></div></div>`;
    }

    return `
      <div class="sr-card animate-fade-in" style="animation-delay: ${Math.min(index * 0.04, 0.4)}s" id="sr-${index}">
        <div class="sr-card-top" onclick="window.toggleSearchResult(${index})">
          <div class="sr-card-left">
            <span class="sr-icon">${subjectIcon}</span>
            <div class="sr-card-info">
              <div class="sr-card-title">${subjectName} <span class="text-xs text-muted">${q.year ? q.year + '年' : ''} 第${q.questionNumber || '?'}題</span></div>
              <div class="sr-card-preview">${truncText}</div>
            </div>
          </div>
          <div class="sr-card-right">
            <span class="sr-answer-chip">答：${q.answer || q.correctAnswer || '?'}</span>
            <span class="sr-toggle" id="sr-icon-${index}">▸</span>
          </div>
        </div>
        <div class="sr-detail hidden" id="sr-detail-${index}">
          <div class="sr-question-text">${qText}</div>
          <div class="sr-options">${optionsHtml}</div>
          ${expHtml}
        </div>
      </div>
    `;
  }).join('');

  resultsDiv.innerHTML = `
    <div class="search-stats mb-3">
      <div class="search-stats-summary">
        <span class="search-stats-count">找到 <strong>${results.length}</strong> 題</span>
        <span class="text-xs text-muted">（共 ${allResults.length} 題符合，已篩選）</span>
      </div>
      <div class="search-stats-chips mt-2">${statsChips}${yearChips}</div>
    </div>
    <div class="sr-list">${listHtml}</div>
  `;
};

window.toggleSearchResult = (index) => {
  const detail = document.getElementById(`sr-detail-${index}`);
  const icon = document.getElementById(`sr-icon-${index}`);
  if (!detail) return;
  const isOpen = !detail.classList.contains('hidden');
  if (isOpen) {
    detail.classList.add('hidden');
    if (icon) icon.textContent = '▸';
  } else {
    detail.classList.remove('hidden');
    if (icon) icon.textContent = '▾';
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.clearSearchHistory = () => {
  localStorage.removeItem('lawyer_search_history');
  const recentDiv = document.querySelector('.search-recent');
  if (recentDiv) recentDiv.remove();
};

function renderCustomQuiz() {
  const appDiv = document.getElementById('app');

  const subjectCheckboxes = Object.entries(SUBJECTS).map(([id, s]) => `
    <label class="form-check mb-2" style="display: block;">
      <input type="checkbox" class="subject-cb" value="${id}" checked>
      <span style="margin-left: 8px;">${s.icon} ${s.name}</span>
    </label>
  `).join('');

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">⚙️ 自訂測驗</h2>
        <div style="width: 24px;"></div>
      </div>
      <div class="section">
        <div class="card mb-4">
          <h3 class="mb-3">1. 選擇科目</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${subjectCheckboxes}
          </div>
        </div>

        <div class="card mb-4">
          <h3 class="mb-3">2. 測驗設定</h3>
          <div class="mb-3">
            <label class="form-label">測驗題數</label>
            <input type="number" id="custom-count" class="form-control" value="10" min="1" max="50">
          </div>
          <label class="form-check">
            <input type="checkbox" id="custom-exclude" checked>
            <span style="margin-left: 8px;">優先避開已答對的題目</span>
          </label>
          <p class="text-sm text-muted mt-2">系統會根據您的錯題本自動增加錯題與未作答題目的出現機率。</p>
        </div>

        <button class="btn btn-primary btn-block" onclick="window.startCustomQuiz()">開始自訂測驗</button>
      </div>
    </div>
    ${renderTabBar()}
  `;
}

window.startCustomQuiz = async () => {
  const checkboxes = document.querySelectorAll('.subject-cb:checked');
  const subjects = Array.from(checkboxes).map(cb => cb.value);
  const count = parseInt(document.getElementById('custom-count').value, 10);
  const excludeCorrect = document.getElementById('custom-exclude').checked;

  if (subjects.length === 0) return alert('請至少選擇一個科目');
  if (isNaN(count) || count < 1) return alert('請輸入有效的題數');

  showLoading('配卷中...');
  const questions = await dataLoader.getCustomQuizQuestions(subjects, count, excludeCorrect);

  if (questions.length === 0) {
    alert('找不到符合條件的題目');
    router.navigate('/custom-quiz');
    return;
  }

  currentQuizMeta = { year: '自訂', subject: '綜合' };
  currentQuizEngine = new QuizEngine(questions);
  router.navigate('/quiz');
};

// 確認從錯題本移除（測驗頁面用）
window.confirmRemoveMistake = (questionId, btn) => {
  storage.removeMistake(questionId);
  const container = btn.closest('.mistake-remove-confirm');
  if (container) {
    container.innerHTML = '<div class="text-sm text-success" style="padding:8px 0">✅ 已從錯題本移除</div>';
  }
  showToast('✅', '已從錯題本移除');
};

// ---- 個人檔案頁面 ----
function renderProfile() {
  const appDiv = document.getElementById('app');
  const user = window.currentUser;

  if (!user) {
    router.navigate('/login');
    return;
  }

  const history = storage.getAllHistory();
  const overview = storage.getOverviewStats() || {};
  const streak = achievementSystem.calculateStreak(history);
  const calendar = achievementSystem.getActivityCalendar(91); // 13 weeks
  const unlockedIds = achievementSystem.getUnlockedAchievements();
  const username = (user.email || '').replace('@lawyerapp.com', '') || '考生';

  // Streak 火焰等級
  let streakIcon = '';
  let streakLabel = '';
  let streakClass = '';
  if (streak >= 30) { streakIcon = '💎'; streakLabel = '傳說級'; streakClass = 'streak-legendary'; }
  else if (streak >= 14) { streakIcon = '🔥🔥🔥'; streakLabel = '極致燃燒'; streakClass = 'streak-blazing'; }
  else if (streak >= 7) { streakIcon = '🔥🔥'; streakLabel = '火力全開'; streakClass = 'streak-hot'; }
  else if (streak >= 3) { streakIcon = '🔥'; streakLabel = '連續打火'; streakClass = 'streak-warm'; }
  else if (streak >= 1) { streakIcon = '✨'; streakLabel = '今日已練'; streakClass = 'streak-spark'; }
  else { streakIcon = '❄️'; streakLabel = '今日尚未練習'; streakClass = 'streak-cold'; }

  // 日曆 HTML (GitHub-style contribution grid)
  const calDates = Object.keys(calendar).sort();
  const maxCount = Math.max(...Object.values(calendar), 1);

  // 按週分組 (7 天一列)
  const weeks = [];
  for (let i = calDates.length - 1; i >= 0; i -= 7) {
    const week = [];
    for (let j = Math.min(6, i); j >= Math.max(0, i - 6); j--) {
      week.unshift(calDates[j]);
    }
    weeks.unshift(week);
  }

  const calGridHtml = calDates.map(date => {
    const count = calendar[date];
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 5) level = 2;
    if (count >= 15) level = 3;
    if (count >= 30) level = 4;
    const tooltip = `${date.substring(5)} — ${count} 題`;
    return `<div class="cal-cell cal-level-${level}" title="${tooltip}"></div>`;
  }).join('');

  // 月份標籤
  const months = [];
  let lastMonth = '';
  calDates.forEach((d, i) => {
    const m = d.substring(5, 7);
    if (m !== lastMonth) {
      months.push({ index: i, label: `${parseInt(m)}月` });
      lastMonth = m;
    }
  });
  const monthLabelsHtml = months.map(m =>
    `<span class="cal-month-label" style="grid-column: ${Math.floor(m.index / 7) + 1}">${m.label}</span>`
  ).join('');

  // 成就展示
  const achievementsHtml = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlockedIds.includes(ach.id);
    return `
      <div class="profile-ach ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="profile-ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="profile-ach-info">
          <div class="profile-ach-name">${ach.name}</div>
          <div class="profile-ach-desc">${ach.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  // 概覽統計卡片
  const statsCards = [
    { icon: '📝', label: '總做題', value: overview.totalAttempted || 0 },
    { icon: '✅', label: '正確率', value: overview.overallAccuracy ? overview.overallAccuracy.toFixed(1) + '%' : '0%' },
    { icon: '📚', label: '涉獵科目', value: overview.subjectsCovered || 0 },
    { icon: '📅', label: '練習天數', value: overview.daysActive || 0 },
    { icon: '❌', label: '錯題數', value: overview.mistakeCount || 0 },
    { icon: '🧩', label: '不重複題', value: overview.uniqueQuestions || 0 },
  ];

  const statsHtml = statsCards.map(s =>
    `<div class="profile-stat-card"><div class="profile-stat-icon">${s.icon}</div><div class="profile-stat-value">${s.value}</div><div class="profile-stat-label">${s.label}</div></div>`
  ).join('');

  appDiv.innerHTML = `
    <div class="page stagger-children">
      <div class="section-header">
        <div class="quiz-back" onclick="window.router.navigate('/')">←</div>
        <h2 class="section-title">👤 個人檔案</h2>
        <div style="width: 24px;"></div>
      </div>

      <!-- 用戶資訊 + Streak -->
      <div class="profile-header section">
        <div class="profile-avatar">${username.charAt(0).toUpperCase()}</div>
        <div class="profile-username">${username}</div>
        <div class="profile-streak ${streakClass}">
          <span class="streak-fire">${streakIcon}</span>
          <span class="streak-count">${streak}</span>
          <span class="streak-label">天連勝 · ${streakLabel}</span>
        </div>
      </div>

      <!-- 概覽統計 -->
      <div class="section">
        <h3 class="section-subtitle">📊 學習概覽</h3>
        <div class="profile-stats-grid">${statsHtml}</div>
      </div>

      <!-- 活動日曆 -->
      <div class="section">
        <h3 class="section-subtitle">🗓️ 每日練習紀錄</h3>
        <div class="cal-legend-bar mb-2">
          <span class="text-xs text-muted">過去 90 天</span>
          <div class="cal-legend">
            <span class="text-xs text-muted">少</span>
            <div class="cal-cell cal-level-0 cal-legend-cell"></div>
            <div class="cal-cell cal-level-1 cal-legend-cell"></div>
            <div class="cal-cell cal-level-2 cal-legend-cell"></div>
            <div class="cal-cell cal-level-3 cal-legend-cell"></div>
            <div class="cal-cell cal-level-4 cal-legend-cell"></div>
            <span class="text-xs text-muted">多</span>
          </div>
        </div>
        <div class="cal-container">
          <div class="cal-grid">${calGridHtml}</div>
        </div>
      </div>

      <!-- 成就牆 -->
      <div class="section">
        <h3 class="section-subtitle">🏅 成就牆 <span class="text-xs text-muted">(${unlockedIds.length}/${ACHIEVEMENTS.length})</span></h3>
        <div class="profile-ach-grid">${achievementsHtml}</div>
      </div>

      <!-- 操作 -->
      <div class="section">
        <button class="btn btn-outline btn-block" onclick="window.logoutUser()">🚪 登出帳號</button>
      </div>
    </div>
    ${renderTabBar()}
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
router.addRoute('/login', renderLogin);
router.addRoute('/profile', renderProfile);
router.addRoute('/mistakes', renderMistakes);
router.addRoute('/search', renderSearch);
router.addRoute('/custom-quiz', renderCustomQuiz);

// 初始載入 — 先同步題庫再載入頁面
document.addEventListener('DOMContentLoaded', async () => {
  // 顯示同步提示
  const loadingDiv = document.getElementById('app');
  if (loadingDiv) {
    loadingDiv.innerHTML = `
      <div class="loading-screen">
        <div class="loading-icon">⚖️</div>
        <div class="loading-text">同步題庫中...</div>
      </div>
    `;
  }

  try {
    const syncResult = await dataLoader.syncFromFirebase();
    if (syncResult.fromCache) {
      console.log(`📦 使用本地快取 (${syncResult.count} 題)`);
    } else if (syncResult.synced) {
      console.log(`☁️ 已從 Firebase 同步 (${syncResult.count} 題)`);
    }
  } catch (e) {
    console.warn('題庫同步失敗，將使用 Firestore 即時查詢:', e);
  }

  router.loadRoute(window.location.pathname);
});
