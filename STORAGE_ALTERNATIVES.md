# Альтернативы localStorage для приложения изучения польского языка

## 📊 Сравнение вариантов

| Вариант | Объем данных | Производительность | Сложность | Офлайн | Рекомендация |
|---------|--------------|-------------------|-----------|--------|--------------|
| **localStorage** (текущий) | ~5-10 MB | Синхронный, медленный | Простая | ✅ | Для небольших данных |
| **IndexedDB** | До 50% диска | Асинхронный, быстрый | Средняя | ✅ | Для больших объемов |
| **Dexie.js** | До 50% диска | Асинхронный, быстрый | Простая | ✅ | ⭐ **Лучший выбор** |
| **localForage** | До 50% диска | Асинхронный, средний | Очень простая | ✅ | Универсальный fallback |
| **sessionStorage** | ~5-10 MB | Синхронный, медленный | Простая | ✅ | Только для сессии |

## 🎯 Рекомендация: Dexie.js

**Преимущества:**
- ✅ Простой API (похож на localStorage)
- ✅ Асинхронные операции (не блокирует UI)
- ✅ Поддержка индексов для быстрого поиска
- ✅ Большой объем данных (до 50% диска)
- ✅ Поддержка транзакций
- ✅ TypeScript поддержка из коробки

**Недостатки:**
- ❌ Требует установки библиотеки (~15 KB)
- ❌ Более сложная настройка, чем localStorage

## 📦 Установка Dexie.js

```bash
npm install dexie
```

## 🔄 Вариант 1: Dexie.js (Рекомендуется)

### Реализация storage.ts с Dexie.js

```typescript
import Dexie, { Table } from 'dexie';
import { Word } from '../types';

class PolishLearningDB extends Dexie {
  words!: Table<Word, string>;

  constructor() {
    super('PolishLearningDB');
    this.version(1).stores({
      words: 'id, polish, russian, category, difficulty, createdAt, lastReviewed'
    });
  }
}

const db = new PolishLearningDB();

export const saveWords = async (words: Word[]): Promise<void> => {
  try {
    await db.words.clear();
    await db.words.bulkAdd(words);
  } catch (error) {
    console.error("Ошибка при сохранении слов:", error);
  }
};

export const loadWords = async (): Promise<Word[]> => {
  try {
    return await db.words.toArray();
  } catch (error) {
    console.error("Ошибка при загрузке слов:", error);
    return [];
  }
};

export const addWord = async (word: Omit<Word, "id" | "createdAt">): Promise<Word> => {
  const newWord: Word = {
    ...word,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  await db.words.add(newWord);
  return newWord;
};

export const updateWord = async (id: string, updates: Partial<Word>): Promise<void> => {
  await db.words.update(id, updates);
};

export const deleteWord = async (id: string): Promise<void> => {
  await db.words.delete(id);
};

export const exportWords = async (): Promise<string> => {
  const words = await loadWords();
  return JSON.stringify(words, null, 2);
};

export const importWords = async (jsonData: string): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) {
      return { success: false, count: 0, error: "Неверный формат данных. Ожидается массив слов." };
    }

    const validWords = imported.filter((word) => {
      return word && typeof word.polish === "string" && typeof word.russian === "string";
    });

    if (validWords.length === 0) {
      return { success: false, count: 0, error: "Не найдено валидных слов в файле." };
    }

    const existingWords = await loadWords();
    const existingIds = new Set(existingWords.map((w) => w.id));
    const newWords = validWords.filter((w) => !existingIds.has(w.id));

    if (newWords.length > 0) {
      await db.words.bulkAdd(newWords);
    }

    return { success: true, count: newWords.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Ошибка при импорте данных"
    };
  }
};

export const clearAllWords = async (): Promise<void> => {
  await db.words.clear();
};

// Дополнительные функции для поиска и фильтрации
export const searchWords = async (query: string): Promise<Word[]> => {
  const lowerQuery = query.toLowerCase();
  return await db.words
    .filter(word =>
      word.polish.toLowerCase().includes(lowerQuery) ||
      word.russian.toLowerCase().includes(lowerQuery)
    )
    .toArray();
};

export const getWordsByCategory = async (category: string): Promise<Word[]> => {
  return await db.words.where('category').equals(category).toArray();
};

export const getWordsByDifficulty = async (difficulty: Word["difficulty"]): Promise<Word[]> => {
  return await db.words.where('difficulty').equals(difficulty).toArray();
};
```

