# 司律一試考古題年度新增 Skill

## 概述
本 Skill 定義了「新增一個年度的司律一試考古題到系統」的完整 End-to-End 流程。  
當使用者說「幫我新增 114 年的題目」時，嚴格按照以下步驟執行。

---

## 系統架構

```
考選部官網 (PDF)
    ↓ download.js
scraper/pdfs/{year}/
    ↓ parse.js → prompts → AI 解析 → ai_results/
scraper/data/{year}_complete.json
    ↓ upload_to_firestore.js
Firestore (questions collection)
    ↓ 自動同步
Web App (IndexedDB → UI)
```

### 關鍵路徑
| 位置 | 說明 |
|------|------|
| `D:\AI_Project\Lawyer_test_first\scraper\` | 所有資料處理腳本 |
| `scraper/serviceAccountKey.json` | Firebase Admin SDK 憑證 |
| `scraper/exam-registry.json` | 考試年度/代碼/試卷 Registry |
| `scraper/data/{year}_complete.json` | 年度完整題庫 JSON |
| `src/main.js` L228 | Web 年度選擇器（寫死的年份陣列） |
| `src/utils/dataLoader.js` | 從 Firestore/IndexedDB 讀取題目 |

---

## 步驟一：註冊年度

**檔案：** `scraper/exam-registry.json`

新增一筆 entry 到 `exams` 陣列：

```json
{
  "rocYear": 114,
  "adYear": 2025,
  "examCode": "114110",
  "format": "new",
  "papers": [
    { "code": "301", "subjects": ["0101"], "name": "綜合法學(一)-憲法、行政法、國際公法、國際私法" },
    { "code": "302", "subjects": ["0301"], "name": "綜合法學(一)-刑法、刑事訴訟法、法律倫理" },
    { "code": "303", "subjects": ["0201"], "name": "綜合法學(二)-民法、民事訴訟法" },
    { "code": "304", "subjects": ["0202"], "name": "綜合法學(二)-公司法、保險法、票據法、證券交易法、強制執行法、法學英文" }
  ]
}
```

> **examCode 規則：** 114 年用 `114110`，112/111 年用 `112120`/`111120`。規律不固定。  
> 若不確定，上考選部官網查：`https://wwwc.moex.gov.tw/main/exam/wFrmExamQandA.aspx`

---

## 步驟二：下載 PDF

### 方法 A：線上下載（優先嘗試）
```bash
cd D:\AI_Project\Lawyer_test_first\scraper
node download.js --year {year}
```

> **⚠️ 114 年經驗**：考選部 URL (`wwwq` vs `wwwc`) 可能變更，且部分試卷（如304）可能下載失敗。

### 方法 B：本地 PastExam 備援（推薦）

如果線上下載失敗，檢查 `scraper/PastExam/{year}/` 目錄：
```powershell
# 檔名映射規則：{examCode}_{subjectCode}_xxx.pdf → {paperCode}_questions.pdf
# 0101 → 301, 0201 → 303, 0202 → 304, 0301 → 302
# ANS前綴 → answers
Copy-Item "PastExam/{year}/考畢題答/{examCode}_0101_*.pdf" "pdfs/{year}/301_questions.pdf"
Copy-Item "PastExam/{year}/考畢題答/{examCode}_ANS0101_*.pdf" "pdfs/{year}/301_answers.pdf"
# ... 依此類推
```

**Subject Code → Paper Code 對照：**
| Subject Code | Paper Code | 科目 |
|---|---|---|
| `0101` | `301` | 憲法、行政法、國際公法、國際私法 |
| `0301` | `302` | 刑法、刑事訴訟法、法律倫理 |
| `0201` | `303` | 民法、民事訴訟法 |
| `0202` | `304` | 公司法、保險法、票據法、證券交易法、強制執行法、法學英文 |

結果應存到 `scraper/pdfs/{year}/`，包含：
- `301_questions.pdf` ~ `304_questions.pdf` （試題）
- `301_answers.pdf` ~ `304_answers.pdf` （標準答案）

**驗證：** 確認 8 份 PDF 齊全。

---

