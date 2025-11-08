import { useMemo, useState } from 'react';

import { Word } from '../types';

interface WordListProps {
  words: Word[];
  onStartLearning: (filters: {
    filterLevels: Set<0 | 1 | 2>;
    filterLanguageLevels: Set<string>;
    filterNeedsReview?: boolean | null;
  }) => void;
  onExport: () => void;
  onImport: () => void;
  onToggleNeedsReview?: (id: string, needsReview: boolean) => void;
  onBack?: () => void;
}

export const WordList = ({
  words,
  onStartLearning,
  onExport,
  onImport,
  onToggleNeedsReview,
  onBack,
}: WordListProps) => {
  const [filterLevels, setFilterLevels] = useState<Set<0 | 1 | 2>>(
    new Set([0, 1, 2])
  );
  const [filterLanguageLevels, setFilterLanguageLevels] = useState<Set<string>>(
    new Set(["A1", "A2", "B1", "B2", "C1", "C2"])
  );
  const [filterNeedsReview, setFilterNeedsReview] = useState<boolean | null>(
    null
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

  const toggleFilterLanguageLevel = (level: string) => {
    const newFilterLanguageLevels = new Set(filterLanguageLevels);
    if (newFilterLanguageLevels.has(level)) {
      newFilterLanguageLevels.delete(level);
    } else {
      newFilterLanguageLevels.add(level);
    }
    setFilterLanguageLevels(newFilterLanguageLevels);
  };

  const handleStartLearning = () => {
    onStartLearning({
      filterLevels,
      filterLanguageLevels,
      filterNeedsReview:
        filterNeedsReview === null ? undefined : filterNeedsReview,
    });
  };

  const filteredAndSortedWords = useMemo(() => {
    // Фильтрация по уровню знания
    let filtered = words;
    if (filterLevels.size > 0 && filterLevels.size < 3) {
      filtered = words.filter((word) => {
        const level = getLevel(word);
        return filterLevels.has(level as 0 | 1 | 2);
      });
    }

    // Фильтрация по уровню языка
    if (filterLanguageLevels.size > 0 && filterLanguageLevels.size < 6) {
      filtered = filtered.filter((word) => {
        if (!word.level) return false; // Исключаем слова без уровня
        return filterLanguageLevels.has(word.level);
      });
    }

    // Фильтрация по needsReview
    if (filterNeedsReview !== null) {
      filtered = filtered.filter((word) => {
        return filterNeedsReview
          ? word.needsReview === true
          : word.needsReview !== true;
      });
    }

    // Сортировка
    const sorted = [...filtered].sort((a, b) => {
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

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [
    words,
    filterLevels,
    filterLanguageLevels,
    filterNeedsReview,
    sortBy,
    sortOrder,
  ]);

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
            onClick={handleStartLearning}
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
              Фильтр по уровню знания:
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Фильтр по уровню языка (CEFR):
            </label>
            <div className="flex flex-wrap gap-3">
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filterLanguageLevels.has(level)}
                    onChange={() => toggleFilterLanguageLevel(level)}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-gray-700 font-medium">{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Фильтр по статусу проверки:
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="needsReview"
                  checked={filterNeedsReview === null}
                  onChange={() => setFilterNeedsReview(null)}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="text-gray-700 font-medium">Все</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="needsReview"
                  checked={filterNeedsReview === true}
                  onChange={() => setFilterNeedsReview(true)}
                  className="w-5 h-5 text-yellow-600"
                />
                <span className="text-yellow-700 font-medium">
                  Требуют проверки
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="needsReview"
                  checked={filterNeedsReview === false}
                  onChange={() => setFilterNeedsReview(false)}
                  className="w-5 h-5 text-gray-600"
                />
                <span className="text-gray-700 font-medium">
                  Не требуют проверки
                </span>
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
            className={`rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow ${
              word.needsReview
                ? "bg-yellow-50 border-2 border-yellow-300"
                : "bg-white"
            }`}
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
                {(word.examples?.pl || word.examples?.ru) && (
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
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {word.category && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                      {word.category}
                    </span>
                  )}
                  {word.level && (
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700">
                      {word.level}
                    </span>
                  )}
                  <span
                    className={`text-sm font-semibold ${getLevelColor(
                      getLevel(word)
                    )}`}
                  >
                    {getLevelText(getLevel(word))}
                  </span>
                  {word.needsReview && (
                    <span className="bg-yellow-100 px-3 py-1 rounded-full text-sm text-yellow-700">
                      ⚠️ Требует проверки
                    </span>
                  )}
                </div>
                {onToggleNeedsReview && (
                  <div className="mt-2">
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        word.needsReview
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() =>
                        onToggleNeedsReview(word.id, !word.needsReview)
                      }
                    >
                      {word.needsReview
                        ? "✓ Требует проверки"
                        : "Требует проверки"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
