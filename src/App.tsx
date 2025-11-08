import { useEffect, useState } from 'react';

import { FlashCard } from './components/FlashCard';
import { WordList } from './components/WordList';
import { Word } from './types';
import {
    exportProgress, getLanguageLevelStats, getStats, getWords, importProgress, initializeDatabase, updateWordProgress
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
  const [languageLevelStats, setLanguageLevelStats] = useState({
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
    withoutLevel: 0,
  });
  const [statsViewMode, setStatsViewMode] = useState<"knowledge" | "language">(
    "knowledge"
  );
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
        const loadedLanguageStats = await getLanguageLevelStats();
        setLanguageLevelStats(loadedLanguageStats);
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
        getLanguageLevelStats().then(setLanguageLevelStats);
      }
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
        const updatedLanguageStats = await getLanguageLevelStats();
        setLanguageLevelStats(updatedLanguageStats);
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
    } catch (error) {
      console.error("Ошибка при обновлении статуса проверки:", error);
      alert("Ошибка при сохранении статуса проверки");
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
            const loadedLanguageStats = await getLanguageLevelStats();
            setLanguageLevelStats(loadedLanguageStats);
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
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
            🇵🇱 Изучение польского языка
          </h1>
          <nav className="flex justify-center gap-2 flex-wrap">
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
                  getLanguageLevelStats().then(setLanguageLevelStats);
                }}
              >
                ← Вернуться
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 w-full max-w-4xl">
        {currentView === "list" && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Статистика</h2>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      statsViewMode === "knowledge"
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setStatsViewMode("knowledge")}
                  >
                    По уровню знания
                  </button>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      statsViewMode === "language"
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setStatsViewMode("language")}
                  >
                    По уровню языка
                  </button>
                </div>
              </div>
              {statsViewMode === "knowledge" ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats.totalWords}
                    </div>
                    <div className="text-sm text-gray-600">Всего слов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.level0Words}
                    </div>
                    <div className="text-sm text-gray-600">Уровень 0</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.level1Words}
                    </div>
                    <div className="text-sm text-gray-600">Уровень 1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.level2Words}
                    </div>
                    <div className="text-sm text-gray-600">Уровень 2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.reviewedToday}
                    </div>
                    <div className="text-sm text-gray-600">Сегодня</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats.totalWords}
                    </div>
                    <div className="text-sm text-gray-600">Всего слов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {languageLevelStats.A1}
                    </div>
                    <div className="text-sm text-gray-600">A1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {languageLevelStats.A2}
                    </div>
                    <div className="text-sm text-gray-600">A2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {languageLevelStats.B1}
                    </div>
                    <div className="text-sm text-gray-600">B1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {languageLevelStats.B2}
                    </div>
                    <div className="text-sm text-gray-600">B2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {languageLevelStats.C1 + languageLevelStats.C2}
                    </div>
                    <div className="text-sm text-gray-600">C1-C2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {languageLevelStats.withoutLevel}
                    </div>
                    <div className="text-sm text-gray-600">Без уровня</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-lg">
                  Просмотрите все слова, отсортируйте и отфильтруйте их
                </p>
                <button
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md active:scale-95"
                  onClick={() => setCurrentView("words")}
                >
                  Перейти к списку слов
                </button>
              </div>
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
              onMarkLevel={handleMarkLevel}
              onToggleNeedsReview={handleToggleNeedsReview}
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
            onBack={() => setCurrentView("list")}
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
