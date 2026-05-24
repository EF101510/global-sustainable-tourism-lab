# Global Sustainable Tourism AI Lab

[English](README.md) | **繁體中文**

🌐 **線上版：** <https://global-sustainable-tourism-lab-c73.pages.dev/>

> 全球永續觀光 AI 實驗室 — 一個給英文老師的網頁教學輔助工具，讓學生用英文探索全球 25 個城市的「過度旅遊（overtourism）」議題。

學生在一個可拖曳旋轉的 3D 數位地球上點選城市，進入深度頁面閱讀真實案例、與 AI 對話診斷永續策略、用承載量公式試算，最後在留言板提出自己的「24 小時智慧限流計畫」與全球同學共學。

---

## ✨ 功能

- **3D 互動地球儀**（Three.js）— 拖曳旋轉、滾輪/雙指縮放、點選城市光點進入。支援桌機滑鼠與手機/平板觸控。
- **25 個城市深度頁面**
  - 城市 4K 街景縮時背景輪播（Ken Burns 效果）
  - 城市概覽（特色 / 環境 / 地緣 / 物產 / 經濟）
  - 核心議題卡（真實案例，如威尼斯 €5 day-trip fee、巴塞隆納 2028 Airbnb ban）
  - **承載量計算機**：`C = A × U_f / R_t`，可由 AI 估算輸入值
- **AI 永續診斷對話** — 透過 `/api/chat` 後端 proxy 呼叫 Anthropic Claude API（API key 不外洩到瀏覽器）
- **學生留言板** — 每個城市一個，留言存於 Cloudflare Workers KV，全球共享
- **老師 Admin 後台**（`/admin`）— 跨城市檢視 / 編輯 / 刪除留言、改帳密
- **無障礙小工具** — 字級控制、Preview 全螢幕模式
- **響應式設計** — 完整支援 iPhone / iPad 觸控操作

---

## 🧱 技術棧

| 範疇 | 技術 |
|------|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 3D / 地球 | Three.js（程序化大陸 + world-atlas TopoJSON 升級海岸線）|
| 樣式 | Tailwind CSS |
| 圖示 | lucide-react |
| AI | Anthropic Claude API（經 `/api/chat` proxy）|
| Markdown | react-markdown（聊天訊息渲染）|
| 儲存 | Cloudflare Workers KV（留言板、admin 帳密）|
| 部署 | Cloudflare Pages + Pages Functions |

---

## 🚀 本地開發

**需求：** Node.js 18+ 與一組 Anthropic API key。

```sh
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env.local
#   編輯 .env.local，至少填入 ANTHROPIC_API_KEY

# 3. 啟動開發伺服器
npm run dev
#   預設 http://localhost:5173
#   想用手機/平板實機測試：npm run dev -- --host，再連 Network 網址
```

> **環境變數改了要重啟 `npm run dev`** —— `vite.config.ts` 只在啟動時透過 Vite 的 `loadEnv` 讀取一次 `.env.local`，並注入到 dev 端的 `/api/chat` middleware。這些 `ANTHROPIC_*` 變數只存在於 Node 端，永遠不會被打包進前端。

### 環境變數

| 變數 | 必填 | 說明 |
|------|:---:|------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API 金鑰 |
| `ANTHROPIC_MODEL` | — | 聊天模型，預設 `claude-opus-4-7`（可選 opus / sonnet / haiku，見 `.env.example`）|
| `ANTHROPIC_EFFORT` | — | 推理強度 `low\|medium\|high\|xhigh\|max`，留空則由模型決定（Haiku 須留空）|

### 可用指令

```sh
npm run dev       # 啟動開發伺服器（含 /api/chat、/api/board、/api/admin middleware）
npm run build     # 型別檢查 + production build 到 dist/
npm run preview   # 本地預覽 build 結果
npm run lint      # 型別檢查（tsc --noEmit）
```

---

## 📁 專案結構

```
src/
├─ pages/                  路由頁面
│  ├─ GlobePage.tsx          /          地球儀首頁
│  ├─ CityDashboardPage.tsx  /city/:id  城市深度頁
│  └─ AdminPage.tsx          /admin     老師後台
├─ components/             Globe、AIChat、StudentBoard、承載量計算機等
├─ data/                  cities、city-details、carrying-capacity 資料
├─ lib/                   three-globe、chat-api、country-flags 等
├─ hooks/                 useScrollLock、useBackgroundCarousel
└─ server/               dev/prod 共用的後端核心邏輯
   ├─ chat-handler.ts       Anthropic proxy（prompt caching、adaptive thinking）
   ├─ board-handler.ts      留言板 CRUD（editToken 機制 + admin 操作）
   └─ admin-handler.ts      Admin 認證（PBKDF2-SHA-256）

functions/api/            Cloudflare Pages Functions（production 後端）
vite.config.ts            dev server + /api/* middleware（與 functions 共用 src/server/*）
wrangler.toml             Cloudflare 設定（KV binding：BOARD）
```

> dev（`vite.config.ts` middleware）與 production（`functions/api/*`）共用 `src/server/*-handler.ts`，後端邏輯只有一份。

---

## ☁️ 部署到 Cloudflare Pages

前端與 `/api/*` 都部署在同一個 Cloudflare Pages 專案。

```sh
# 一次性設定
npm i -g wrangler
wrangler login
wrangler pages project create global-sustainable-tourism-lab

wrangler kv namespace create BOARD          # 把輸出的 id 填進 wrangler.toml
wrangler pages secret put ANTHROPIC_API_KEY --project-name=global-sustainable-tourism-lab
#   ANTHROPIC_MODEL / ANTHROPIC_EFFORT 為純文字，寫在 wrangler.toml 的 [vars]

# 每次部署
npm run build
wrangler pages deploy dist --project-name=global-sustainable-tourism-lab
```
或在 Pages dashboard 連結 git repo，push 後自動部署。

---

## 🔑 Admin 後台（`/admin`）

老師專用的留言管理介面（學生看不到入口，需直接打 URL）。

- **預設帳密**：`admin` / `admin123`
- **第一次登入後請立刻改密碼**：右上「Settings」→ 設新帳號密碼（≥ 6 字元）。新帳密以 PBKDF2-SHA-256（100k 次）雜湊存進 KV，預設帳密隨即失效。
- **忘記改過後的密碼**：`wrangler kv key delete --binding=BOARD admin:credentials` 清掉紀錄後，預設帳密 `admin / admin123` 會再次生效。

---

## 📝 授權 / 用途

教育用途。城市背景圖多來自 Unsplash 與 Wikimedia Commons，請依各自授權使用。
