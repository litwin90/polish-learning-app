import { useEffect, useState } from 'react';

import { FlashCard } from './components/FlashCard';
import { WordForm } from './components/WordForm';
import { WordList } from './components/WordList';
import { Word } from './types';
import { addWord, clearAllWords, deleteWord, exportWords, importWords, loadWords, updateWord } from './utils/storage';

type View = "list" | "learning" | "add" | "edit";

function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentView, setCurrentView] = useState<View>("list");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [editingWord, setEditingWord] = useState<Word | undefined>();
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);

  useEffect(() => {
    const loadedWords = loadWords();
    setWords(loadedWords);
  }, []);

  const handleAddWord = (wordData: Omit<Word, "id" | "createdAt">) => {
    if (editingWord) {
      updateWord(editingWord.id, wordData);
      setWords(loadWords());
      setEditingWord(undefined);
      setCurrentView("list");
    } else {
      addWord(wordData);
      setWords(loadWords());
      setCurrentView("list");
    }
  };

  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setCurrentView("edit");
  };

  const handleDeleteWord = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить это слово?")) {
      deleteWord(id);
      setWords(loadWords());
    }
  };

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
      }
    }
  };

  const handleMarkDifficulty = (difficulty: Word["difficulty"]) => {
    const currentWord = shuffledWords[currentWordIndex];
    if (currentWord) {
      updateWord(currentWord.id, {
        difficulty,
        lastReviewed: Date.now(),
      });
      setWords(loadWords());
    }
  };

  const handleExport = () => {
    const jsonData = exportWords();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polish-words-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Экспортировано ${words.length} слов(а)`);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = importWords(text);
        if (result.success) {
          setWords(loadWords());
          alert(
            `Импортировано ${result.count} новых слов(а). Всего слов: ${
              loadWords().length
            }`
          );
        } else {
          alert(`Ошибка импорта: ${result.error}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Вы уверены, что хотите удалить ВСЕ слова? Это действие нельзя отменить!"
      )
    ) {
      if (confirm("Это последнее предупреждение. Удалить все слова?")) {
        clearAllWords();
        setWords([]);
        alert("Все слова удалены.");
      }
    }
  };

  const currentWord = shuffledWords[currentWordIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500">
      <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
            🇵🇱 Изучение польского языка
          </h1>
          <nav className="flex justify-center gap-2 flex-wrap">
            {currentView !== "learning" && (
              <>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentView === "list"
                      ? "bg-primary-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    setCurrentView("list");
                    setEditingWord(undefined);
                  }}
                >
                  Список слов
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentView === "add" || currentView === "edit"
                      ? "bg-primary-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    setCurrentView("add");
                    setEditingWord(undefined);
                  }}
                >
                  {editingWord ? "Редактировать" : "Добавить слово"}
                </button>
              </>
            )}
            {currentView === "learning" && (
              <button
                className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                onClick={() => setCurrentView("list")}
              >
                ← Вернуться к списку
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 w-full max-w-4xl">
        {currentView === "list" && (
          <WordList
            words={words}
            onEdit={handleEditWord}
            onDelete={handleDeleteWord}
            onStartLearning={handleStartLearning}
            onExport={handleExport}
            onImport={handleImport}
            onClearAll={handleClearAll}
          />
        )}

        {currentView === "add" && (
          <WordForm
            onSubmit={handleAddWord}
            onCancel={() => setCurrentView("list")}
          />
        )}

        {currentView === "edit" && editingWord && (
          <WordForm
            initialWord={editingWord}
            onSubmit={handleAddWord}
            onCancel={() => {
              setCurrentView("list");
              setEditingWord(undefined);
            }}
          />
        )}

        {currentView === "learning" && currentWord && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-semibold text-gray-800 shadow-lg">
              Карточка {currentWordIndex + 1} из {shuffledWords.length}
            </div>
            <FlashCard
              word={currentWord}
              onNext={handleNextCard}
              onMarkDifficulty={handleMarkDifficulty}
            />
          </div>
        )}

        {currentView === "learning" && !currentWord && (
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <p className="text-gray-600 mb-4 text-lg">
              Нет слов для изучения. Добавьте слова в список.
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
