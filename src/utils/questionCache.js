/**
 * questionCache.js — IndexedDB 快取管理模組
 * 
 * 將 Firebase 題庫快取至 IndexedDB，實現：
 * 1. 離線存取（無網路也能練習）
 * 2. 版本比對（只在題庫更新時重新下載）
 * 3. 極速載入（本地讀取比 Firestore query 快 10x+）
 */

const DB_NAME = 'LawyerExamDB';
const DB_VERSION = 1;
const QUESTIONS_STORE = 'questions';
const META_STORE = 'meta';

let dbInstance = null;

/**
 * 初始化 / 取得 IndexedDB 連線
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // 題目 store，以 question.id 為 key
      if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
        const store = db.createObjectStore(QUESTIONS_STORE, { keyPath: 'id' });
        store.createIndex('subject', 'subject', { unique: false });
        store.createIndex('year', 'year', { unique: false });
        store.createIndex('year_subject', ['year', 'subject'], { unique: false });
      }
      // 元資料 store（存版本號等）
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB 開啟失敗:', event.target.error);
      reject(event.target.error);
    };
  });
}

export const questionCache = {
  /**
   * 取得本地快取的版本號
   * @returns {Promise<number|null>}
   */
  async getLocalVersion() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(META_STORE, 'readonly');
        const store = tx.objectStore(META_STORE);
        const request = store.get('syncVersion');
        request.onsuccess = () => {
          resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * 設定本地版本號
   * @param {number} version
   */
  async setLocalVersion(version) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(META_STORE, 'readwrite');
        const store = tx.objectStore(META_STORE);
        store.put({ key: 'syncVersion', value: version });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('設定版本號失敗:', e);
      return false;
    }
  },

  /**
   * 批次儲存題目到 IndexedDB
   * @param {Array} questions - 題目陣列
   */
  async saveQuestions(questions) {
    if (!questions || questions.length === 0) return false;
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readwrite');
        const store = tx.objectStore(QUESTIONS_STORE);

        // 先清空舊資料再寫入（全量替換策略）
        store.clear();
        
        for (const q of questions) {
          if (q.id) {
            store.put(q);
          }
        }

        tx.oncomplete = () => {
          console.log(`✅ IndexedDB 已快取 ${questions.length} 題`);
          resolve(true);
        };
        tx.onerror = () => {
          console.error('IndexedDB 寫入失敗:', tx.error);
          reject(tx.error);
        };
      });
    } catch (e) {
      console.error('儲存題目至 IndexedDB 失敗:', e);
      return false;
    }
  },

  /**
   * 讀取全部本地快取題目
   * @returns {Promise<Array>}
   */
  async getAllQuestions() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readonly');
        const store = tx.objectStore(QUESTIONS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * 按科目讀取本地題目
   * @param {string} subject
   * @returns {Promise<Array>}
   */
  async getQuestionsBySubject(subject) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readonly');
        const store = tx.objectStore(QUESTIONS_STORE);
        const index = store.index('subject');
        const request = index.getAll(subject);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * 按年份 + 科目讀取本地題目
   * @param {number} year
   * @param {string} subject
   * @returns {Promise<Array>}
   */
  async getQuestionsByYearAndSubject(year, subject) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readonly');
        const store = tx.objectStore(QUESTIONS_STORE);
        const index = store.index('year_subject');
        const request = index.getAll([Number(year), subject]);
        request.onsuccess = () => {
          let results = request.result || [];
          // Fallback: 如果複合索引沒資料，用 subject 索引 + client-side filter
          if (results.length === 0) {
            const subjectIndex = store.index('subject');
            const fallbackReq = subjectIndex.getAll(subject);
            fallbackReq.onsuccess = () => {
              const all = fallbackReq.result || [];
              results = all.filter(q => 
                q.year === Number(year) || 
                (q.id && q.id.startsWith(String(year) + '-'))
              );
              results.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
              resolve(results);
            };
            fallbackReq.onerror = () => resolve([]);
          } else {
            results.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
            resolve(results);
          }
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * 按 ID 陣列讀取題目
   * @param {Array<string>} ids
   * @returns {Promise<Array>}
   */
  async getQuestionsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readonly');
        const store = tx.objectStore(QUESTIONS_STORE);
        const results = [];
        let pending = ids.length;

        for (const id of ids) {
          const request = store.get(id);
          request.onsuccess = () => {
            if (request.result) results.push(request.result);
            if (--pending === 0) {
              // 維持原始 ID 順序
              const idMap = new Map(results.map(q => [q.id, q]));
              resolve(ids.map(id => idMap.get(id)).filter(Boolean));
            }
          };
          request.onerror = () => {
            if (--pending === 0) resolve(results);
          };
        }
      });
    } catch {
      return [];
    }
  },

  /**
   * 取得本地快取的題目總數
   * @returns {Promise<number>}
   */
  async getQuestionCount() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(QUESTIONS_STORE, 'readonly');
        const store = tx.objectStore(QUESTIONS_STORE);
        const request = store.count();
        request.onsuccess = () => resolve(request.result || 0);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }
};
