export interface Word {
  id: string;
  polish: string;
  russian: string;
  example?: string; // Старое поле для обратной совместимости
  examples?: { pl: string; ru: string }; // Новое поле с примерами для обоих языков
  category?: string;
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
