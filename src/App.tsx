import { useEffect, useState } from 'react';

import { FlashCard } from './components/FlashCard';
import { WordList } from './components/WordList';
import { Word } from './types';
import {
    exportProgress, getKnowledgeLevelStatsWithLanguageBreakdown, getLanguageLevelStatsWithKnowledgeBreakdown, getStats,
    getWords, importProgress, initializeDatabase, updateWordProgress
} from './utils/storage';

type View = "list" | "learning" | "words";

function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentView, setCurrentView] = useState<View>("list");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [learningMode, setLearningMode] = useState<"pl-to-ru" | "ru-to-pl">(
    "pl-to-ru"
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [stats, setStats] = useState({
    totalWords: 0,
    level0Words: 0,
    level1Words: 0,
    level2Words: 0,
    reviewedToday: 0,
  });
  const [knowledgeBreakdown, setKnowledgeBreakdown] = useState({
    level0: {
      total: 0,
      byLanguage: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, withoutLevel: 0 },
    },
    level1: {
      total: 0,
      byLanguage: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, withoutLevel: 0 },
    },
    level2: {
      total: 0,
      byLanguage: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, withoutLevel: 0 },
    },
  });
  const [languageBreakdown, setLanguageBreakdown] = useState({
    A1: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    A2: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    B1: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    B2: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    C1: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    C2: { total: 0, byKnowledge: { level0: 0, level1: 0, level2: 0 } },
    withoutLevel: {
      total: 0,
      byKnowledge: { level0: 0, level1: 0, level2: 0 },
    },
  });
  const [statsViewMode, setStatsViewMode] = useState<
    "knowledge" | "language" | "inverted"
  >("knowledge");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<{
    filterLevels: Set<0 | 1 | 2>;
    filterLanguageLevels: Set<string>;
    filterNeedsReview?: boolean | null;
  } | null>(null);

  // Инициализация базы данных при загрузке
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        await initializeDatabase();
        const loadedWords = await getWords();
        setWords(loadedWords);
        const loadedStats = await getStats();
        setStats(loadedStats);
        const loadedBreakdown =
          await getKnowledgeLevelStatsWithLanguageBreakdown();
        setKnowledgeBreakdown(loadedBreakdown);
        const loadedLanguageBreakdown =
          await getLanguageLevelStatsWithKnowledgeBreakdown();
        setLanguageBreakdown(loadedLanguageBreakdown);
      } catch (error) {
        console.error("Ошибка при инициализации:", error);
        alert("Ошибка при загрузке данных. Пожалуйста, обновите страницу.");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleStartLearning = (filters?: {
    filterLevels: Set<0 | 1 | 2>;
    filterLanguageLevels: Set<string>;
    filterNeedsReview?: boolean | null;
  }) => {
    if (words.length === 0) return;

    // Сохраняем фильтры и показываем выбор режима
    setPendingFilters(filters || null);
    setShowModeSelector(true);
  };

  const confirmStartLearning = () => {
    if (!pendingFilters) return;

    let filteredWords = [...words];

    // Фильтр по уровню знания
    if (
      pendingFilters.filterLevels.size > 0 &&
      pendingFilters.filterLevels.size < 3
    ) {
      filteredWords = filteredWords.filter((word) => {
        const level =
          word.knowsPlToRu && word.knowsRuToPl ? 2 : word.knowsPlToRu ? 1 : 0;
        return pendingFilters.filterLevels.has(level as 0 | 1 | 2);
      });
    }

    // Фильтр по уровню языка
    if (
      pendingFilters.filterLanguageLevels.size > 0 &&
      pendingFilters.filterLanguageLevels.size < 6
    ) {
      filteredWords = filteredWords.filter((word) => {
        if (!word.level) return false;
        return pendingFilters.filterLanguageLevels.has(word.level);
      });
    }

    // Фильтр по needsReview
    if (
      pendingFilters.filterNeedsReview !== undefined &&
      pendingFilters.filterNeedsReview !== null
    ) {
      filteredWords = filteredWords.filter((word) => {
        return pendingFilters.filterNeedsReview
          ? word.needsReview === true
          : word.needsReview !== true;
      });
    }

    if (filteredWords.length === 0) {
      alert("Нет слов, соответствующих выбранным фильтрам");
      setShowModeSelector(false);
      setPendingFilters(null);
      return;
    }

    const shuffled = filteredWords.sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentWordIndex(0);
    setCurrentView("learning");
    setShowModeSelector(false);
    setPendingFilters(null);
  };

  const handleNextCard = () => {
    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Все карточки пройдены
      if (confirm("Вы прошли все карточки! Начать заново?")) {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
        setCurrentWordIndex(0);
      } else {
        setCurrentView("list");
        // Обновляем статистику
        getStats().then(setStats);
        getKnowledgeLevelStatsWithLanguageBreakdown().then(
          setKnowledgeBreakdown
        );
        getLanguageLevelStatsWithKnowledgeBreakdown().then(
          setLanguageBreakdown
        );
      }
    }
  };

  const handlePreviousCard = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const handleMarkLevel = async (
    knowsPlToRu: boolean,
    knowsRuToPl: boolean
  ) => {
    const currentWord = shuffledWords[currentWordIndex];
    if (currentWord) {
      try {
        await updateWordProgress(currentWord.id, {
          knowsPlToRu,
          knowsRuToPl,
        });
        // Обновляем локальное состояние
        const updatedWords = await getWords();
        setWords(updatedWords);
        // Обновляем текущее слово в shuffledWords
        const updatedWord = updatedWords.find((w) => w.id === currentWord.id);
        if (updatedWord) {
          const newShuffled = [...shuffledWords];
          newShuffled[currentWordIndex] = updatedWord;
          setShuffledWords(newShuffled);
        }
        // Обновляем статистику
        const updatedStats = await getStats();
        setStats(updatedStats);
        const updatedBreakdown =
          await getKnowledgeLevelStatsWithLanguageBreakdown();
        setKnowledgeBreakdown(updatedBreakdown);
        const updatedLanguageBreakdown =
          await getLanguageLevelStatsWithKnowledgeBreakdown();
        setLanguageBreakdown(updatedLanguageBreakdown);
      } catch (error) {
        console.error("Ошибка при обновлении прогресса:", error);
        alert("Ошибка при сохранении прогресса");
      }
    }
  };

  const handleToggleNeedsReview = async (id: string, needsReview: boolean) => {
    try {
      await updateWordProgress(id, { needsReview });
      // Обновляем локальное состояние
      const updatedWords = await getWords();
      setWords(updatedWords);
      // Обновляем текущее слово в shuffledWords, если оно есть
      const updatedWord = updatedWords.find((w) => w.id === id);
      if (updatedWord) {
        const wordIndex = shuffledWords.findIndex((w) => w.id === id);
        if (wordIndex !== -1) {
          const newShuffled = [...shuffledWords];
          newShuffled[wordIndex] = updatedWord;
          setShuffledWords(newShuffled);
        }
      }
      // Обновляем статистику
      const updatedStats = await getStats();
      setStats(updatedStats);
      const updatedBreakdown =
        await getKnowledgeLevelStatsWithLanguageBreakdown();
      setKnowledgeBreakdown(updatedBreakdown);
      const updatedLanguageBreakdown =
        await getLanguageLevelStatsWithKnowledgeBreakdown();
      setLanguageBreakdown(updatedLanguageBreakdown);
    } catch (error) {
      console.error("Ошибка при обновлении статуса проверки:", error);
      alert("Ошибка при сохранении статуса проверки");
    }
  };

  const handleToggleUnsure = async (id: string, isUnsure: boolean) => {
    try {
      await updateWordProgress(id, { isUnsure });
      // Обновляем локальное состояние
      const updatedWords = await getWords();
      setWords(updatedWords);
      // Обновляем текущее слово в shuffledWords, если оно есть
      const updatedWord = updatedWords.find((w) => w.id === id);
      if (updatedWord) {
        const wordIndex = shuffledWords.findIndex((w) => w.id === id);
        if (wordIndex !== -1) {
          const newShuffled = [...shuffledWords];
          newShuffled[wordIndex] = updatedWord;
          setShuffledWords(newShuffled);
        }
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса сомнения:", error);
      alert("Ошибка при сохранении статуса сомнения");
    }
  };

  const handleMarkKnowsPl = async (id: string) => {
    try {
      const word = words.find((w) => w.id === id);
      if (word) {
        await updateWordProgress(id, {
          knowsPlToRu: true,
          knowsRuToPl: word.knowsRuToPl,
        });
        // Обновляем локальное состояние
        const updatedWords = await getWords();
        setWords(updatedWords);
        // Обновляем статистику
        const updatedStats = await getStats();
        setStats(updatedStats);
        const updatedBreakdown =
          await getKnowledgeLevelStatsWithLanguageBreakdown();
        setKnowledgeBreakdown(updatedBreakdown);
        const updatedLanguageBreakdown =
          await getLanguageLevelStatsWithKnowledgeBreakdown();
        setLanguageBreakdown(updatedLanguageBreakdown);
      }
    } catch (error) {
      console.error("Ошибка при обновлении прогресса:", error);
      alert("Ошибка при сохранении прогресса");
    }
  };

  const handleExport = async () => {
    try {
      const { data: jsonData, version } = await exportProgress();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Формат: polish-words-progress-YYYY-MM-DD_HH-MM-SS.json
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .split(".")[0];
      a.download = `polish-words-progress-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(
        `Экспортировано ${words.length} слов(а) с прогрессом.\nВерсия: ${version}\n\nСохраните этот файл в воркспейс как polish-learning-app/data/WORDS.json для обновления основной версии.`
      );
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Ошибка при экспорте данных");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        try {
          const result = await importProgress(text);
          if (result.success) {
            const loadedWords = await getWords();
            setWords(loadedWords);
            const loadedStats = await getStats();
            setStats(loadedStats);
            const loadedBreakdown =
              await getKnowledgeLevelStatsWithLanguageBreakdown();
            setKnowledgeBreakdown(loadedBreakdown);
            const loadedLanguageBreakdown =
              await getLanguageLevelStatsWithKnowledgeBreakdown();
            setLanguageBreakdown(loadedLanguageBreakdown);
            alert(
              `Импортировано ${result.count} слов(а). Всего слов: ${loadedWords.length}`
            );
          } else {
            alert(`Ошибка импорта: ${result.error}`);
          }
        } catch (error) {
          console.error("Ошибка при импорте:", error);
          alert("Ошибка при импорте данных");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const currentWord = shuffledWords[currentWordIndex];

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500">
        <div className="bg-white rounded-xl p-8 shadow-xl text-center">
          <p className="text-gray-600 text-lg">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500">
      <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              <span className="md:hidden">🇵🇱</span>
              <span className="hidden md:inline">
                🇵🇱 Изучение польского языка
              </span>
            </h1>
            <nav className="flex gap-2 flex-wrap">
              {currentView === "list" && (
                <>
                  <button className="px-4 py-2 rounded-lg font-semibold bg-primary-500 text-white shadow-lg transition-all">
                    Главная
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    onClick={() => setCurrentView("words")}
                  >
                    Все слова
                  </button>
                </>
              )}
              {currentView === "words" && (
                <>
                  <button
                    className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    onClick={() => setCurrentView("list")}
                  >
                    Главная
                  </button>
                  <button className="px-4 py-2 rounded-lg font-semibold bg-primary-500 text-white shadow-lg transition-all">
                    Все слова
                  </button>
                </>
              )}
              {currentView === "learning" && (
                <button
                  className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                  onClick={() => {
                    setCurrentView("list");
                    getStats().then(setStats);
                    getKnowledgeLevelStatsWithLanguageBreakdown().then(
                      setKnowledgeBreakdown
                    );
                    getLanguageLevelStatsWithKnowledgeBreakdown().then(
                      setLanguageBreakdown
                    );
                  }}
                >
                  ← Вернуться
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 w-full max-w-4xl">
        {currentView === "list" && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Статистика</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Инверсия:</span>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      statsViewMode === "inverted"
                        ? "bg-primary-500"
                        : "bg-gray-300"
                    }`}
                    onClick={() =>
                      setStatsViewMode(
                        statsViewMode === "inverted" ? "knowledge" : "inverted"
                      )
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        statsViewMode === "inverted"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              {statsViewMode === "knowledge" ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats.totalWords}
                    </div>
                    <div className="text-sm text-gray-600">Всего слов</div>
                  </div>
                  {[
                    {
                      level: 0,
                      label: "Уровень 0 - Не знаю",
                      color: "gray",
                      data: knowledgeBreakdown.level0,
                    },
                    {
                      level: 1,
                      label: "Уровень 1 - Знаю PL→RU",
                      color: "blue",
                      data: knowledgeBreakdown.level1,
                    },
                    {
                      level: 2,
                      label: "Уровень 2 - Знаю оба",
                      color: "green",
                      data: knowledgeBreakdown.level2,
                    },
                  ].map(({ level, label, color, data }) => (
                    <div key={level} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          {label}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            color === "gray"
                              ? "text-gray-600"
                              : color === "blue"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {data.total}
                        </span>
                      </div>
                      {data.total > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                          {[
                            {
                              key: "A1",
                              count: data.byLanguage.A1,
                              color: "bg-blue-400",
                            },
                            {
                              key: "A2",
                              count: data.byLanguage.A2,
                              color: "bg-blue-500",
                            },
                            {
                              key: "B1",
                              count: data.byLanguage.B1,
                              color: "bg-green-400",
                            },
                            {
                              key: "B2",
                              count: data.byLanguage.B2,
                              color: "bg-green-500",
                            },
                            {
                              key: "C1",
                              count: data.byLanguage.C1,
                              color: "bg-purple-400",
                            },
                            {
                              key: "C2",
                              count: data.byLanguage.C2,
                              color: "bg-purple-500",
                            },
                            {
                              key: "Без уровня",
                              count: data.byLanguage.withoutLevel,
                              color: "bg-gray-400",
                            },
                          ]
                            .filter((item) => item.count > 0)
                            .map((item) => (
                              <div
                                key={item.key}
                                className={`${item.color} flex items-center justify-center text-white text-xs font-semibold transition-all`}
                                style={{
                                  width: `${(item.count / data.total) * 100}%`,
                                }}
                                title={`${item.key}: ${item.count}`}
                              >
                                {item.count > 0 &&
                                  (item.count / data.total) * 100 > 5 &&
                                  item.count}
                              </div>
                            ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {[
                          { key: "A1", count: data.byLanguage.A1 },
                          { key: "A2", count: data.byLanguage.A2 },
                          { key: "B1", count: data.byLanguage.B1 },
                          { key: "B2", count: data.byLanguage.B2 },
                          { key: "C1", count: data.byLanguage.C1 },
                          { key: "C2", count: data.byLanguage.C2 },
                          {
                            key: "Без уровня",
                            count: data.byLanguage.withoutLevel,
                          },
                        ]
                          .filter((item) => item.count > 0)
                          .map((item) => (
                            <span key={item.key}>
                              {item.key}: {item.count}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2 border-t">
                    <div className="text-lg font-bold text-purple-600">
                      {stats.reviewedToday}
                    </div>
                    <div className="text-sm text-gray-600">
                      Просмотрено сегодня
                    </div>
                  </div>
                </div>
              ) : statsViewMode === "inverted" ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats.totalWords}
                    </div>
                    <div className="text-sm text-gray-600">Всего слов</div>
                  </div>
                  {[
                    {
                      key: "A1",
                      label: "A1",
                      color: "blue",
                      data: languageBreakdown.A1,
                    },
                    {
                      key: "A2",
                      label: "A2",
                      color: "blue",
                      data: languageBreakdown.A2,
                    },
                    {
                      key: "B1",
                      label: "B1",
                      color: "green",
                      data: languageBreakdown.B1,
                    },
                    {
                      key: "B2",
                      label: "B2",
                      color: "green",
                      data: languageBreakdown.B2,
                    },
                    {
                      key: "C1",
                      label: "C1",
                      color: "purple",
                      data: languageBreakdown.C1,
                    },
                    {
                      key: "C2",
                      label: "C2",
                      color: "purple",
                      data: languageBreakdown.C2,
                    },
                    {
                      key: "withoutLevel",
                      label: "Без уровня",
                      color: "gray",
                      data: languageBreakdown.withoutLevel,
                    },
                  ].map(({ key, label, color, data }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          {label}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            color === "gray"
                              ? "text-gray-600"
                              : color === "blue"
                              ? "text-blue-600"
                              : color === "green"
                              ? "text-green-600"
                              : "text-purple-600"
                          }`}
                        >
                          {data.total}
                        </span>
                      </div>
                      {data.total > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                          {[
                            {
                              key: "Уровень 0",
                              count: data.byKnowledge.level0,
                              color: "bg-gray-500",
                            },
                            {
                              key: "Уровень 1",
                              count: data.byKnowledge.level1,
                              color: "bg-blue-500",
                            },
                            {
                              key: "Уровень 2",
                              count: data.byKnowledge.level2,
                              color: "bg-green-500",
                            },
                          ]
                            .filter((item) => item.count > 0)
                            .map((item) => (
                              <div
                                key={item.key}
                                className={`${item.color} flex items-center justify-center text-white text-xs font-semibold transition-all`}
                                style={{
                                  width: `${(item.count / data.total) * 100}%`,
                                }}
                                title={`${item.key}: ${item.count}`}
                              >
                                {item.count > 0 &&
                                  (item.count / data.total) * 100 > 5 &&
                                  item.count}
                              </div>
                            ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {[
                          {
                            key: "Уровень 0",
                            count: data.byKnowledge.level0,
                          },
                          {
                            key: "Уровень 1",
                            count: data.byKnowledge.level1,
                          },
                          {
                            key: "Уровень 2",
                            count: data.byKnowledge.level2,
                          },
                        ]
                          .filter((item) => item.count > 0)
                          .map((item) => (
                            <span key={item.key}>
                              {item.key}: {item.count}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2 border-t">
                    <div className="text-lg font-bold text-purple-600">
                      {stats.reviewedToday}
                    </div>
                    <div className="text-sm text-gray-600">
                      Просмотрено сегодня
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {currentView === "learning" && currentWord && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-semibold text-gray-800 shadow-lg">
              Карточка {currentWordIndex + 1} из {shuffledWords.length}
            </div>
            <FlashCard
              word={currentWord}
              onNext={handleNextCard}
              onPrevious={handlePreviousCard}
              onMarkLevel={handleMarkLevel}
              onToggleNeedsReview={handleToggleNeedsReview}
              onToggleUnsure={handleToggleUnsure}
              mode={learningMode}
            />
          </div>
        )}

        {currentView === "learning" && !currentWord && (
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <p className="text-gray-600 mb-4 text-lg">
              Нет слов для изучения. Загрузите слова из WORDS.json.
            </p>
            <button
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md"
              onClick={() => setCurrentView("list")}
            >
              Вернуться
            </button>
          </div>
        )}

        {currentView === "words" && (
          <WordList
            words={words}
            onStartLearning={handleStartLearning}
            onExport={handleExport}
            onImport={handleImport}
            onToggleNeedsReview={handleToggleNeedsReview}
            onMarkKnowsPl={handleMarkKnowsPl}
          />
        )}

        {/* Модальное окно выбора режима обучения */}
        {showModeSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Выберите режим обучения
              </h3>
              <div className="space-y-3 mb-6">
                <button
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                    learningMode === "pl-to-ru"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setLearningMode("pl-to-ru")}
                >
                  PL → RU (Польский → Русский)
                </button>
                <button
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                    learningMode === "ru-to-pl"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setLearningMode("ru-to-pl")}
                >
                  RU → PL (Русский → Польский)
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  onClick={() => {
                    setShowModeSelector(false);
                    setPendingFilters(null);
                  }}
                >
                  Отмена
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all"
                  onClick={confirmStartLearning}
                >
                  Начать
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white/95 backdrop-blur-sm py-4 text-center text-gray-600 text-sm">
        <p>Создано для подготовки к экзамену TELC B1</p>
      </footer>
    </div>
  );
}

export default App;
