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
wrangler pages project create global-tourism-lab
```

設環境變數（在 Pages dashboard 的 Settings → Environment variables，或 CLI）：
```sh
wrangler pages secret put ANTHROPIC_API_KEY --project-name=global-tourism-lab
wrangler pages secret put ANTHROPIC_MODEL   --project-name=global-tourism-lab
wrangler pages secret put ANTHROPIC_EFFORT  --project-name=global-tourism-lab
```

## 每次部署
```sh
npm run build
wrangler pages deploy dist --project-name=global-tourism-lab
```

或在 Pages dashboard 連 git repo，push 自動部署。

## 檔案配置
- `dist/` — Vite build 輸出（靜態檔 + `_redirects` 給 SPA fallback）
- `functions/api/chat.ts` — Cloudflare Pages Function，處理 `/api/chat`
- `src/server/chat-handler.ts` — 共用核心邏輯，dev/prod 都用
- `wrangler.toml` — KV / D1 binding 宣告（KV 預留給未來 Student Board）
- 本地開發：`npm run dev` 仍走 Vite middleware（在 `vite.config.ts` 中），與 production Pages Function 共用同一個 `chat-handler`
