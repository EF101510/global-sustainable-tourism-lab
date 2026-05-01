export interface CityIssue {
  tag: string;
  icon: string;
  detail: string;
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
