export interface Word {
  id: string;
  polish: string;
  russian: string;
  example?: string;
  category?: string;
  createdAt: number;
  lastReviewed?: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface CardStats {
  totalWords: number;
  easyWords: number;
  mediumWords: number;
  hardWords: number;
  reviewedToday: number;
}