## 步驟三+四：解析 PDF → JSON（推薦 PyMuPDF 直接解析）

> **114 年經驗：** 跳過 `parse.js`+Gemini 手動流程，改用 `parse_{year}.py` 一步到位。

```bash
# 1. 用 PyMuPDF 提取答案
python -c "
import fitz, re, json
all_answers = {}
for paper in ['301','302','303','304']:
    doc = fitz.open(f'pdfs/{year}/{paper}_answers.pdf')
    text = ''.join(p.get_text() for p in doc); doc.close()
    answers = [l.strip() for l in text.split('\n') if l.strip() in 'ABCD']
    all_answers[paper] = answers
    print(f'{paper}: {len(answers)} answers')
json.dump(all_answers, open(f'pdfs/{year}/parsed_answers.json','w'), indent=2)
"

# 2. 用 parse_{year}.py 解析題目文字 + 組裝 JSON
python parse_{year}.py
```

`parse_{year}.py` 的核心邏輯（參考 `parse_114.py`）：
- 用 `fitz.open()` 提取 PDF 文字
- 用 `re.split(r'\n(\d{1,3})\n', text)` 分割題目
- 每題取最後 4 行為選項 A/B/C/D
- 配合 `parsed_answers.json` 對應答案
- 輸出 `data/{year}_complete.json`

### ⚠️ 必做：清除 PDF 亂碼字元

PDF 選項標號（⒜⒝⒞⒟）會被提取為 Unicode PUA 字元（`U+E18C`~`U+E18F`），在瀏覽器顯示為「□」。**必須清除：**

```python
import json, re
data = json.load(open(f'data/{year}_complete.json', 'r', encoding='utf-8'))
for q in data:
    for k in ['A','B','C','D']:
        if k in q['options']:
            q['options'][k] = re.sub(r'[\ue000-\uf8ff]', '', q['options'][k]).strip()
    if q.get('questionText'):
        q['questionText'] = re.sub(r'[\ue000-\uf8ff]', '', q['questionText']).strip()
json.dump(data, open(f'data/{year}_complete.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
```

**JSON Schema（每題）：**

```json
{
  "id": "114-301-constitutional-01",
  "year": 114,
  "subject": "constitutional",
  "questionNumber": 1,
  "questionText": "完整題目文字...",
  "options": {
    "A": "選項A文字",
    "B": "選項B文字",
    "C": "選項C文字",
    "D": "選項D文字"
  },
  "answer": "C",
  "tags": ["基本權-言論自由"]
}
```

**ID 格式：** `{year}-{paperCode(3碼)}-{subject}-{questionNumber(2碼)}`

> **⚠️ 注意：** paperCode 是 3 碼（301/302/303/304），不是 4 碼。之前 SKILL 寫錯為 0301。

**subject 對照表：**
| subject code | 中文 | 所屬試卷 |
|---|---|---|
| `constitutional` | 憲法 | 301 |
| `administrative` | 行政法 | 301 |
| `international_public` | 國際公法 | 301 |
| `international_private` | 國際私法 | 301 |
| `criminal` | 刑法 | 302 |
| `criminal_procedure` | 刑事訴訟法 | 302 |
| `legal_ethics` | 法律倫理 | 302 |
| `civil` | 民法 | 303 |
| `civil_procedure` | 民事訴訟法 | 303 |
| `company` | 公司法 | 304 |
| `insurance` | 保險法 | 304 |
| `negotiable_instruments` | 票據法 | 304 |
| `securities` | 證券交易法 | 304 |
| `enforcement` | 強制執行法 | 304 |
| `legal_english` | 法學英文 | 304 |

將 AI 回傳的 JSON 存到 `scraper/ai_results/114/` 目錄中。

---

## 步驟五：合併與驗證

```bash
node merge.js --year 114
```

產出 `scraper/data/114_complete.json`。

**人工驗證 checklist：**
1. 確認總題數 = 300（每份試卷約 70-80 題，共 4 份）
2. 確認每個科目都有題目
3. 確認答案欄位都是 A/B/C/D 之一
4. ⚠️ **必須執行步驟 5.5（答案驗證）**，不可跳過

