export interface CityIssue {
  tag: string;
  icon: string;
  detail: string;
}

export interface CityDetails {
  /** 特色 — what makes the city iconic */
  features: string;
  /** 環境 — climate, ecosystems, natural setting */
  environment: string;
  /** 地緣因素 — location, accessibility, neighbours */
  geography: string;
  /** 農產 / 物產 — what's produced or exported */
  products: string;
  /** 經濟特色 — main industries, economic identity */
  economy: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  region: 'Europe' | 'Asia' | 'Americas' | 'Other';
  bg: string[];
  intro: string;
  issues: CityIssue[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BoardPost {
  id: string;
  nickname: string;
  content: string;
  time: number;
}
