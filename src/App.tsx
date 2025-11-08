import { useEffect, useState } from 'react';

import { FlashCard } from './components/FlashCard';
import { WordList } from './components/WordList';
import { Word } from './types';
import {
    exportProgress, getStats, getWords, importProgress, initializeDatabase, updateWordProgress
} from './utils/storage';

type View = "list" | "learning";

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
      } catch (error) {
        console.error("Ошибка при инициализации:", error);
        alert("Ошибка при загрузке данных. Пожалуйста, обновите страницу.");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleStartLearning = () => {
    if (words.length === 0) return;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentWordIndex(0);
    setCurrentView("learning");
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
      } catch (error) {
        console.error("Ошибка при обновлении прогресса:", error);
        alert("Ошибка при сохранении прогресса");
      }
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = await exportProgress();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `polish-words-progress-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(
        `Экспортировано ${words.length} слов(а) с прогрессом.\n\nСохраните этот файл в воркспейс как polish-learning-app/data/WORDS.json для обновления основной версии.`
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
            {currentView !== "learning" && (
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentView === "list"
                    ? "bg-primary-500 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setCurrentView("list")}
              >
                Список слов
              </button>
            )}
            {currentView === "learning" && (
              <button
                className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                onClick={() => {
                  setCurrentView("list");
                  getStats().then(setStats);
                }}
              >
                ← Вернуться к списку
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Статистика
              </h2>
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
            </div>

            {/* Выбор режима обучения */}
            <div className="bg-white rounded-xl p-4 shadow-xl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Режим обучения:
              </label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    learningMode === "pl-to-ru"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setLearningMode("pl-to-ru")}
                >
                  PL → RU
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    learningMode === "ru-to-pl"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setLearningMode("ru-to-pl")}
                >
                  RU → PL
                </button>
              </div>
            </div>

            <WordList
              words={words}
              onStartLearning={handleStartLearning}
              onExport={handleExport}
              onImport={handleImport}
            />
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
              Вернуться к списку
            </button>
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
