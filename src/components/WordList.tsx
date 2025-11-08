import { useMemo, useState } from 'react';

import { Word } from '../types';

interface WordListProps {
  words: Word[];
  onStartLearning: () => void;
  onExport: () => void;
  onImport: () => void;
  onBack?: () => void;
}

export const WordList = ({
  words,
  onStartLearning,
  onExport,
  onImport,
  onBack,
}: WordListProps) => {
  const [filterLevels, setFilterLevels] = useState<Set<0 | 1 | 2>>(
    new Set([0, 1, 2])
  );
  const [sortBy, setSortBy] = useState<"level" | "lastReviewed">("level");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const toggleFilterLevel = (level: 0 | 1 | 2) => {
    const newFilterLevels = new Set(filterLevels);
    if (newFilterLevels.has(level)) {
      newFilterLevels.delete(level);
    } else {
      newFilterLevels.add(level);
    }
    setFilterLevels(newFilterLevels);
  };

  const sortWords = (
    wordsToSort: Word[],
    sortBy: "level" | "lastReviewed",
    order: "asc" | "desc"
  ): Word[] => {
    const sorted = [...wordsToSort].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "level") {
        const levelA = getLevel(a);
        const levelB = getLevel(b);
        comparison = levelA - levelB;
      } else if (sortBy === "lastReviewed") {
        const dateA = a.lastReviewed || 0;
        const dateB = b.lastReviewed || 0;
        comparison = dateB - dateA; // По умолчанию по убыванию (недавние первыми)
      }

      return order === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const filteredAndSortedWords = useMemo(() => {
    // Фильтрация
    let filtered = words;
    if (filterLevels.size > 0 && filterLevels.size < 3) {
      filtered = words.filter((word) => {
        const level = getLevel(word);
        return filterLevels.has(level as 0 | 1 | 2);
      });
    }
    // Если filterLevels пуст или содержит все 3 уровня, показываем все слова

    // Сортировка
    return sortWords(filtered, sortBy, sortOrder);
  }, [words, filterLevels, sortBy, sortOrder]);

  if (words.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-xl">
          <p className="text-gray-600 text-lg mb-2">
            У вас пока нет слов для изучения.
          </p>
          <p className="text-gray-600 text-lg">
            Добавьте первое слово, чтобы начать!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Заголовок и навигация */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                onClick={onBack}
              >
                ← Назад
              </button>
            )}
            <h3 className="text-2xl font-bold text-gray-800">
              Все слова ({filteredAndSortedWords.length} из {words.length})
            </h3>
          </div>
          <button
            className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md active:scale-95"
            onClick={onStartLearning}
          >
            Начать изучение
          </button>
        </div>

        {/* Резервное копирование */}
        <div className="border-b pb-4 mb-6">
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

        {/* Фильтрация и сортировка */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Фильтр по уровню:
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLevels.has(0)}
                  onChange={() => toggleFilterLevel(0)}
                  className="w-5 h-5 text-gray-600 rounded"
                />
                <span className="text-gray-600 font-medium">Уровень 0</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLevels.has(1)}
                  onChange={() => toggleFilterLevel(1)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-blue-600 font-medium">Уровень 1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLevels.has(2)}
                  onChange={() => toggleFilterLevel(2)}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span className="text-green-600 font-medium">Уровень 2</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Сортировка:
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "level" | "lastReviewed")
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="level">По уровню</option>
                <option value="lastReviewed">
                  По дате последнего просмотра
                </option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                title="Изменить порядок сортировки"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Список слов */}
      <div className="space-y-4">
        {filteredAndSortedWords.map((word) => (
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
                {(word.examples?.pl || word.examples?.ru || word.example) && (
                  <div className="mb-3 space-y-1">
                    {word.examples?.pl && (
                      <p className="text-gray-600 italic text-sm md:text-base">
                        PL: {word.examples.pl}
                      </p>
                    )}
                    {word.examples?.ru && (
                      <p className="text-gray-600 italic text-sm md:text-base">
                        RU: {word.examples.ru}
                      </p>
                    )}
                    {!word.examples && word.example && (
                      <p className="text-gray-600 italic text-sm md:text-base">
                        {word.example}
                      </p>
                    )}
                  </div>
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
