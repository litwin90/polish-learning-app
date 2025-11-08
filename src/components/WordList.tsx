import { Word } from '../types';

interface WordListProps {
  words: Word[];
  onEdit: (word: Word) => void;
  onDelete: (id: string) => void;
  onStartLearning: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearAll: () => void;
}

export const WordList = ({
  words,
  onEdit,
  onDelete,
  onStartLearning,
  onExport,
  onImport,
  onClearAll,
}: WordListProps) => {
  const getDifficultyColor = (difficulty: Word["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
    }
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-xl">
        <p className="text-gray-600 text-lg mb-2">
          У вас пока нет слов для изучения.
        </p>
        <p className="text-gray-600 text-lg">
          Добавьте первое слово, чтобы начать!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Ваши слова ({words.length})
          </h3>
          <button
            className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md active:scale-95"
            onClick={onStartLearning}
          >
            Начать изучение
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Резервное копирование
            </h4>
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <button
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md active:scale-95"
                onClick={onExport}
                title="Скачать резервную копию"
              >
                📥 Экспорт
              </button>
              <button
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-md active:scale-95"
                onClick={onImport}
                title="Загрузить из файла"
              >
                📤 Импорт
              </button>
            </div>
            <p className="text-sm text-gray-600 italic">
              Экспортируйте данные для резервного копирования или переноса на
              другое устройство
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-red-600 mb-3">
              Опасная зона
            </h4>
            <button
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md active:scale-95"
              onClick={onClearAll}
            >
              🗑️ Удалить все слова
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {words.map((word) => (
          <div
            key={word.id}
            className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-2xl md:text-3xl font-bold text-primary-500">
                    {word.polish}
                  </span>
                  <span className="text-xl text-gray-400">→</span>
                  <span className="text-2xl md:text-3xl font-bold text-gray-800">
                    {word.russian}
                  </span>
                </div>
                {word.example && (
                  <p className="text-gray-600 italic mb-3 text-sm md:text-base">
                    {word.example}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {word.category && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                      {word.category}
                    </span>
                  )}
                  <span
                    className={`text-sm font-semibold ${getDifficultyColor(
                      word.difficulty
                    )}`}
                  >
                    {word.difficulty === "easy" && "Легко"}
                    {word.difficulty === "medium" && "Средне"}
                    {word.difficulty === "hard" && "Сложно"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xl"
                  onClick={() => onEdit(word)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-xl"
                  onClick={() => onDelete(word.id)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
