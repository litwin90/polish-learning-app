export interface Word {
  id: string;
  polish: string;
  russian: string;
  examples: { pl: string; ru: string }; // Примеры для обоих языков (обязательное поле)
  category?: string;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; // Уровень CEFR
  knowsPlToRu: boolean; // Уровень 1: знаю PL→RU
  knowsRuToPl: boolean; // Уровень 2: знаю RU→PL
  lastReviewed?: number;
  createdAt?: number;
}

export interface WordsData {
  version: string;
  words: Word[];
}

export interface CardStats {
  totalWords: number;
  level0Words: number; // Не знаю (knowsPlToRu: false, knowsRuToPl: false)
  level1Words: number; // Знаю PL→RU (knowsPlToRu: true, knowsRuToPl: false)
  level2Words: number; // Знаю оба направления (knowsPlToRu: true, knowsRuToPl: true)
  reviewedToday: number;
}
