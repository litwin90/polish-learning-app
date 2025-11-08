import { useState } from 'react';

import { Word } from '../types';

interface WordFormProps {
  onSubmit: (word: Omit<Word, "id" | "createdAt">) => void;
  onCancel?: () => void;
  initialWord?: Word;
}

export const WordForm = ({
  onSubmit,
  onCancel,
  initialWord,
}: WordFormProps) => {
  const [polish, setPolish] = useState(initialWord?.polish || "");
  const [russian, setRussian] = useState(initialWord?.russian || "");
  const [example, setExample] = useState(initialWord?.example || "");
  const [category, setCategory] = useState(initialWord?.category || "");
  const [difficulty, setDifficulty] = useState<Word["difficulty"]>(
    initialWord?.difficulty || "medium"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (polish.trim() && russian.trim()) {
      onSubmit({
        polish: polish.trim(),
        russian: russian.trim(),
        example: example.trim() || undefined,
        category: category.trim() || undefined,
        difficulty,
      });
      // Сброс формы
      if (!initialWord) {
        setPolish("");
        setRussian("");
        setExample("");
        setCategory("");
        setDifficulty("medium");
      }
    }
  };

  return (
    <form
      className="bg-white rounded-xl p-6 md:p-8 shadow-xl w-full max-w-md mx-auto"
      onSubmit={handleSubmit}
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        {initialWord ? "Редактировать слово" : "Добавить новое слово"}
      </h3>

      <div className="mb-5">
        <label
          htmlFor="polish"
          className="block mb-2 text-gray-700 font-medium"
        >
          Польское слово *
        </label>
        <input
          id="polish"
          type="text"
          value={polish}
          onChange={(e) => setPolish(e.target.value)}
          placeholder="np. dom"
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-base"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="russian"
          className="block mb-2 text-gray-700 font-medium"
        >
          Русский перевод *
        </label>
        <input
          id="russian"
          type="text"
          value={russian}
          onChange={(e) => setRussian(e.target.value)}
          placeholder="np. дом"
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-base"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="example"
          className="block mb-2 text-gray-700 font-medium"
        >
          Пример использования
        </label>
        <input
          id="example"
          type="text"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="np. Mój dom jest duży"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-base"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="category"
          className="block mb-2 text-gray-700 font-medium"
        >
          Категория
        </label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="np. Дом, Еда, Работа"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-base"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="difficulty"
          className="block mb-2 text-gray-700 font-medium"
        >
          Сложность
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Word["difficulty"])}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-base bg-white"
        >
          <option value="easy">Легко</option>
          <option value="medium">Средне</option>
          <option value="hard">Сложно</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md active:scale-95"
        >
          {initialWord ? "Сохранить" : "Добавить"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all active:scale-95"
            onClick={onCancel}
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
};
