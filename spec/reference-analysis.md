# Global Sustainable Tourism AI Lab — 教案參考資料解析

本文件整理 `reference/` 資料夾內 `Global Sustainable Tourism AI Lab.docx` 與 `sustainable-tourism-lab.tsx` 的內容，作為後續開發教案網站的依據。

---

## 一、教案構想（來自 docx）

### 教學主題
以 **Global Sustainable Tourism AI Lab（全球永續觀光 AI 實驗室）** 為題，幫助學生用英文探索全球 25 個城市的「過度旅遊」議題。

### 1. 互動式視覺設計
- **風格**：Minimalist Tech（極簡科技風）
- **背景**：純白色 `#FFFFFF`
- **主體**：半透明深藍色（Electric Blue）數位地球，可 360° 拖拽旋轉
- **城市標記**：地球表面光點，hover 時脈衝波紋並顯示 `City Name, Country`

### 2. 25 個精選城市（依區域）

| 區域 | 城市 |
|------|------|
| **歐洲** | Venice、Barcelona、Amsterdam、Santorini、Dubrovnik、Reykjavík、Paris、Florence |
| **亞洲** | Kyoto、Bali、Phuket、Boracay、Bangkok、Siem Reap、Seoul |
| **美洲** | New York、Machu Picchu、Cusco、Rio de Janeiro、Cancún |
| **其他** | Cairo、Cape Town、Sydney、Galápagos、Auckland |

> ⚠️ 註：tsx 程式碼中比 docx 多了 **Boracay（長灘島）**，所以實際實作為 **26 個城市**（但 UI Header 顯示 "25 Cities"）。

### 3. 城市深度探索頁面（Dashboard）
- **背景**：城市 4K 街景縮時攝影
- **資訊框**：毛玻璃（Frosted Glass）效果

#### A. 核心問題標籤（Problem Tags）
- 🏚️ **居民流失（Gentrification）**：房價飆升致原住民搬離
- 🎭 **文化稀釋**：商業化過重，傳統手工藝消失
- 🌊 **環境破壞**：垃圾、水源短缺、生態干擾
- 🚌 **交通崩潰**：擠滿遊客，影響救難

#### B. AI 永續診斷對話框（AI Lab Chat）
預設三個引導問題：
1. 「該城市在 2030 年會面臨什麼樣的觀光危機？」
2. 「有哪些 AI 技術可以幫助減少該城市的遊客人流量？」
3. 「請比較這個城市與其他相似城市的成功轉型案例。」

### 4. 教學延伸
- **學生任務**：選一個城市，利用 AI 設計「**24 小時智慧限流計畫**」
- **反饋機制**：點擊「提交建議」，記錄到該城市的虛擬留言板，全球學生共學

---

## 二、程式碼實作架構（sustainable-tourism-lab.tsx, 1344 行）

### 技術棧
- **React** + Hooks (`useState` / `useEffect` / `useRef`)
- **Three.js**（3D 地球儀）
- **lucide-react**（圖示：`ArrowLeft`、`Send`、`MessageSquare`、`Sparkles`、`X`、`Globe2`、`AlertTriangle`）
- **Tailwind CSS**（樣式）
- **Anthropic API**（直接 fetch `https://api.anthropic.com/v1/messages`，模型 `claude-sonnet-4-20250514`）⚠️
- **`window.storage`**（自訂 KV 介面，供留言板使用）

### 元件結構
```
App (default export)
├─ Globe                  ← 3D 地球儀首頁
│   └─ hover 卡片 / 點擊縮放動畫
└─ CityDashboard          ← 城市詳細頁
    ├─ 核心問題格子（4 issues, 點擊展開細節）
    ├─ AIChat             ← 右側 AI 對話框
    └─ StudentBoard       ← Modal 留言板（24h 限流計畫）
```

### Globe 元件特色（line 1–974）
- **地球紋理**：先用 Canvas 程序化繪製 26 塊大陸（北美、南美、歐亞、非洲、馬達加斯加、澳洲、印尼諸島、日本、英倫三島等），再非同步嘗試 fetch `world-atlas@2 TopoJSON`（land-110m / land-50m）做更精細海岸線升級。
- **網格**：每 15° 緯線（parallel）+ 經線（meridian），赤道與本初子午線顏色加深。
- **大氣光暈**：`SphereGeometry × 1.08`、`BackSide`、青色半透明。
- **城市標記**：黃色小圓點 + 半透明脈動光環（`RingGeometry`，相位隨機）。
- **互動**：拖拽旋轉、滾輪縮放（5–15）、hover 高亮、點擊縮放動畫（600ms easeOutCubic + blur 過場）。
- **Header / Footer**：顯示 "25 Cities" 與 "DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A POINT"。

### CityDashboard（line 1227–1310）
- 12 欄 grid：左 7 欄資訊 + 右 5 欄 AI Chat
- 4 個問題格子，點擊展開（展開時 col-span 變 2）
- 右上「Student Board」按鈕開啟 modal

### AIChat（line 977–1110）
- 動態 system prompt 注入城市資料
- 三個預設問題按鈕（用城市中文名動態組）
- ⚠️ **API key 沒處理** — `fetch` 直接打 Anthropic API 但沒帶 `x-api-key`，正式部署需走後端代理

### StudentBoard（line 1113–1224）
- 用 `window.storage.get/set(key, sync=true)` 持久化留言（key: `board:${city.id}`）
- 暱稱 ≤ 20 字、內容 ≤ 500 字
- 排序：時間倒序

### 城市資料 schema（CITIES 陣列，26 筆）
```ts
{
  id, name, nameZh, country, lat, lng, region,
  bg,               // Unsplash 背景圖 URL
  intro,            // 中文一句簡介
  issues: [         // 固定 4 個：居民流失/文化稀釋/環境破壞/交通崩潰
    { tag, icon, detail }
  ]
}
```

---

## 三、若要實作為教案網頁，需要注意

1. **API 安全**：`AIChat` 直接呼叫 Anthropic API 沒有金鑰，要加後端 proxy 或 serverless function。
2. **window.storage 不存在**：`StudentBoard` 依賴的 `window.storage.get/set` 不是瀏覽器原生 API，需改成 `localStorage` 或接後端。
3. **數量不一致**：UI 寫 "25 Cities" 但 CITIES 陣列有 26 個（Boracay 是 docx 沒列的）。
4. **Unsplash 圖片**：硬編碼 URL，可能失效，建議自行下載或用穩定 CDN。
5. **教學落地**：docx 提到「24 小時智慧限流計畫」是核心作業，留言板輸入區的 placeholder 已對應這個任務。
