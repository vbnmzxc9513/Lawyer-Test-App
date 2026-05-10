import { db } from '../core/firebase.js';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { storage } from './storage.js';
import { questionCache } from './questionCache.js';

/**
 * 從 Firestore 載入題目資料
 * 
 * 同步策略：
 * 1. 啟動時檢查 Firestore metadata/questionsVersion 的版本號
 * 2. 若與本地 IndexedDB 版本一致 → 直接用快取
 * 3. 若不同 → 全量拉取 Firestore questions → 存入 IndexedDB
 * 4. runtime Map 作為第一層記憶體快取（同一 session 內最快）
 */
export const dataLoader = {
  cache: new Map(),
  _syncDone: false,

  /**
   * 同步 Firebase 題庫到本地 IndexedDB
   * 應用啟動時呼叫一次
   * @returns {{ synced: boolean, count: number, fromCache: boolean }}
   */
  async syncFromFirebase() {
    try {
      // 1. 讀取 Firestore 上的版本號
      let remoteVersion = null;
      try {
        const metaRef = doc(db, 'metadata', 'questionsVersion');
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
          remoteVersion = metaSnap.data().version || null;
        }
      } catch (e) {
        console.warn('無法讀取版本號 metadata，將直接拉取題目:', e.message);
      }

      // 2. 比較本地版本
      const localVersion = await questionCache.getLocalVersion();
      const localCount = await questionCache.getQuestionCount();

      if (remoteVersion && localVersion === remoteVersion && localCount > 0) {
        console.log(`✅ 題庫版本一致 (v${remoteVersion})，使用本地快取 (${localCount} 題)`);
        this._syncDone = true;
        return { synced: true, count: localCount, fromCache: true };
      }

      // 3. 版本不同或無快取 → 全量拉取
      console.log(`🔄 開始同步題庫... (遠端: v${remoteVersion}, 本地: v${localVersion}, 本地題數: ${localCount})`);
      const q = query(collection(db, 'questions'));
      const snap = await getDocs(q);
      const allQuestions = snap.docs.map(d => d.data());

      if (allQuestions.length === 0) {
        console.warn('⚠️ Firestore 沒有題目資料');
        this._syncDone = true;
        return { synced: false, count: 0, fromCache: false };
      }

      // 4. 存入 IndexedDB
      await questionCache.saveQuestions(allQuestions);
      
      // 5. 更新本地版本號
      const versionToSave = remoteVersion || Date.now();
      await questionCache.setLocalVersion(versionToSave);

      console.log(`✅ 題庫同步完成！共 ${allQuestions.length} 題 (v${versionToSave})`);
      this._syncDone = true;

      // 清除 runtime cache 以確保一致性
      this.cache.clear();

      return { synced: true, count: allQuestions.length, fromCache: false };
    } catch (e) {
      console.error('題庫同步失敗:', e);
      // 同步失敗但本地有快取，仍可使用
      const fallbackCount = await questionCache.getQuestionCount();
      if (fallbackCount > 0) {
        console.log(`⚠️ 同步失敗但本地有 ${fallbackCount} 題快取可用`);
        this._syncDone = true;
        return { synced: true, count: fallbackCount, fromCache: true };
      }
      this._syncDone = true;
      return { synced: false, count: 0, fromCache: false };
    }
  },

  /** 取得特定科目所有年份題目 */
  async getQuestionsBySubject(subjectId) {
    const key = `subject_${subjectId}`;
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      // 優先從 IndexedDB 讀取
      let questions = await questionCache.getQuestionsBySubject(subjectId);
      
      // IndexedDB 沒有 → fallback 到 Firestore
      if (questions.length === 0) {
        const q = query(collection(db, 'questions'), where('subject', '==', subjectId));
        const snap = await getDocs(q);
        questions = snap.docs.map(d => d.data());
      }

      if (questions.length === 0) return this._getMockQuestions(subjectId);

      this.cache.set(key, questions);
      return questions;
    } catch (e) {
      console.error('載入題目失敗:', e);
      // 嘗試 IndexedDB fallback
      const cached = await questionCache.getQuestionsBySubject(subjectId);
      if (cached.length > 0) return cached;
      return this._getMockQuestions(subjectId);
    }
  },

  /** 取得特定年份 + 科目的題目（支援複合查詢 + id前綴 fallback） */
  async getQuestionsByYearAndSubject(year, subjectId) {
    const key = `y${year}_s${subjectId}`;
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      // 優先從 IndexedDB 讀取
      let questions = await questionCache.getQuestionsByYearAndSubject(year, subjectId);

      // IndexedDB 沒有 → fallback 到 Firestore
      if (questions.length === 0) {
        const q = query(
          collection(db, 'questions'),
          where('subject', '==', subjectId),
          where('year', '==', Number(year))
        );
        const snap = await getDocs(q);
        questions = snap.docs.map(d => d.data());

        // Fallback：若 year 欄位不存在，用 id 前綴過濾
        if (questions.length === 0) {
          const all = await this.getQuestionsBySubject(subjectId);
          questions = all.filter(q => q.id && q.id.startsWith(String(year) + '-'));
        }
      }

      questions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
      this.cache.set(key, questions);
      return questions;
    } catch (e) {
      console.warn('複合查詢失敗，改用 client-side 過濾:', e.message);
      const all = await this.getQuestionsBySubject(subjectId);
      const questions = all
        .filter(q => q.id && q.id.startsWith(String(year) + '-'))
        .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
      this.cache.set(key, questions);
      return questions;
    }
  },

  /** 取得特定觀念 Tag 的題目 */
  async getQuestionsByTag(tag) {
    try {
      // 優先從 IndexedDB 全量快取中篩選
      const all = await questionCache.getAllQuestions();
      if (all.length > 0) {
        return all.filter(q => q.tags && q.tags.includes(tag));
      }
      // Fallback 到 Firestore
      const q = query(collection(db, 'questions'), where('tags', 'array-contains', tag));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error('載入觀念題目失敗:', e);
      return [];
    }
  },

  async getAllTags() {
    return ['言論自由', '權力分立', '基本國策', '違憲審查', '平等權'];
  },

  /**
   * 根據 questionId 陣列批次查詢完整題目資料
   * 優先從 cache 取，若 cache 有任意該科目資料就可以直接過濾
   */
  async getQuestionsByIds(questionIds) {
    if (!questionIds || questionIds.length === 0) return [];
    
    // 先嘗試從 runtime cache 撈取
    const allCached = [];
    this.cache.forEach((questions) => {
      allCached.push(...questions);
    });
    
    const cachedMap = new Map(allCached.map(q => [q.id, q]));
    const foundFromCache = [];
    const missingIds = [];
    
    for (const id of questionIds) {
      if (cachedMap.has(id)) {
        foundFromCache.push(cachedMap.get(id));
      } else {
        missingIds.push(id);
      }
    }
    
    // 嘗試從 IndexedDB 補齊
    if (missingIds.length > 0) {
      const fromIDB = await questionCache.getQuestionsByIds(missingIds);
      fromIDB.forEach(q => {
        cachedMap.set(q.id, q);
        foundFromCache.push(q);
      });

      // 再檢查還缺什麼
      const stillMissing = missingIds.filter(id => !cachedMap.has(id));
      
      // 最後 fallback 到 Firestore
      if (stillMissing.length > 0) {
        try {
          const snap = await getDocs(query(collection(db, 'questions')));
          snap.docs.forEach(d => {
            const data = d.data();
            if (!cachedMap.has(data.id)) {
              cachedMap.set(data.id, data);
            }
          });
          for (const id of stillMissing) {
            if (cachedMap.has(id)) {
              foundFromCache.push(cachedMap.get(id));
            }
          }
        } catch (e) {
          console.error('批次查詢題目失敗:', e);
        }
      }
    }
    
    // 維持原本 questionIds 的順序回傳
    const idToQ = new Map(foundFromCache.map(q => [q.id, q]));
    return questionIds.map(id => idToQ.get(id)).filter(Boolean);
  },

  /** 關鍵字搜尋歷屆試題（搜尋題目、選項、詳解） */
  async searchQuestions(keyword) {
    if (!keyword || keyword.trim() === '') return [];
    try {
      // 優先從 IndexedDB 搜尋（離線也能搜）
      let allQuestions = await questionCache.getAllQuestions();
      
      // IndexedDB 沒資料 → 從 Firestore 拉
      if (allQuestions.length === 0) {
        const q = query(collection(db, 'questions'));
        const snap = await getDocs(q);
        allQuestions = snap.docs.map(d => d.data());
      }
      
      const lowerKeyword = keyword.toLowerCase();
      return allQuestions.filter(q => {
        // 比對題目文字
        const matchText = q.questionText && q.questionText.toLowerCase().includes(lowerKeyword);
        // 比對選項
        const matchOptions = q.options && Object.values(q.options).some(opt => opt.toLowerCase().includes(lowerKeyword));
        // 比對詳解
        let matchExp = false;
        if (q.explanation) {
          if (typeof q.explanation === 'string') {
            matchExp = q.explanation.toLowerCase().includes(lowerKeyword);
          } else if (typeof q.explanation === 'object') {
            const exp = q.explanation;
            matchExp = [exp.coreConcept, exp.coreExplanation, exp.keyTakeaway, exp.relatedArticles, exp.analogy]
              .filter(Boolean)
              .some(t => t.toLowerCase().includes(lowerKeyword));
          }
        }
        return matchText || matchOptions || matchExp;
      });
    } catch (e) {
      console.error('搜尋題目失敗:', e);
      return [];
    }
  },

  /** 產生自訂測驗題目 (考量錯題與是否排除已答對) */
  async getCustomQuizQuestions(subjects, count, excludeCorrect) {
    if (!subjects || subjects.length === 0) return [];
    try {
      let pool = [];
      for (const subjectId of subjects) {
        const subQuestions = await this.getQuestionsBySubject(subjectId);
        pool = pool.concat(subQuestions);
      }

      const history = storage.getAllHistory();
      const correctIds = new Set(history.filter(h => h.isCorrect).map(h => h.questionId));
      const wrongIds = new Set(history.filter(h => !h.isCorrect).map(h => h.questionId));

      if (excludeCorrect) {
        pool = pool.filter(q => !correctIds.has(q.id));
      }

      // 權重抽題邏輯：錯題優先，其次為未作答，最後是已答對
      let weightedPool = pool.map(q => {
        let weight = 1;
        if (wrongIds.has(q.id)) weight = 10; // 錯題高權重
        else if (!correctIds.has(q.id)) weight = 5; // 未作答中等權重
        return { question: q, weight, sortKey: Math.random() * weight };
      });

      // 依照 sortKey 降冪排序 (權重越大，sortKey 平均越大)
      weightedPool.sort((a, b) => b.sortKey - a.sortKey);

      return weightedPool.slice(0, count).map(w => w.question);
    } catch (e) {
      console.error('產生自訂測驗失敗:', e);
      return [];
    }
  },

  _getMockQuestions(subjectId) {
    return [{
      id: 'mock-1', subject: subjectId, questionNumber: 1,
      questionText: `這是關於 ${subjectId} 的測試題目。`,
      options: { A: '選項A', B: '選項B（正確）', C: '選項C', D: '選項D' },
      answer: 'B', tags: ['測試']
    }];
  }
};
