import { Word } from '../types';

const STORAGE_KEY = "polish-learning-words";

export const saveWords = (words: Word[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch (error) {
    console.error("Ошибка при сохранении слов:", error);
  }
};

export const loadWords = (): Word[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Ошибка при загрузке слов:", error);
  }
  return [];
};

export const addWord = (word: Omit<Word, "id" | "createdAt">): Word => {
  const words = loadWords();
  const newWord: Word = {
    ...word,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  words.push(newWord);
  saveWords(words);
  return newWord;
};

export const updateWord = (id: string, updates: Partial<Word>): void => {
  const words = loadWords();
  const index = words.findIndex((w) => w.id === id);
  if (index !== -1) {
    words[index] = { ...words[index], ...updates };
    saveWords(words);
  }
};

export const deleteWord = (id: string): void => {
  const words = loadWords();
  const filtered = words.filter((w) => w.id !== id);
  saveWords(filtered);
};

export const exportWords = (): string => {
  const words = loadWords();
  return JSON.stringify(words, null, 2);
};

export const importWords = (jsonData: string): { success: boolean; count: number; error?: string } => {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) {
      return { success: false, count: 0, error: "Неверный формат данных. Ожидается массив слов." };
    }
    
    // Валидация структуры
    const validWords = imported.filter((word) => {
      return word && typeof word.polish === "string" && typeof word.russian === "string";
    });

    if (validWords.length === 0) {
      return { success: false, count: 0, error: "Не найдено валидных слов в файле." };
    }

    // Объединяем с существующими словами (избегаем дубликатов по ID)
    const existingWords = loadWords();
    const existingIds = new Set(existingWords.map((w) => w.id));
    const newWords = validWords.filter((w) => !existingIds.has(w.id));
    
    const merged = [...existingWords, ...newWords];
    saveWords(merged);
    
    return { success: true, count: newWords.length };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : "Ошибка при импорте данных" 
    };
  }
};

export const clearAllWords = (): void => {
  saveWords([]);
};
