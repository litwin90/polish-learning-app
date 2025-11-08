import wordsData from '../../data/WORDS.json';
import { Word, WordsData } from '../types';
import { db } from './db';

const WORDS_DATA = wordsData as WordsData;

/**
 * Инициализация базы данных
 * Проверяет версию и загружает данные из JSON, если версия изменилась
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Получаем текущую версию из metadata
    const metadata = await db.metadata.get("version");
    const currentVersion = metadata?.version;

    // Если версии не совпадают или БД пустая - загружаем данные из JSON
    if (currentVersion !== WORDS_DATA.version) {
      console.log(
        `Версия изменилась: ${currentVersion} -> ${WORDS_DATA.version}. Загружаем новые данные...`
      );

      // Очищаем старые данные
      await db.words.clear();

      // Загружаем слова из JSON
      if (WORDS_DATA.words && WORDS_DATA.words.length > 0) {
        await db.words.bulkAdd(WORDS_DATA.words);
      }

      // Сохраняем новую версию
      await db.metadata.put({ id: "version", version: WORDS_DATA.version });

      console.log(
        `Загружено ${WORDS_DATA.words.length} слов из версии ${WORDS_DATA.version}`
      );
    } else {
      console.log(`Версия данных актуальна: ${currentVersion}`);
    }
  } catch (error) {
    console.error("Ошибка при инициализации базы данных:", error);
    throw error;
  }
};

/**
 * Получить все слова из базы данных
 */
export const getWords = async (): Promise<Word[]> => {
  try {
    return await db.words.toArray();
  } catch (error) {
    console.error("Ошибка при загрузке слов:", error);
    return [];
  }
};

/**
 * Обновить прогресс изучения слова
 */
export const updateWordProgress = async (
  id: string,
  updates: {
    knowsPlToRu?: boolean;
    knowsRuToPl?: boolean;
    needsReview?: boolean;
    isUnsure?: boolean;
  }
): Promise<void> => {
  try {
    const word = await db.words.get(id);
    if (!word) {
      throw new Error(`Слово с id ${id} не найдено`);
    }

    const updatedWord: Partial<Word> = {
      ...updates,
      lastReviewed: Date.now(),
    };

    await db.words.update(id, updatedWord);
  } catch (error) {
    console.error("Ошибка при обновлении прогресса:", error);
    throw error;
  }
};

/**
 * Инкрементирует patch версию (1.0.0 → 1.0.1)
 */
const incrementVersion = (version: string): string => {
  const parts = version.split(".");
  if (parts.length !== 3) {
    // Если формат неверный, возвращаем исходную версию
    return version;
  }
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return version;
  }

  return `${major}.${minor}.${patch + 1}`;
};

/**
 * Экспорт прогресса для сохранения в воркспейс
 * Возвращает данные в формате WORDS.json с текущим прогрессом
 * Автоматически инкрементирует patch версию при экспорте
 */
export const exportProgress = async (): Promise<{
  data: string;
  version: string;
}> => {
  try {
    const words = await db.words.toArray();
    const metadata = await db.metadata.get("version");
    const currentVersion = metadata?.version || WORDS_DATA.version;

    // Инкрементируем patch версию
    const newVersion = incrementVersion(currentVersion);

    // Сохраняем новую версию в metadata
    await db.metadata.put({ id: "version", version: newVersion });

    const exportData: WordsData = {
      version: newVersion,
      words,
    };

    return {
      data: JSON.stringify(exportData, null, 2),
      version: newVersion,
    };
  } catch (error) {
    console.error("Ошибка при экспорте прогресса:", error);
    throw error;
  }
};

/**
 * Импорт прогресса из файла
 * Используется для обновления WORDS.json в воркспейсе
 */
export const importProgress = async (
  jsonData: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const imported = JSON.parse(jsonData) as WordsData;

    if (!imported.version || !Array.isArray(imported.words)) {
      return {
        success: false,
        count: 0,
        error:
          "Неверный формат данных. Ожидается объект с полями version и words.",
      };
    }

    // Валидация структуры
    const validWords = imported.words.filter((word) => {
      return (
        word &&
        typeof word.id === "string" &&
        typeof word.polish === "string" &&
        typeof word.russian === "string" &&
        word.examples &&
        typeof word.examples === "object" &&
        typeof word.examples.pl === "string" &&
        typeof word.examples.ru === "string" &&
        typeof word.knowsPlToRu === "boolean" &&
        typeof word.knowsRuToPl === "boolean" &&
        (word.needsReview === undefined ||
          typeof word.needsReview === "boolean") &&
        (word.isUnsure === undefined || typeof word.isUnsure === "boolean")
      );
    });

    if (validWords.length === 0) {
      return {
        success: false,
        count: 0,
        error: "Не найдено валидных слов в файле.",
      };
    }

    // Очищаем старые данные и загружаем новые
    await db.words.clear();
    await db.words.bulkAdd(validWords);
    await db.metadata.put({ id: "version", version: imported.version });

    return { success: true, count: validWords.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error:
        error instanceof Error ? error.message : "Ошибка при импорте данных",
    };
  }
};

/**
 * Получить статистику по уровням
 */
