import { Word } from '../types';

interface WordListProps {
  words: Word[];
  onStartLearning: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const WordList = ({
  words,
  onStartLearning,
  onExport,
  onImport,
}: WordListProps) => {
  const getLevel = (word: Word): number => {
    if (word.knowsPlToRu && word.knowsRuToPl) return 2;
    if (word.knowsPlToRu) return 1;
    return 0;
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return "text-gray-600";
      case 1:
        return "text-blue-600";
      case 2:
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 0:
        return "Уровень 0 - Не знаю";
      case 1:
        return "Уровень 1 - Знаю PL→RU";
      case 2:
        return "Уровень 2 - Знаю оба";
      default:
        return "Неизвестно";
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
                    className={`text-sm font-semibold ${getLevelColor(
                      getLevel(word)
                    )}`}
                  >
                    {getLevelText(getLevel(word))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