```bash
# 快速檢查科目分佈
python -c "
import json
from collections import Counter
data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))
print(f'Total: {len(data)}')
c = Counter(d['subject'] for d in data)
for k, v in sorted(c.items()):
    print(f'  {k}: {v}')
"
```

**預期各科題數（約）：**
- constitutional: 15-20
- administrative: 30-36
- criminal: 30-50
- civil: 50-55
- civil_procedure: 20-30
- criminal_procedure: 5-25
- company: 15-16
- insurance: 10
- securities: 10-11
- negotiable_instruments: 10
- enforcement: 8-10
- international_public: 10
- international_private: 10
- legal_ethics: 15
- legal_english: 13-15

---

## 🚨 步驟 5.5：答案驗證 SOP（必做，禁止跳過）

> **⚠️ 111-114 年慘痛教訓：** 四個年度共 1200 題中有 **715 題答案是錯的（~60%）**！  
> 原因：(1) PDF text parser 提取的答案完全不可信 (2) 修正腳本只讀 local JSON 漏掉 Firestore-only 的題目  
> **此 SOP 已驗證有效，絕對禁止省略任何步驟。**

### Phase 1：取得官方答案（唯一信任來源）

1. **取得官方標準答案 PDF**（四份：2301/1301/3301/4301）
2. **用 `render_answer_pdfs.py` 轉為圖片**：
```bash
python render_answer_pdfs.py  # 產出 pdfs/{year}/answer_images/*.png
```
3. **用 `view_file` 逐張讀取圖片**，肉眼抄錄答案表格到 dict：
```javascript
// 以 2301 為例，每 10 題一行方便比對
const official_2301 = {
  1:'A', 2:'D', 3:'B', 4:'D', 5:'A', 6:'D', 7:'A', 8:'D', 9:'A', 10:'B',
  // ...
};
```

### Phase 2：修正 Firestore（必須直接掃 Firestore）

> **⚠️ 關鍵教訓：** 修正腳本 **禁止只從 local JSON 讀 ID**。  
> Firestore 裡可能有 local JSON 不存在的題目，會被遺漏。  
> **必須用 `db.collection('questions').where('year','==',{year}).get()` 掃全部。**

參考腳本：`fix_firestore_only_answers.js`（掃描 Firestore + 比對 + 修正）

### Phase 3：修後驗證（Spot Check）

> **⚠️ 修完不做驗證等於沒修。**

1. 從每年每卷隨機選 2-3 題（共 ~48 題），寫入 `spot_check_firestore.js`
2. 直接從 Firestore 讀取答案比對官方圖片
3. **必須 48/48 ALL PASS 才算完成**

```bash
node spot_check_firestore.js
# 預期輸出：SPOT CHECK RESULT: 48 PASS, 0 FAIL, 0 MISSING
```

### ❌ 禁止事項
- ❌ 不可信任 PDF text parser（`fitz.get_text()`）提取的答案字母
- ❌ 不可用 AI 推理答案
- ❌ 不可跳過此步驟直接上傳或寫詳解
- ❌ 不可先寫詳解再驗證答案（答案錯 → 詳解全部重做）
- ❌ 修正腳本不可只讀 local JSON，必須直接查 Firestore
- ❌ 修完不可跳過 Spot Check

### ✅ 正確順序
1. 官方 PDF → 圖片 → 人工抄錄 answer dict
2. Firestore 全量掃描 + 修正
3. Spot Check 驗證（48/48 PASS）
4. 確認通過後才寫詳解

---

## 步驟六：上傳題目到 Firestore

```bash
node upload_to_firestore.js --year 114
```

此指令使用 batch write（每 500 筆一批），用 `merge: true` 避免覆寫已存在的詳解。

---

## 步驟七：撰寫詳解

### 詳解格式（Firestore document 中的 `explanation` 欄位）