export const getStats = async () => {
  try {
    const words = await db.words.toArray();
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    const stats = {
      totalWords: words.length,
      level0Words: words.filter((w) => !w.knowsPlToRu && !w.knowsRuToPl).length,
      level1Words: words.filter((w) => w.knowsPlToRu && !w.knowsRuToPl).length,
      level2Words: words.filter((w) => w.knowsPlToRu && w.knowsRuToPl).length,
      reviewedToday: words.filter(
        (w) => w.lastReviewed && w.lastReviewed >= todayStart
      ).length,
    };

    return stats;
  } catch (error) {
    console.error("Ошибка при получении статистики:", error);
    return {
      totalWords: 0,
      level0Words: 0,
      level1Words: 0,
      level2Words: 0,
      reviewedToday: 0,
    };
  }
};

/**
 * Получить слова по уровню
 */
export const getWordsByLevel = async (level: 0 | 1 | 2): Promise<Word[]> => {
  try {
    const allWords = await db.words.toArray();

    switch (level) {
      case 0:
        return allWords.filter((w) => !w.knowsPlToRu && !w.knowsRuToPl);
      case 1:
        return allWords.filter((w) => w.knowsPlToRu && !w.knowsRuToPl);
      case 2:
        return allWords.filter((w) => w.knowsPlToRu && w.knowsRuToPl);
      default:
        return [];
    }
  } catch (error) {
    console.error("Ошибка при получении слов по уровню:", error);
    return [];
  }
};

/**
 * Получить статистику по уровням языка (CEFR)
 */
export const getLanguageLevelStats = async () => {
  try {
    const words = await db.words.toArray();

    const stats = {
      A1: words.filter((w) => w.level === "A1").length,
      A2: words.filter((w) => w.level === "A2").length,
      B1: words.filter((w) => w.level === "B1").length,
      B2: words.filter((w) => w.level === "B2").length,
      C1: words.filter((w) => w.level === "C1").length,
      C2: words.filter((w) => w.level === "C2").length,
      withoutLevel: words.filter((w) => !w.level).length,
    };

    return stats;
  } catch (error) {
    console.error("Ошибка при получении статистики по уровням языка:", error);
    return {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      withoutLevel: 0,
    };
  }
};

/**
 * Получить статистику по уровням знания с разбивкой по уровням языка
 */
export const getKnowledgeLevelStatsWithLanguageBreakdown = async () => {
  try {
    const words = await db.words.toArray();

    const level0Words = words.filter((w) => !w.knowsPlToRu && !w.knowsRuToPl);
    const level1Words = words.filter((w) => w.knowsPlToRu && !w.knowsRuToPl);
    const level2Words = words.filter((w) => w.knowsPlToRu && w.knowsRuToPl);

    const breakdown = {
      level0: {
        total: level0Words.length,
        byLanguage: {
          A1: level0Words.filter((w) => w.level === "A1").length,
          A2: level0Words.filter((w) => w.level === "A2").length,
          B1: level0Words.filter((w) => w.level === "B1").length,
          B2: level0Words.filter((w) => w.level === "B2").length,
          C1: level0Words.filter((w) => w.level === "C1").length,
          C2: level0Words.filter((w) => w.level === "C2").length,
          withoutLevel: level0Words.filter((w) => !w.level).length,
        },
      },
      level1: {
        total: level1Words.length,
        byLanguage: {
          A1: level1Words.filter((w) => w.level === "A1").length,
          A2: level1Words.filter((w) => w.level === "A2").length,
          B1: level1Words.filter((w) => w.level === "B1").length,
          B2: level1Words.filter((w) => w.level === "B2").length,
          C1: level1Words.filter((w) => w.level === "C1").length,
          C2: level1Words.filter((w) => w.level === "C2").length,
          withoutLevel: level1Words.filter((w) => !w.level).length,
        },
      },
      level2: {
        total: level2Words.length,
        byLanguage: {
          A1: level2Words.filter((w) => w.level === "A1").length,
          A2: level2Words.filter((w) => w.level === "A2").length,
          B1: level2Words.filter((w) => w.level === "B1").length,
          B2: level2Words.filter((w) => w.level === "B2").length,
          C1: level2Words.filter((w) => w.level === "C1").length,
          C2: level2Words.filter((w) => w.level === "C2").length,
          withoutLevel: level2Words.filter((w) => !w.level).length,
        },
      },
    };

    return breakdown;
  } catch (error) {
    console.error("Ошибка при получении статистики с разбивкой:", error);
    return {
      level0: {
        total: 0,
        byLanguage: {
          A1: 0,
          A2: 0,
          B1: 0,
          B2: 0,
          C1: 0,
          C2: 0,
          withoutLevel: 0,
        },
      },
      level1: {
        total: 0,
        byLanguage: {
          A1: 0,
          A2: 0,
          B1: 0,
          B2: 0,
          C1: 0,
          C2: 0,
          withoutLevel: 0,
        },
      },
      level2: {
        total: 0,
        byLanguage: {
          A1: 0,
          A2: 0,
          B1: 0,
          B2: 0,
          C1: 0,
          C2: 0,
          withoutLevel: 0,
        },
      },
    };
  }
};

/**
 * Получить текущую версию данных
 */
export const getCurrentVersion = (): string => {
  return WORDS_DATA.version;
};

/**
 * Очистить все данные (для тестирования)
 */
export const clearAllWords = async (): Promise<void> => {
  await db.words.clear();
  await db.metadata.delete("version");
};
