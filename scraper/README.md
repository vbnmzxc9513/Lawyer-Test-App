# Scraper — 司律一試資料管線

## 目錄結構

```
scraper/
├── core/           ← 正式管線工具（長期維護）
├── audit/          ← 品質稽核工具（只讀，安全執行）
├── repair/         ← 修復工具（寫入 Firestore，需確認）
├── reports/        ← 稽核報告輸出 (.json)
├── assets/         ← 靜態資源（答案截圖等）
├── config/         ← 設定檔（exam-registry, serviceAccountKey, .env）
├── PastExam/       ← 原始考試 PDF
├── data/           ← 本地快取資料
├── _archive/       ← 已歸檔的一次性腳本（200+ 個舊腳本）
├── package.json
└── README.md
```

## ⚠️ 操作規範

### 1. 禁止自動執行 Firestore 寫入
任何寫入 Firestore 的腳本（`repair/` 下的工具），**禁止** 設定 `SafeToAutoRun: true`。
必須由人工確認後才能執行。

### 2. 修改前先跑稽核
在執行任何 `repair/` 腳本之前，必須先跑：
```bash
node audit/smart_audit.js
```
記錄當前狀態，以便出問題時可回溯。

### 3. 新腳本不放根目錄
- 新的一次性修正 → 放 `_archive/fix/`
- 新的詳解生成 → 放 `_archive/exp/`
- 正式永久工具 → 放 `core/` 或 `audit/`

### 4. 不確定就不要改
如果對法律概念或資料正確性有任何不確定，**不要寫入 Firestore**。
先輸出到 `reports/` 做驗證。

## 正式工具列表

### core/ — 管線工具
| 腳本 | 用途 |
|------|------|
| `parse.js` | PDF 解析 |
| `download.js` | 下載考題 |
| `import.js` | 匯入資料 |
| `merge.js` | 合併資料 |
| `upload_to_firestore.js` | 上傳到 Firestore |
| `generate_explanation.js` | 生成詳解 |
| `index.js` | 主程式入口 |

### audit/ — 稽核工具（只讀）
| 腳本 | 用途 |
|------|------|
| `smart_audit.js` | 智慧型標記偵測（理解兩種題型） |
| `comprehensive_audit.js` | 全面盤點題數/答案/詳解 |
| `deep_audit.js` | 深度 optionAnalysis 檢查 |
| `semantic_check.js` | 語意交叉比對 |
| `full_quality_audit.js` | 完整品質報告（含 tag） |
| `shift_detect.js` | 位移偵測 |
| `health_check_firestore.js` | 基本健檢 |

### repair/ — 修復工具（需確認）
| 腳本 | 用途 |
|------|------|
| `fix_option_marks.js` | 修正 optionAnalysis 標記 |
| `fix_all_exp_marks.js` | 批量修正標記 |
| `fix_legal_english_exp.js` | 法英詳解補上 |

## _archive/ 說明
`_archive/` 包含 200+ 個已執行過的一次性腳本，按類別歸檔：
- `exp/` — 詳解生成腳本 (99個)
- `fix/` — 修正腳本 (71個)
- `rewrite/` — 重寫腳本+資料 (49個)
- `retag/` — 重新標籤 (8個)
- `update/` — 更新腳本 (7個)
- `verify/` — 驗證腳本 (9個)
- `misc/` — 其他

**這些腳本僅供參考和歷史追溯，不應重新執行。**
