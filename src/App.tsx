import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Send, MessageSquare, Sparkles, X, Globe2, AlertTriangle } from 'lucide-react';

// ============ Types ============
export interface CityIssue {
  tag: string;
  icon: string;
  detail: string;
}

export interface City {
  id: string;
  name: string;
  nameZh: string;
  country: string;
  lat: number;
  lng: number;
  region: 'Europe' | 'Asia' | 'Americas' | 'Other';
  bg: string;
  intro: string;
  issues: CityIssue[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BoardPost {
  id: string;
  nickname: string;
  content: string;
  time: number;
}

// ============ City Data ============
const CITIES: City[] = [
  // Europe
  { id: 'venice', name: 'Venice', nameZh: '威尼斯', country: 'Italy', lat: 45.4408, lng: 12.3155, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1600',
    intro: '舉世聞名的水上之都，每年接待約 3000 萬遊客，但僅有 5 萬常住居民。',
    issues: [
      { tag: '居民流失', icon: '🏚️', detail: '過去 50 年常住人口從 17.5 萬下降至約 5 萬，房價飆漲使年輕人被迫搬離。' },
      { tag: '環境破壞', icon: '🌊', detail: '大型郵輪造成潟湖侵蝕，威尼斯每年下沉約 2 公釐。' },
      { tag: '文化稀釋', icon: '🎭', detail: '傳統手工玻璃工藝後繼無人，多數紀念品為廉價進口品。' },
      { tag: '交通崩潰', icon: '🚤', detail: '旺季每日遊客超過 11 萬人，主要橋樑與廣場壅塞嚴重。' },
    ]
  },
  { id: 'barcelona', name: 'Barcelona', nameZh: '巴塞隆納', country: 'Spain', lat: 41.3851, lng: 2.1734, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600',
    intro: '高第建築之城，年遊客量超過城市人口 20 倍以上，2024 年市府宣布 2028 年禁止短租。',
    issues: [
      { tag: '居民流失', icon: '🏚️', detail: '熱門區域房租 10 年內上漲 68%，當地居民被迫遷出市中心。' },
      { tag: '文化稀釋', icon: '🎭', detail: '蘭布拉大道傳統商店被連鎖紀念品店取代。' },
      { tag: '環境破壞', icon: '🌊', detail: '海灘水質因遊輪污染惡化，部分海域禁止游泳。' },
      { tag: '交通崩潰', icon: '🚌', detail: '聖家堂周邊巴士線曾因遊客過多被從 Google Maps 移除。' },
    ]
  },
  { id: 'amsterdam', name: 'Amsterdam', nameZh: '阿姆斯特丹', country: 'Netherlands', lat: 52.3676, lng: 4.9041, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=1600',
    intro: '運河之城，市府推行「Stay Away」運動，主動勸退派對型遊客。',
    issues: [
      { tag: '文化稀釋', icon: '🎭', detail: '紅燈區與咖啡店成為國際派對景點，原社區生活被破壞。' },
      { tag: '居民流失', icon: '🏚️', detail: '市中心住宅 30% 為短租用途，本地家庭難以租屋。' },
      { tag: '交通崩潰', icon: '🚲', detail: '單車道擠滿觀光客，事故率上升 40%。' },
      { tag: '環境破壞', icon: '🌊', detail: '運河水質因遊船廢氣與垃圾受污染。' },
    ]
  },
  { id: 'santorini', name: 'Santorini', nameZh: '聖托里尼', country: 'Greece', lat: 36.3932, lng: 25.4615, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600',
    intro: '愛琴海明珠，常住人口僅 1.5 萬但年遊客達 340 萬，水資源嚴重短缺。',
    issues: [
      { tag: '環境破壞', icon: '💧', detail: '島上無天然水源，全靠海水淡化，旺季用水量超載。' },
      { tag: '交通崩潰', icon: '🚢', detail: '單日最多 5 艘郵輪同時靠岸，伊亞鎮人滿為患。' },
      { tag: '居民流失', icon: '🏚️', detail: '居民被高房價擠出，多數搬至雅典或克里特島。' },
      { tag: '文化稀釋', icon: '🎭', detail: '傳統釀酒業被觀光餐廳取代，葡萄園面積減半。' },
    ]
  },
  { id: 'dubrovnik', name: 'Dubrovnik', nameZh: '杜布羅夫尼克', country: 'Croatia', lat: 42.6507, lng: 18.0944, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1555990538-32117dc6e23a?w=1600',
    intro: '《權力遊戲》取景地，舊城區每日限流 4000 人，UNESCO 警告除名風險。',
    issues: [
      { tag: '交通崩潰', icon: '🚢', detail: '單日曾湧入 1 萬名郵輪遊客，舊城區水洩不通。' },
      { tag: '環境破壞', icon: '🏛️', detail: '中世紀城牆因過度踩踏出現磨損。' },
      { tag: '居民流失', icon: '🏚️', detail: '舊城區居民從 5000 人降至不到 1500 人。' },
      { tag: '文化稀釋', icon: '🎭', detail: '本地小店全數轉為紀念品店與餐廳。' },
    ]
  },
  { id: 'reykjavik', name: 'Reykjavík', nameZh: '雷克雅維克', country: 'Iceland', lat: 64.1466, lng: -21.9426, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1504284402330-1d0fe06ed02b?w=1600',
    intro: '北極光之都，10 年內遊客量增加 400%，自然景觀面臨踩踏壓力。',
    issues: [
      { tag: '環境破壞', icon: '🌋', detail: '苔原生態系脆弱，遊客脫離步道造成數十年無法恢復的傷害。' },
      { tag: '交通崩潰', icon: '🚐', detail: '金圈景區停車場常年爆滿，緊急車輛難以通行。' },
      { tag: '居民流失', icon: '🏚️', detail: 'Airbnb 占住宅市場 8%，本地租屋價格翻倍。' },
      { tag: '文化稀釋', icon: '🎭', detail: '主街商店超過 60% 為觀光導向。' },
    ]
  },
  { id: 'paris', name: 'Paris', nameZh: '巴黎', country: 'France', lat: 48.8566, lng: 2.3522, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
    intro: '光之城，年遊客約 4400 萬，2024 奧運後過度旅遊問題加劇。',
    issues: [
      { tag: '交通崩潰', icon: '🗼', detail: '艾菲爾鐵塔週邊步行區擁擠程度達歷史新高。' },
      { tag: '居民流失', icon: '🏚️', detail: '瑪黑區與蒙馬特原住戶 20 年內減少 30%。' },
      { tag: '環境破壞', icon: '🌫️', detail: '塞納河水質長期超標，奧運游泳項目曾受影響。' },
      { tag: '文化稀釋', icon: '🎭', detail: '小型書店、麵包店被連鎖品牌取代。' },
    ]
  },
  { id: 'florence', name: 'Florence', nameZh: '佛羅倫斯', country: 'Italy', lat: 43.7696, lng: 11.2558, region: 'Europe',
    bg: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1600',
    intro: '文藝復興發源地，歷史中心每平方公里遊客密度居歐洲之冠。',
    issues: [
      { tag: '交通崩潰', icon: '🏛️', detail: '烏菲茲美術館排隊常達 4 小時。' },
      { tag: '居民流失', icon: '🏚️', detail: '歷史中心住戶 50 年內減少超過一半。' },
      { tag: '環境破壞', icon: '🌫️', detail: '空氣污染與震動加速古蹟風化。' },
      { tag: '文化稀釋', icon: '🎭', detail: '傳統皮革工坊與金匠店被觀光商店取代。' },
    ]
  },
  // Asia
  { id: 'kyoto', name: 'Kyoto', nameZh: '京都', country: 'Japan', lat: 35.0116, lng: 135.7681, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600',
    intro: '千年古都，2024 年因遊客騷擾藝妓問題，祇園部分小巷禁止觀光客進入。',
    issues: [
      { tag: '文化稀釋', icon: '🎎', detail: '藝妓被觀光客追拍騷擾，傳統茶屋文化受威脅。' },
      { tag: '交通崩潰', icon: '🚌', detail: '市區公車旺季嚴重塞車，居民通勤時間倍增。' },
      { tag: '環境破壞', icon: '🌸', detail: '清水寺周邊櫻花樹因遊客踩踏受損。' },
      { tag: '居民流失', icon: '🏚️', detail: '町家被改建為民宿，傳統社區瓦解。' },
    ]
  },
  { id: 'bali', name: 'Bali', nameZh: '峇里島', country: 'Indonesia', lat: -8.3405, lng: 115.0920, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1537996194471-76f24b4c0c45?w=1600',
    intro: '神之島，2024 年起對遊客徵收觀光稅，水資源與文化保護成核心議題。',
    issues: [
      { tag: '環境破壞', icon: '💧', detail: '60% 水資源用於觀光業，本地稻田乾涸。' },
      { tag: '文化稀釋', icon: '🎭', detail: '網紅景點打卡文化稀釋宗教意義，神廟成為背景板。' },
      { tag: '居民流失', icon: '🏚️', detail: '烏布、水明漾本地人被外國租客取代。' },
      { tag: '交通崩潰', icon: '🛵', detail: '南部主要道路常態性塞車，事故率高。' },
    ]
  },
  { id: 'phuket', name: 'Phuket', nameZh: '布吉島', country: 'Thailand', lat: 7.8804, lng: 98.3923, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600',
    intro: '泰國度假勝地，瑪雅灣曾因《海灘》電影爆紅後關閉復育 4 年。',
    issues: [
      { tag: '環境破壞', icon: '🐠', detail: '珊瑚礁因防曬乳與船錨破壞，覆蓋率下降 80%。' },
      { tag: '交通崩潰', icon: '🚤', detail: '皮皮島單日船班超過容量 3 倍。' },
      { tag: '文化稀釋', icon: '🎭', detail: '本地漁村全面轉型觀光，傳統生計消失。' },
      { tag: '居民流失', icon: '🏚️', detail: '海岸線土地被外資收購，本地人移居內陸。' },
    ]
  },
  { id: 'boracay', name: 'Boracay', nameZh: '長灘島', country: 'Philippines', lat: 11.9674, lng: 121.9248, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1600',
    intro: '2018 年因環境惡化全島封閉 6 個月整治，是過度旅遊復育經典案例。',
    issues: [
      { tag: '環境破壞', icon: '🌊', detail: '污水未處理直接排海，曾被總統稱為「化糞池」。' },
      { tag: '居民流失', icon: '🏚️', detail: '原住民阿提族被迫退居山區。' },
      { tag: '交通崩潰', icon: '🛵', detail: '單日遊客曾達 4 萬人，島上道路癱瘓。' },
      { tag: '文化稀釋', icon: '🎭', detail: '本地文化被夜生活與派對活動完全取代。' },
    ]
  },
  { id: 'bangkok', name: 'Bangkok', nameZh: '曼谷', country: 'Thailand', lat: 13.7563, lng: 100.5018, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1600',
    intro: '連續多年蟬聯全球遊客最多城市，舊城區與河岸社區面臨改造壓力。',
    issues: [
      { tag: '交通崩潰', icon: '🛺', detail: '考山路與大皇宮周邊長年壅塞，PM2.5 超標。' },
      { tag: '居民流失', icon: '🏚️', detail: '河岸傳統高腳屋社區被酒店與商場取代。' },
      { tag: '環境破壞', icon: '🌫️', detail: '空氣污染嚴重，每年因霾害關閉學校。' },
      { tag: '文化稀釋', icon: '🎭', detail: '水上市場多為觀光表演，已失去交易功能。' },
    ]
  },
  { id: 'siemreap', name: 'Siem Reap', nameZh: '暹粒', country: 'Cambodia', lat: 13.3633, lng: 103.8564, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1600',
    intro: '吳哥窟所在地，地下水超抽威脅古蹟結構穩定。',
    issues: [
      { tag: '環境破壞', icon: '🏛️', detail: '飯店業超抽地下水，吳哥古蹟地基下陷風險上升。' },
      { tag: '交通崩潰', icon: '🚌', detail: '日出時段小吳哥同時湧入 5000 人。' },
      { tag: '文化稀釋', icon: '🎭', detail: '佛教儀式表演化，僧侶生活受干擾。' },
      { tag: '居民流失', icon: '🏚️', detail: '當地農民因觀光開發被徵收土地。' },
    ]
  },
  { id: 'seoul', name: 'Seoul', nameZh: '首爾', country: 'South Korea', lat: 37.5665, lng: 126.9780, region: 'Asia',
    bg: 'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=1600',
    intro: 'K-pop 與韓劇帶動觀光熱潮，北村韓屋村居民曾因遊客噪音抗議。',
    issues: [
      { tag: '居民流失', icon: '🏚️', detail: '北村韓屋村居民因遊客噪音與隱私問題搬離。' },
      { tag: '文化稀釋', icon: '🎭', detail: '傳統市場轉型為網紅打卡點，原始商業生態消失。' },
      { tag: '交通崩潰', icon: '🚇', detail: '明洞、弘大商圈週末壅塞，地鐵超載。' },
      { tag: '環境破壞', icon: '🌫️', detail: '景福宮周邊空氣品質因遊覽車排放下降。' },
    ]
  },
  // Americas
  { id: 'newyork', name: 'New York', nameZh: '紐約', country: 'USA', lat: 40.7128, lng: -74.0060, region: 'Americas',
    bg: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
    intro: '不夜城，時代廣場單日遊客曾達 36 萬，2023 年立法限制 Airbnb 短租。',
    issues: [
      { tag: '居民流失', icon: '🏚️', detail: '曼哈頓房租 10 年內上漲 47%，年輕人外流至外圍區。' },
      { tag: '交通崩潰', icon: '🚕', detail: '中城塞車程度居全美之冠，2025 年實施擁堵收費。' },
      { tag: '文化稀釋', icon: '🎭', detail: '小義大利、唐人街傳統商家被連鎖品牌取代。' },
      { tag: '環境破壞', icon: '🗑️', detail: '時代廣場日均產生 50 噸垃圾。' },
    ]
  },
  { id: 'machupicchu', name: 'Machu Picchu', nameZh: '馬丘比丘', country: 'Peru', lat: -13.1631, lng: -72.5450, region: 'Americas',
    bg: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600',
    intro: '印加遺跡，2024 年因遊客過多再度限流至每日 4500 人。',
    issues: [
      { tag: '環境破壞', icon: '🏔️', detail: '步道侵蝕嚴重，部分石階因踩踏龜裂。' },
      { tag: '交通崩潰', icon: '🚂', detail: '熱水鎮火車與巴士運能飽和，旺季一票難求。' },
      { tag: '文化稀釋', icon: '🎭', detail: 'Quechua 原住民被排除在主要觀光收益之外。' },
      { tag: '居民流失', icon: '🏚️', detail: '熱水鎮原為小村，現已完全觀光化。' },
    ]
  },
  { id: 'cusco', name: 'Cusco', nameZh: '庫斯科', country: 'Peru', lat: -13.5320, lng: -71.9675, region: 'Americas',
    bg: 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=1600',
    intro: '前印加帝國首都，海拔 3400m，每年百萬遊客衝擊高山生態。',
    issues: [
      { tag: '文化稀釋', icon: '🎭', detail: '聖週傳統儀式被觀光化，宗教意義稀釋。' },
      { tag: '居民流失', icon: '🏚️', detail: '武器廣場周邊住宅全數轉為旅館。' },
      { tag: '環境破壞', icon: '🏔️', detail: '安地斯山脈高山生態因登山客數量大增受擾。' },
      { tag: '交通崩潰', icon: '🚌', detail: '聖谷一日遊巴士造成主要道路堵塞。' },
    ]
  },
  { id: 'rio', name: 'Rio de Janeiro', nameZh: '里約熱內盧', country: 'Brazil', lat: -22.9068, lng: -43.1729, region: 'Americas',
    bg: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600',
    intro: '嘉年華之都，貧民窟旅遊（Favela Tour）引發倫理爭議。',
    issues: [
      { tag: '文化稀釋', icon: '🎭', detail: '貧民窟旅遊將居民貧困景觀化，倫理爭議大。' },
      { tag: '環境破壞', icon: '🌊', detail: '科帕卡瓦納海灘水質長期不達標。' },
      { tag: '交通崩潰', icon: '🚠', detail: '基督山纜車旺季排隊超過 3 小時。' },
      { tag: '居民流失', icon: '🏚️', detail: '伊帕內瑪等熱門海灘區房價飆升，本地中產被擠出。' },
    ]
  },
  { id: 'cancun', name: 'Cancún', nameZh: '坎昆', country: 'Mexico', lat: 21.1619, lng: -86.8515, region: 'Americas',
    bg: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1600',
    intro: '加勒比海度假天堂，馬雅紅樹林因酒店開發消失 60%。',
    issues: [
      { tag: '環境破壞', icon: '🐢', detail: '紅樹林被剷除蓋酒店，海龜產卵地大量消失。' },
      { tag: '居民流失', icon: '🏚️', detail: '飯店員工被迫住在 30 公里外的貧民區。' },
      { tag: '文化稀釋', icon: '🎭', detail: '馬雅文化被簡化為主題公園表演。' },
      { tag: '交通崩潰', icon: '🚌', detail: '酒店區單一道路，事故造成全區癱瘓。' },
    ]
  },
  // Other
  { id: 'cairo', name: 'Cairo', nameZh: '開羅', country: 'Egypt', lat: 30.0444, lng: 31.2357, region: 'Other',
    bg: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1600',
    intro: '金字塔之城，2024 年大埃及博物館開幕，遊客壓力轉向吉薩。',
    issues: [
      { tag: '環境破壞', icon: '🏜️', detail: '吉薩金字塔周邊空氣污染加速石灰岩風化。' },
      { tag: '文化稀釋', icon: '🎭', detail: '紀念品攤販強迫推銷，破壞參觀體驗。' },
      { tag: '交通崩潰', icon: '🐪', detail: '金字塔區交通混亂，駱駝伕與計程車糾紛頻傳。' },
      { tag: '居民流失', icon: '🏚️', detail: '吉薩村居民因觀光開發被迫遷移。' },
    ]
  },
  { id: 'capetown', name: 'Cape Town', nameZh: '開普敦', country: 'South Africa', lat: -33.9249, lng: 18.4241, region: 'Other',
    bg: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600',
    intro: '2018 年「Day Zero」水危機後，旅遊業如何永續成全球案例。',
    issues: [
      { tag: '環境破壞', icon: '💧', detail: '2018 年差點成為首個無水可用大城市，旅遊業耗水巨大。' },
      { tag: '居民流失', icon: '🏚️', detail: 'V&A 海濱周邊房價飆升，本地有色人種社區被擠壓。' },
      { tag: '文化稀釋', icon: '🎭', detail: 'Bo-Kaap 彩色街區成網紅景點，居民隱私受損。' },
      { tag: '交通崩潰', icon: '🚗', detail: '桌山纜車旺季排隊達 4 小時。' },
    ]
  },
  { id: 'sydney', name: 'Sydney', nameZh: '雪梨', country: 'Australia', lat: -33.8688, lng: 151.2093, region: 'Other',
    bg: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600',
    intro: '南半球門戶，邦代海灘 Instagram 化問題嚴重。',
    issues: [
      { tag: '文化稀釋', icon: '🎭', detail: '邦代海灘成網紅打卡景點，當地衝浪文化被稀釋。' },
      { tag: '環境破壞', icon: '🐠', detail: '大堡礁雖在昆士蘭，但雪梨港海洋生態同樣受遊輪影響。' },
      { tag: '居民流失', icon: '🏚️', detail: '市中心房價達全球第二高，年輕人外流。' },
      { tag: '交通崩潰', icon: '🚇', detail: '歌劇院周邊步行區旺季擁擠程度堪比香港。' },
    ]
  },
  { id: 'galapagos', name: 'Galápagos', nameZh: '加拉巴哥群島', country: 'Ecuador', lat: -0.9538, lng: -90.9656, region: 'Other',
    bg: 'https://images.unsplash.com/photo-1526857240426-7b1c93ee066f?w=1600',
    intro: '達爾文之島，特有種因外來物種與遊客活動面臨絕種威脅。',
    issues: [
      { tag: '環境破壞', icon: '🐢', detail: '外來物種入侵造成 60 種特有生物瀕危。' },
      { tag: '居民流失', icon: '🏚️', detail: '島上居民移民問題嚴重，本地服務業空缺。' },
      { tag: '交通崩潰', icon: '✈️', detail: '航班與郵輪數量年年突破上限。' },
      { tag: '文化稀釋', icon: '🎭', detail: '本地漁業文化被觀光導覽取代。' },
    ]
  },
  { id: 'auckland', name: 'Auckland', nameZh: '奧克蘭', country: 'New Zealand', lat: -36.8485, lng: 174.7633, region: 'Other',
    bg: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1600',
    intro: '紐西蘭門戶，毛利文化保護與郵輪觀光衝擊成主要議題。',
    issues: [
      { tag: '文化稀釋', icon: '🎭', detail: '毛利傳統儀式 Haka 商業化表演化。' },
      { tag: '環境破壞', icon: '🌊', detail: '豪拉基灣海洋保護區因遊船活動受擾。' },
      { tag: '居民流失', icon: '🏚️', detail: '市中心住宅成短租，本地房荒加劇。' },
      { tag: '交通崩潰', icon: '🚢', detail: '郵輪靠港日市區交通壅塞嚴重。' },
    ]
  },
];

// ============ Lat/Lng to 3D position ============
function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ============ Globe Component ============
function Globe({ onCitySelect }: { onCitySelect: (city: City) => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomingIn, setZoomingIn] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Globe — Lab-style holographic earth (white bg + cyan tech feel)
    const globeRadius = 2.5;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

    const createTechEarth = () => {
      const canvas = document.createElement('canvas');
      const W = 2048, H = 1024;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Ocean - tech blue gradient (medium saturation so it shows against white bg)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#5d8ab1');
      grad.addColorStop(0.5, '#7fa9cc');
      grad.addColorStop(1, '#5d8ab1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const xy = (lng: number, lat: number): [number, number] => [
        ((lng + 180) / 360) * W,
        ((90 - lat) / 180) * H,
      ];

      const land = '#1e3a5f';
      const landStroke = '#9cd1ec';

      const drawShape = (pts: [number, number][]) => {
        ctx.beginPath();
        pts.forEach(([lng, lat], i) => {
          const [x, y] = xy(lng, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = land;
        ctx.fill();
        ctx.strokeStyle = landStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      // North America
      drawShape([
        [-167,65],[-160,55],[-153,57],[-148,60],[-143,60],[-138,59],
        [-133,55],[-128,52],[-125,49],[-124,46],[-124,42],[-122,38],
        [-120,34],[-117,33],[-115,29],[-112,25],[-109,23],[-106,21],
        [-100,18],[-96,16],[-93,15],[-91,16],[-88,16],[-87,13],[-85,11],
        [-83,9],[-79,9],[-77,8],[-77,12],[-78,18],[-86,21],[-90,21],
        [-94,19],[-97,22],[-97,26],[-95,29],[-90,30],[-87,30],[-83,29],
        [-82,27],[-80,25],[-80,29],[-81,32],[-77,35],[-76,38],[-74,40],
        [-72,41],[-70,42],[-67,44],[-66,45],[-63,46],[-59,47],[-55,46],
        [-53,48],[-55,52],[-58,54],[-63,57],[-65,60],[-78,60],[-78,68],
        [-72,73],[-80,75],[-95,77],[-115,75],[-125,71],[-135,69],
        [-145,70],[-155,71],[-165,68]
      ]);

      // Greenland
      drawShape([
        [-52,60],[-44,60],[-38,62],[-22,68],[-15,75],[-22,82],[-32,83],
        [-45,83],[-55,80],[-58,73],[-55,65],[-52,62]
      ]);

      // Iceland
      drawShape([[-24,64],[-22,66],[-14,66],[-13,65],[-15,63],[-20,63]]);

      // Cuba
      drawShape([[-84,22],[-77,22],[-74,21],[-77,20],[-83,21]]);

      // Hispaniola
      drawShape([[-74,19],[-68,19],[-68,17],[-72,17.5]]);

      // South America
      drawShape([
        [-78,12],[-72,11],[-65,10],[-60,9],[-55,5],[-52,4],[-48,1],
        [-44,-1],[-38,-5],[-35,-8],[-35,-13],[-37,-18],[-40,-22],
        [-43,-23],[-45,-25],[-48,-28],[-53,-32],[-58,-35],[-62,-38],
        [-65,-42],[-68,-45],[-71,-48],[-73,-52],[-74,-55],[-72,-54],
        [-72,-50],[-72,-44],[-74,-40],[-75,-35],[-76,-30],[-72,-25],
        [-71,-20],[-72,-15],[-77,-10],[-80,-5],[-80,-2],[-78,2],[-78,5]
      ]);

      // Eurasia (Europe + Asia, with Italy peninsula traced)
      drawShape([
        // Iberia + W Europe
        [-9,37],[-9,43],[-1,47],[-2,49],[2,51],[4,53],[8,54],[11,55],
        // Scandinavia
        [11,58],[10,62],[13,68],[18,70],[29,71],
        // North Russia
        [33,69],[40,67],[55,68],[70,72],[85,74],[100,76],[115,76],
        [130,73],[150,72],[170,70],[178,71],
        // East Russia
        [178,66],[170,62],[165,58],[155,53],[142,47],
        // Korea
        [129,40],[126,35],
        // E China
        [122,37],[121,32],[118,25],[110,21],
        // Vietnam
        [108,16],[105,9],
        // Malay peninsula tip
        [104,1],
        // Up Andaman side
        [99,7],[98,13],[95,17],
        // Bay of Bengal
        [92,22],[88,22],[85,19],[80,13],[78,8],
        // West India
        [73,8],[73,17],[68,23],
        // Iran/Pakistan
        [60,25],[55,25],
        // Around Oman
        [58,22],[55,18],
        // Yemen
        [50,12],[44,12],
        // Saudi Red Sea
        [42,16],[38,22],[35,28],
        // Sinai north
        [33,30],[34,31],
        // Levant
        [35,35],[36,36],
        // Turkey south
        [33,36],[30,37],[27,37],
        // Greece
        [22,38],[20,40],
        // Adriatic
        [16,42],[13,45],
        // Italy peninsula
        [12,45],[13,43],[16,41],[18,40],[17,38],[15,38],[12,41],[10,44],
        // S France / Spain Med
        [7,43],[3,42],[-1,39],[-2,36],
        // Strait of Gibraltar
        [-5,36]
      ]);

      // Africa
      drawShape([
        [-17,15],[-17,21],[-12,28],[-7,33],[-3,35],[3,36],[10,33],
        [11,33],[15,32],[20,31],[25,32],[30,31],[33,31],[34,30],[35,28],
        [37,22],[39,15],[42,12],[45,11],[48,11],[51,11],
        [52,11],[51,8],[50,5],[44,1],[42,-1],[40,-5],
        [40,-10],[40,-15],[37,-18],[35,-22],[35,-25],[33,-28],[32,-29],
        [28,-33],[25,-34],[22,-34],[18,-34],[16,-29],
        [13,-23],[13,-18],[12,-15],[12,-10],[10,-5],[8,0],
        [9,4],[6,5],[3,5],[0,5],[-5,4],[-8,4],[-13,8],[-15,12]
      ]);

      // Madagascar
      drawShape([[43,-12],[48,-12],[50,-15],[50,-22],[47,-25],[44,-22],[43,-17]]);

      // Australia
      drawShape([
        [113,-22],[114,-26],[115,-32],[118,-35],[125,-32],[128,-32],
        [132,-32],[138,-35],[140,-38],[145,-39],[148,-37],[150,-35],
        [153,-30],[153,-25],[146,-19],[143,-13],[140,-12],[135,-12],
        [130,-13],[125,-15],[122,-17],[120,-18],[115,-20]
      ]);

      // Tasmania
      drawShape([[144,-41],[148,-40],[148,-43],[144,-43]]);

      // New Zealand (two islands)
      drawShape([[172,-34],[177,-37],[178,-39],[174,-41],[170,-40]]);
      drawShape([[166,-46],[171,-44],[174,-46],[170,-47],[167,-47]]);

      // Sumatra
      drawShape([[95,5],[101,3],[105,-2],[103,-5],[100,0],[97,2]]);
      // Borneo
      drawShape([[109,2],[114,6],[119,3],[118,-3],[114,-3],[110,-2]]);
      // Sulawesi
      drawShape([[120,2],[124,1],[125,-2],[123,-5],[121,-2]]);
      // Java
      drawShape([[105,-7],[114,-7],[114,-9],[106,-9]]);
      // New Guinea
      drawShape([[131,-1],[140,-3],[150,-7],[148,-10],[140,-9],[132,-5]]);
      // Philippines (rough)
      drawShape([[120,18],[124,18],[126,12],[125,7],[120,9],[118,12]]);

      // Japan: Hokkaido / Honshu / Kyushu
      drawShape([[140,42],[145,44],[145,42],[141,41]]);
      drawShape([[131,34],[136,34],[140,36],[141,38],[140,40],[135,36],[131,33]]);
      drawShape([[129,32],[131,33],[131,30],[130,30]]);

      // Great Britain
      drawShape([[-5,50],[-2,51],[1,51],[1,53],[0,55],[-3,58],[-5,58],[-6,56],[-5,52]]);
      // Ireland
      drawShape([[-10,52],[-6,52],[-6,55],[-9,55]]);

      // Sri Lanka
      drawShape([[80,9],[82,9],[82,6],[80,6]]);

      // Antarctica - white ice with natural noisy edge
      ctx.fillStyle = '#f0f6fc';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 15) {
        const noise = Math.sin(x * 0.012) * 35 + Math.sin(x * 0.04) * 18 + Math.sin(x * 0.08) * 8;
        ctx.lineTo(x, H - 90 + noise);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c5d5e5';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Subtle digital noise for tech feel
      for (let i = 0; i < 25000; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        ctx.fillRect(x, y, 2, 2);
      }

      return new THREE.CanvasTexture(canvas);
    };

    const techTexture = createTechEarth();
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: techTexture,
      transparent: true,
      opacity: 0.85,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Try to upgrade with real coastline data (world-atlas TopoJSON)
    (async () => {
      const urls = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
        'https://unpkg.com/world-atlas@2/land-110m.json',
        'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const topo = await res.json();
          const obj = topo.objects.land;
          const arcs = topo.arcs;
          const { scale, translate } = topo.transform;

          const decodeArc = (a: [number, number][]): [number, number][] => {
            const pts: [number, number][] = [];
            let x = 0, y = 0;
            for (const d of a) {
              x += d[0]; y += d[1];
              pts.push([x * scale[0] + translate[0], y * scale[1] + translate[1]]);
            }
            return pts;
          };
          const expand = (idxs: number[]): [number, number][] => {
            const out: [number, number][] = [];
            for (const i of idxs) {
              const rev = i < 0;
              let a = decodeArc(arcs[rev ? ~i : i]);
              if (rev) a = a.slice().reverse();
              if (out.length) a = a.slice(1);
              out.push(...a);
            }
            return out;
          };

          const W = 2048, H = 1024;
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const ctx = c.getContext('2d')!;

          // Ocean
          const g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, '#5d8ab1');
          g.addColorStop(0.5, '#7fa9cc');
          g.addColorStop(1, '#5d8ab1');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);

          ctx.fillStyle = '#1e3a5f';
          ctx.strokeStyle = '#9cd1ec';
          ctx.lineWidth = 2;

          const drawPoly = (rings: [number, number][][]) => {
            if (!rings || !rings[0] || rings[0].length < 3) return;
            ctx.beginPath();
            rings[0].forEach(([lng, lat]: [number, number], i: number) => {
              const x = ((lng + 180) / 360) * W;
              const y = ((90 - lat) / 180) * H;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = '#1e3a5f';
            ctx.fill();
            ctx.strokeStyle = '#9cd1ec';
            ctx.lineWidth = 2;
            ctx.stroke();
          };

          let drawn = 0;
          const drawGeom = (geom: any) => {
            if (!geom) return;
            if (geom.type === 'MultiPolygon') {
              for (const poly of geom.arcs) {
                drawPoly(poly.map(expand));
                drawn++;
              }
            } else if (geom.type === 'Polygon') {
              drawPoly(geom.arcs.map(expand));
              drawn++;
            } else if (geom.type === 'GeometryCollection' && geom.geometries) {
              for (const g of geom.geometries) drawGeom(g);
            }
          };
          console.log('TopoJSON obj type:', obj?.type, '| has geometries:', !!obj?.geometries, '| has arcs:', !!obj?.arcs);
          drawGeom(obj);
          console.log(`Drew ${drawn} land polygons from ${url}`);

          // Subtle digital noise
          for (let i = 0; i < 18000; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
            ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
          }

          const newTex = new THREE.CanvasTexture(c);
          globeMaterial.map = newTex;
          globeMaterial.needsUpdate = true;
          console.log('Coastline upgraded from', url);
          return;
        } catch (e) {
          console.warn('Coastline source failed:', url, (e as Error)?.message);
        }
      }
      console.log('Using procedural fallback continents');
    })();

    // Clean lat/lng grid — horizontal parallels + vertical meridians (no diagonals)
    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.35,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.6,
    });

    // Latitude rings (parallels) every 15°
    for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lng = -180 + (i / 96) * 360;
        pts.push(latLngToVec3(latDeg, lng, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, latDeg === 0 ? equatorMat : gridMat));
    }

    // Meridians (longitude lines) every 15°
    for (let lngDeg = -180; lngDeg < 180; lngDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lat = -90 + (i / 96) * 180;
        pts.push(latLngToVec3(lat, lngDeg, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, lngDeg === 0 ? equatorMat : gridMat));
    }

    scene.add(gridGroup);

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.08, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Lights — bright ambient so continents are clearly visible, with directional for 3D feel
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(5, 3, 5);
    scene.add(directional);

    // City markers
    const cityGroup = new THREE.Group();
    const cityMeshes: THREE.Mesh[] = [];
    CITIES.forEach((city) => {
      const pos = latLngToVec3(city.lat, city.lng, globeRadius * 1.01);

      const dotGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { city, baseScale: 1, ring: null };

      // Pulse ring — subtler, smoother
      const ringGeo = new THREE.RingGeometry(0.035, 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { city, isPulse: true, phase: Math.random() * Math.PI * 2 };
      dot.userData.ring = ring;

      cityGroup.add(dot);
      cityGroup.add(ring);
      cityMeshes.push(dot);
    });
    scene.add(cityGroup);

    // Drag rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    const targetRotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    let currentHoveredCity: City | null = null;
    let zoomAnimating = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      setMousePos({ x: e.clientX, y: e.clientY });
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotVelY = dx * 0.005;
        rotVelX = dy * 0.005;
        targetRotation.y += rotVelY;
        targetRotation.x += rotVelX;
        targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotation.x));
        prevX = e.clientX;
        prevY = e.clientY;
      }

      // Hover detection
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        const cityPos = target.getWorldPosition(new THREE.Vector3());
        const camDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
        const cityDir = cityPos.clone().normalize();
        if (cityDir.dot(camDir) > 0) {
          currentHoveredCity = target.userData.city;
          setHoveredCity(target.userData.city);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      currentHoveredCity = null;
      setHoveredCity(null);
      renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
    };

    const onClick = (e: MouseEvent) => {
      if (zoomAnimating) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        const cityPos = target.getWorldPosition(new THREE.Vector3());
        const camDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
        const cityDir = cityPos.clone().normalize();
        if (cityDir.dot(camDir) > 0) {
          // Zoom-in animation + CSS blur/black overlay before transitioning
          zoomAnimating = true;
          setZoomingIn(true);
          currentHoveredCity = null;
          setHoveredCity(null);
          const startZ = camera.position.z;
          const targetZ = 3.5;
          const startTime = performance.now();
          const animateZoom = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / 600);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            camera.position.z = startZ + (targetZ - startZ) * ease;
            if (t < 1) {
              requestAnimationFrame(animateZoom);
            } else {
              onCitySelect(target.userData.city);
            }
          };
          animateZoom();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(5, Math.min(15, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation
    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Auto rotation — paused when dragging, hovering, zooming, or at max zoom-in
      if (!isDragging) {
        rotVelY *= 0.95;
        rotVelX *= 0.95;
        if (!currentHoveredCity && !zoomAnimating && camera.position.z > 5.05) {
          targetRotation.y += 0.0008;
        }
      }
      globe.rotation.y = targetRotation.y;
      globe.rotation.x = targetRotation.x;
      gridGroup.rotation.y = targetRotation.y;
      gridGroup.rotation.x = targetRotation.x;
      cityGroup.rotation.y = targetRotation.y;
      cityGroup.rotation.x = targetRotation.x;

      // Pulse rings (subtler, slower)
      cityGroup.children.forEach((child) => {
        if (child.userData.isPulse) {
          const phase = (t * 1.0 + child.userData.phase) % (Math.PI * 2);
          const scale = 1 + Math.sin(phase) * 0.4;
          child.scale.set(scale, scale, scale);
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 - Math.sin(phase) * 0.3;
        }
      });

      // Highlight hovered dot — uses closure var for live state
      cityMeshes.forEach((dot) => {
        const isHov = currentHoveredCity && dot.userData.city.id === currentHoveredCity.id;
        const target = isHov ? 1.6 : 1;
        dot.scale.x += (target - dot.scale.x) * 0.2;
        dot.scale.y = dot.scale.x;
        dot.scale.z = dot.scale.x;
        (dot.material as THREE.MeshBasicMaterial).color.setHex(isHov ? 0xffffff : 0xfbbf24);
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      gridMat.dispose();
      equatorMat.dispose();
      gridGroup.children.forEach((line) => (line as THREE.Line).geometry.dispose());
    };
  }, [onCitySelect]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full transition-all duration-700 ease-out"
        style={{
          cursor: 'grab',
          filter: zoomingIn ? 'blur(20px) brightness(0.4)' : 'none',
        }}
      />

      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${zoomingIn ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="w-7 h-7 text-blue-700" />
            <div>
              <h1 className="text-xl font-light tracking-wide text-blue-900">
                Global Sustainable Tourism <span className="font-semibold">AI Lab</span>
              </h1>
              <p className="text-xs text-blue-600/70 mt-0.5">探索全球觀光永續挑戰</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700 font-medium">25 Cities</p>
            <p className="text-xs text-blue-500/70">點擊光點探索 · 拖拽旋轉</p>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className={`absolute bottom-6 left-0 right-0 text-center pointer-events-none transition-opacity duration-500 ${zoomingIn ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-xs text-blue-500/60 tracking-widest">DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A POINT</p>
      </div>

      {/* Hover intro card */}
      {hoveredCity && !zoomingIn && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: Math.min(mousePos.x + 20, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 312),
            top: Math.min(mousePos.y + 20, (typeof window !== 'undefined' ? window.innerHeight : 720) - 280),
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100 overflow-hidden w-72">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-cyan-600">
              <p className="text-[10px] text-cyan-100/90 tracking-[0.2em] font-medium">{hoveredCity.region.toUpperCase()}</p>
              <p className="text-lg font-semibold text-white leading-tight mt-0.5">{hoveredCity.name}</p>
              <p className="text-xs text-cyan-100 mt-0.5">{hoveredCity.nameZh} · {hoveredCity.country}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-700 leading-relaxed mb-3">{hoveredCity.intro}</p>
              <div className="flex flex-wrap gap-1">
                {hoveredCity.issues.map((issue, i) => (
                  <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {issue.icon} {issue.tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-[11px] text-blue-600 text-center border-t border-blue-100">
              點擊深入探索 →
            </div>
          </div>
        </div>
      )}

      {/* Black overlay during zoom-in transition */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-700 ease-out ${
          zoomingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

// ============ AI Chat ============
function AIChat({ city }: { city: City }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [city.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const presetQuestions = [
    `${city.nameZh}在 2030 年會面臨什麼樣的觀光危機？`,
    `有哪些 AI 技術可以幫助減少${city.nameZh}的遊客人流量？`,
    `比較${city.nameZh}與其他相似城市的成功轉型案例。`,
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const systemPrompt = `你是「Global Sustainable Tourism AI Lab」的 AI 永續旅遊顧問，專門協助學生分析全球觀光永續議題。

當前學生正在研究的城市：
- 城市：${city.name} (${city.nameZh}), ${city.country}
- 簡介：${city.intro}
- 主要挑戰：
${city.issues.map(i => `  ${i.icon} ${i.tag}：${i.detail}`).join('\n')}

請以教育性、客觀、有具體數據與案例的方式回答學生問題。回答時：
1. 使用學生提問的語言（繁體中文或英文）
2. 字數控制在 200 字以內，重點分明
3. 適當引用真實案例或可能的解決方案
4. 鼓勵學生進一步思考`;

    try {
      // NOTE: 走後端 proxy（待實作），避免在瀏覽器暴露 Anthropic API key
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const aiText: string =
        data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
        data.text ||
        '抱歉，我暫時無法回應，請稍後再試。';
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            '⚠️ 後端 AI proxy 尚未啟動。請設置 /api/chat 端點（連接 Anthropic API）後再試。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/20 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-white">AI 永續診斷</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/70 mb-3">選擇一個問題開始，或自由提問：</p>
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 border border-white/10 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-500/80 text-white rounded-br-sm'
                  : 'bg-white/20 text-white rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/20">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="輸入問題..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-3 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Student Board ============
function StudentBoard({ city, onClose }: { city: City; onClose: () => void }) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `board:${city.id}`;

  useEffect(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      const list: BoardPost[] = raw ? JSON.parse(raw) : [];
      setPosts(list.sort((a, b) => b.time - a.time));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  const submit = () => {
    if (!nickname.trim() || !content.trim() || content.length > 500) return;
    setSubmitting(true);
    const newPost: BoardPost = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      nickname: nickname.trim(),
      content: content.trim(),
      time: Date.now(),
    };
    const updated = [newPost, ...posts];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setPosts(updated);
      setContent('');
    } catch (err) {
      alert('提交失敗，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              💬 {city.nameZh} · 24小時智慧限流計畫
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">分享你的解決方案 · 全球學生都看得到</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b bg-blue-50/50">
          <div className="flex gap-2 mb-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="你的暱稱"
              className="w-32 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400"
            />
            <span className="text-xs text-gray-400 self-center">{content.length}/500</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="例如：早上 7-10 點開放當地居民優先進入，下午限流 4000 人..."
            className="w-full text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submit}
              disabled={submitting || !nickname.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {submitting ? '提交中...' : '提交建議'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && <p className="text-sm text-gray-400 text-center">載入中...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">還沒有人留言，成為第一個分享解決方案的學生吧！</p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{p.nickname}</span>
                <span className="text-xs text-gray-400">{formatTime(p.time)}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ City Dashboard ============
function CityDashboard({ city, onBack }: { city: City; onBack: () => void }) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${city.bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Globe</span>
        </button>
        <button
          onClick={() => setShowBoard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Student Board</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-6 pb-6 grid grid-cols-12 gap-6 h-[calc(100%-72px)]">
        {/* Left: city info & issues */}
        <div className="col-span-7 flex flex-col gap-4 overflow-y-auto pr-2">
          <div>
            <p className="text-xs tracking-widest text-cyan-300 mb-1">{city.region.toUpperCase()}</p>
            <h2 className="text-5xl font-light text-white">{city.name}</h2>
            <p className="text-lg text-white/80 mt-1">{city.nameZh} · {city.country}</p>
            <p className="text-sm text-white/70 mt-3 max-w-xl leading-relaxed">{city.intro}</p>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-semibold text-white tracking-wide">CORE CHALLENGES · 核心問題</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {city.issues.map((issue, i) => {
                const isOpen = expandedIssue === i;
                return (
                  <button
                    key={i}
                    onClick={() => setExpandedIssue(isOpen ? null : i)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isOpen
                        ? 'bg-white/20 border-cyan-300/50 col-span-2'
                        : 'bg-white/10 hover:bg-white/15 border-white/15'
                    } backdrop-blur-md`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{issue.icon}</span>
                      <span className="text-sm font-semibold text-white">{issue.tag}</span>
                    </div>
                    {isOpen && (
                      <p className="text-xs text-white/85 mt-3 leading-relaxed">{issue.detail}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Chat */}
        <div className="col-span-5">
          <AIChat city={city} />
        </div>
      </div>

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}
    </div>
  );
}

// ============ Main App ============
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleCitySelect = (city: City) => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCity(city);
      setTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCity(null);
      setTransitioning(false);
    }, 300);
  };

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      <div className={`w-full h-full transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {selectedCity ? (
          <CityDashboard city={selectedCity} onBack={handleBack} />
        ) : (
          <Globe onCitySelect={handleCitySelect} />
        )}
      </div>
    </div>
  );
}