```json
{
  "tag": "刑法-分則-殺人罪",
  "explanation": {
    "coreConcept": "一句話點出本題的核心法律爭點",
    "analogy": "生活化比喻幫助理解（可加幽默但不可誤導）",
    "coreExplanation": "嚴謹法理分析，引用條號與實務見解",
    "optionAnalysis": {
      "A": "【正確（本題答案）】具體說明為何正確",
      "B": "【錯誤】具體說明為何錯誤",
      "C": "【錯誤】具體說明為何錯誤",
      "D": "【錯誤】具體說明為何錯誤"
    },
    "keyTakeaway": "考試口訣或記憶點",
    "relatedArticles": "相關法條引用"
  }
}
```

### 詳解撰寫原則

1. **綜觀全局**：每題詳解要與題庫中其他相關題目做橫向連結
2. **Analogy 要精準**：用白話比喻降低門檻，但不能犧牲精確性
3. **嚴謹引用**：引用法條、大法官解釋、憲法法庭判決
4. **幽默但謹慎**：analogy 可以有趣，但涉及重罪時要嚴肅
5. **選項全分析**：每個選項都要說明對/錯原因
6. **標記正確答案**：正確選項前面加 `【正確（本題答案）】`

### 批次上傳詳解的腳本模板

```javascript
// exp_{year}_{subject}.js
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json'))
  });
}
const db = admin.firestore();

const explanations = [
  {
    id: "114-0301-constitutional-01",  // 必須與題目 ID 完全一致
    tag: "憲法-基本權-言論自由",
    explanation: {
      coreConcept: "...",
      analogy: "...",
      coreExplanation: "...",
      optionAnalysis: { A: "...", B: "...", C: "...", D: "..." },
      keyTakeaway: "...",
      relatedArticles: "..."
    }
  },
  // ... 更多題目
];

async function run() {
  for (const item of explanations) {
    await db.collection('questions').doc(item.id).set(
      { tag: item.tag, explanation: item.explanation },
      { merge: true }  // 關鍵：merge 才不會覆寫題目文字
    );
    console.log('OK ' + item.id);
  }
  console.log('Done');
  process.exit();
}
run();
```

執行：
```bash
node exp_114_constitutional.js
```

### Firestore 配額注意事項
- **Spark 免費方案**：每日 50,000 讀 / 20,000 寫
- 大量寫入（300+ 筆）會消耗配額，可能需要等**太平洋時間午夜**（台灣時間約 15:00-16:00）重置
- 使用 `merge: true` 確保不覆寫已有資料

---

## 步驟八：更新 Web 年份選擇器

**⚠️ 需要更新兩處，缺一不可！**

### 8-1. 歷屆測驗頁面的年份選擇器

**檔案：** `src/main.js` 約 L228

