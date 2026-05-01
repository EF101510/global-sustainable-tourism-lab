# 專案描述

這是一個世界旅齵的英文教案,專案目的是幫助英文老師，利用網頁方式輔助教學

# 工作流程

在開始工作之前請先閱讀reference

# Tech Stack

- **Framework**: React + Vite (TypeScript)
- **3D / Globe**: Three.js（程序化大陸 + world-atlas TopoJSON 升級海岸線）
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **AI**: Anthropic Claude API（透過後端 proxy 呼叫，避免暴露 API key）
- **Storage**: localStorage（學生留言板，key: `board:${cityId}`）
- **Deployment**: 待定（建議 Vercel / Netlify，配 serverless function 做 API proxy）
