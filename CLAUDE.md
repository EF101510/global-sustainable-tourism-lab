# 專案描述

這是一個世界旅齵的英文教案,專案目的是幫助英文老師，利用網頁方式輔助教學

# 工作流程

在開始工作之前請先閱讀reference

# Tech Stack

- **Framework**: React + Vite (TypeScript)
- **3D / Globe**: Three.js（程序化大陸 + world-atlas TopoJSON 升級海岸線）
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **AI**: Anthropic Claude API（透過 `/api/chat` 後端 proxy 呼叫，避免暴露 API key）
- **Markdown**: react-markdown（chat 助理訊息渲染）
- **Storage**: localStorage（學生留言板現況；未來搬到 Workers KV 做全球共享）
- **Deployment**: Cloudflare Pages + Pages Functions

# 部署到 Cloudflare Pages

整個專案（前端 + `/api/chat`）部署到同一個 Cloudflare Pages 專案，沒有獨立 Worker。

## 一次性設定
```sh
npm i -g wrangler
wrangler login
wrangler pages project create global-sustainable-tourism-lab
```

設環境變數（在 Pages dashboard 的 Settings → Environment variables，或 CLI）：
```sh
wrangler pages secret put ANTHROPIC_API_KEY --project-name=global-sustainable-tourism-lab
wrangler pages secret put ANTHROPIC_MODEL   --project-name=global-sustainable-tourism-lab
wrangler pages secret put ANTHROPIC_EFFORT  --project-name=global-sustainable-tourism-lab
```

## 每次部署
```sh
npm run build
wrangler pages deploy dist --project-name=global-sustainable-tourism-lab
```

或在 Pages dashboard 連 git repo，push 自動部署。

## 檔案配置
- `dist/` — Vite build 輸出（靜態檔 + `_redirects` 給 SPA fallback）
- `functions/api/chat.ts` — Cloudflare Pages Function，處理 `/api/chat`
- `functions/api/board/[city]/` — 學生留言板 (KV)，含 `index.ts` (GET/POST) 和 `[postId].ts` (PATCH/DELETE)
- `functions/api/admin/` — Admin endpoints (login, credentials, posts CRUD, batch-delete)
- `src/server/chat-handler.ts` — 共用核心邏輯，dev/prod 都用
- `src/server/board-handler.ts` — 留言板共用邏輯（含 admin 操作）
- `src/server/admin-handler.ts` — Admin 認證與 PBKDF2 密碼雜湊
- `wrangler.toml` — KV binding 宣告 (BOARD)
- 本地開發：`npm run dev` 仍走 Vite middleware（在 `vite.config.ts` 中），與 production Pages Function 共用同一套 handlers

## Admin 後台 (`/admin`)
老師專用的留言管理介面（學生看不到入口連結，需直接打 URL）。

**預設帳密**：`admin` / `admin123`

**第一次登入後請立刻改密碼** —— 進入 Admin 後右上角「Settings」→ 設新帳號和新密碼（至少 6 字元）→ 儲存。新帳密以 PBKDF2-SHA-256 (100k 次) 雜湊存進 KV 的 `admin:credentials`，之後預設帳密就失效。

如果忘記改過後的密碼：
```sh
wrangler kv key delete --binding=BOARD admin:credentials
```
KV 紀錄被清掉後，`admin / admin123` 預設組合會再次生效。

**Admin 功能**：
- 跨城市檢視所有留言 (City 下拉篩選 + 全文搜尋)
- 編輯任意留言（不需要 editToken）
- 單筆刪除 / 勾選後批次刪除
- 改帳號密碼