找到年度選擇器：
```javascript
${[113, 112, 111].map(y => `
```

更新為：
```javascript
${[114, 113, 112, 111].map(y => `
```

同時更新預設年份（同一檔案 L53）：
```javascript
let selectedPracticeYear = 114;  // 原本是 113
```

### 8-2. 試題搜尋頁面的年份篩選

**檔案：** `src/main.js`，搜尋 `search-year-chip`

找到年份篩選 chips：
```html
<label class="chip search-year-chip"><input type="checkbox" class="search-year-cb" value="113" checked hidden>113年</label>
```

在最前面加入新年份：
```html
<label class="chip search-year-chip"><input type="checkbox" class="search-year-cb" value="114" checked hidden>114年</label>
```

> **⚠️ 114 年教訓：** 搜尋頁面的年份篩選是硬編碼的 HTML，容易遺漏。新增年份時務必同時更新此處，否則使用者在搜尋頁面會找不到新年份的題目。

---

## 步驟九：部署 Web

```bash
cd D:\AI_Project\Lawyer_test_first
npm run build
```

如使用 GitHub Pages：
```bash
git add -A
git commit -m "feat: add 114年 exam questions"
git push origin main
```

GitHub Actions 會自動部署到 `https://vbnmzxc9513.github.io/Lawyer-Test-App/`

---

## 步驟十：驗證

### 1. Firestore 覆蓋率審計
```bash
cd scraper
node audit_coverage.js
```

### 2. 本地預覽
```bash
cd D:\AI_Project\Lawyer_test_first
npm run dev
```
打開瀏覽器，選 114 年 → 隨機選一科 → 確認題目、選項、答案、詳解都正確顯示。

### 3. 快速驗證腳本
```python
# 檢查指定年度的科目分佈和詳解覆蓋率
import json
data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))
print(f"Total: {len(data)} questions")
from collections import Counter
subjects = Counter(d['subject'] for d in data)
for s, c in sorted(subjects.items()):
    print(f"  {s}: {c}")
```

---

## 快速指令總結

完整流程的一行指令（假設 year=114）：

```bash
cd D:\AI_Project\Lawyer_test_first\scraper

# 1. 註冊年度（手動編輯 exam-registry.json）
# 2. 下載 PDF
node download.js --year 114

# 3. 解析 → 合併
node parse.js --year 114
# (AI 解析後存入 ai_results/114/)
node merge.js --year 114

# 4. 上傳到 Firestore
node upload_to_firestore.js --year 114

# 5. 撰寫詳解（使用 exp_114_*.js 腳本）
# 6. 更新 web 年份選擇器（src/main.js 兩處：年份陣列 + 搜尋頁年份篩選）
# 7. 部署
cd .. && npm run build && git add -A && git commit -m "feat: add 114" && git push
```

---

## 常見問題

### Q: PDF 下載失敗？
1. 檢查 `download.js` 的 `BASE_URL`（考選部有 `wwwq` 和 `wwwc` 兩個域名）
2. 嘗試不同 examCode（如 `114110` vs `114120`）
3. **備援：** 使用 `scraper/PastExam/{year}/` 的本地 zip（手動從考選部下載）

### Q: PDF 解析亂碼？
- `pdfjs-dist` 解析中文不穩定，**推薦用 PyMuPDF (fitz)**
- 設置 `$env:PYTHONIOENCODING='utf-8'`
- 答案 PDF 的數字和字母間有亂碼但 A/B/C/D 可精確提取

### Q: 某試卷的科目題數分配不確定？
114 年的分配如下（可作為參考基準）：
- 301: 憲法20 + 行政法36 + 國公10 + 國私9 = 75
- 302: 刑法40 + 刑訴20 + 法倫15 = 75
- 303: 民法50 + 民訴30 = 80
- 304: 公司15 + 保險10 + 票據10 + 證券10 + 強執10 + 法英15 = 70

### Q: Firestore 配額超限？
- Spark 方案：每日 50,000 讀 / 20,000 寫
- 300 題上傳 + 300 詳解 = 約 600 次寫入（安全）
- 重置時間：太平洋時間午夜（台灣 ~15:00-16:00）

### Q: 年份選擇器沒有新年度？
`src/main.js` 有**兩處**需要更新：
1. 搜尋 `[114, 113` 的年份陣列（歷屆測驗頁）
2. 搜尋 `search-year-chip` 的年份篩選 chips（試題搜尋頁）

### Q: 選項順序被打亂？
PDF 解析時選項 A/B/C/D 可能因排版換行被錯誤分割。解決方式：取最後 4 個非空行作為 4 個選項。長選項（跨行）需手動合併。

---

## 114年實戰記錄（供未來參考）

| 步驟 | 方法 | 耗時 | 備註 |
|------|------|------|------|
| 下載 PDF | `download.js` + PastExam 備援 | 2 min | 304 線上下載失敗，用本地備份 |
| 解析題目 | `parse_114.py` (PyMuPDF) | 1 min | 300 題全數解析成功 |
| 上傳題目 | `upload_to_firestore.js` | 30 sec | 單批 300 筆 batch write |
| 詳解（精寫）| `exp_114_con.js` | 手動撰寫 | 憲法 20 題完整 analogy |
| 詳解（批次）| `exp_114_batch_all.js` | 15 sec | 剩餘 280 題自動生成結構 |
| 更新 Web | 修改 `main.js` 2 處 | 1 min | 年份陣列 + 預設年份 |

---

## 相依套件

```json
{
  "firebase-admin": "^13.x",
  "axios": "^1.x",
  "pdfjs-dist": "^5.x",
  "pdf-parse": "^1.x"
}
```

Python 端：`pip install PyMuPDF`

安裝：`cd scraper && npm install`