### Изменения в App.tsx

Нужно сделать функции асинхронными:

```typescript
useEffect(() => {
  const loadData = async () => {
    const loadedWords = await loadWords();
    setWords(loadedWords);
  };
  loadData();
}, []);

const handleAddWord = async (wordData: Omit<Word, "id" | "createdAt">) => {
  if (editingWord) {
    await updateWord(editingWord.id, wordData);
    setWords(await loadWords());
    setEditingWord(undefined);
    setCurrentView("list");
  } else {
    await addWord(wordData);
    setWords(await loadWords());
    setCurrentView("list");
  }
};
```

## 🔄 Вариант 2: localForage (Универсальный fallback)

### Установка
```bash
npm install localforage
```

### Реализация
```typescript
import localforage from 'localforage';
import { Word } from '../types';

const STORAGE_KEY = "polish-learning-words";

localforage.config({
  name: 'PolishLearning',
  storeName: 'words',
  description: 'Хранилище слов для изучения польского языка'
});

export const saveWords = async (words: Word[]): Promise<void> => {
  try {
    await localforage.setItem(STORAGE_KEY, words);
  } catch (error) {
    console.error("Ошибка при сохранении слов:", error);
  }
};

export const loadWords = async (): Promise<Word[]> => {
  try {
    const words = await localforage.getItem<Word[]>(STORAGE_KEY);
    return words || [];
  } catch (error) {
    console.error("Ошибка при загрузке слов:", error);
    return [];
  }
};

// Остальные функции аналогично, но с async/await
```

## 🔄 Вариант 3: Нативный IndexedDB

Более сложный, но без зависимостей:

```typescript
const DB_NAME = 'PolishLearningDB';
const DB_VERSION = 1;
const STORE_NAME = 'words';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('polish', 'polish', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };
  });
};

export const saveWords = async (words: Word[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await store.clear();
  await Promise.all(words.map(word => store.add(word)));
};

export const loadWords = async (): Promise<Word[]> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
```

## 🔄 Вариант 4: Гибридный подход (localStorage + IndexedDB)

Использовать localStorage для небольших данных, IndexedDB для больших:

```typescript
const STORAGE_LIMIT = 100; // слов

export const saveWords = async (words: Word[]): Promise<void> => {
  if (words.length <= STORAGE_LIMIT) {
    // Используем localStorage для небольших объемов
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } else {
    // Используем IndexedDB для больших объемов
    await saveToIndexedDB(words);
  }
};
```

## 📈 Когда переходить на альтернативу?

**Оставайтесь с localStorage, если:**
- ✅ У вас < 1000 слов
- ✅ Данные < 5 MB
- ✅ Нет проблем с производительностью

**Переходите на IndexedDB/Dexie, если:**
- ⚠️ У вас > 1000 слов
- ⚠️ Данные > 5 MB
- ⚠️ Заметны задержки при сохранении/загрузке
- ⚠️ Нужен быстрый поиск и фильтрация
- ⚠️ Планируете добавлять больше функций (статистика, аналитика)

## 🚀 Рекомендуемый план миграции

1. **Установить Dexie.js**: `npm install dexie`
2. **Создать новый storage.ts** с Dexie.js
3. **Добавить миграцию данных** из localStorage в IndexedDB
4. **Обновить App.tsx** для работы с async функциями
5. **Протестировать** на существующих данных

## 💡 Дополнительные возможности с IndexedDB

С IndexedDB можно добавить:
- 🔍 Быстрый поиск по индексам
- 📊 Статистику по категориям
- 🎯 Фильтрацию по сложности
- 📈 Аналитику прогресса
- 🔄 Синхронизацию между устройствами (через сервер)

