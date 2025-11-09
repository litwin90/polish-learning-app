import { useEffect, useRef, useState } from 'react';

import { Word } from '../types';

interface FlashCardProps {
  word: Word;
  onFlip?: () => void;
  onNext: () => void;
  onPrevious?: () => void;
  onMarkLevel: (knowsPlToRu: boolean, knowsRuToPl: boolean) => void;
  onToggleNeedsReview?: (id: string, needsReview: boolean) => void;
  onToggleUnsure?: (id: string, isUnsure: boolean) => void;
  mode?: "pl-to-ru" | "ru-to-pl"; // Режим обучения
}

export const FlashCard = ({
  word,
  onFlip,
  onNext,
  onPrevious,
  onMarkLevel,
  onToggleNeedsReview,
  onToggleUnsure,
  mode = "pl-to-ru",
}: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [swipeProgress, setSwipeProgress] = useState(0);
  const minSwipeDistance = 50;

  // Сбрасываем состояние переворота при смене карточки
  useEffect(() => {
    setIsFlipped(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    touchStartX.current = null;
    touchEndX.current = null;
  }, [word.id]);

  const handleFlip = () => {
    if (isAnimating) return;
    // Предотвращаем переворот, если был свайп
    if (swipeDirection !== null) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 300);
    if (onFlip) {
      onFlip();
    }
  };

  const handleLevel = (knowsPlToRu: boolean, knowsRuToPl: boolean) => {
    onMarkLevel(knowsPlToRu, knowsRuToPl);
    setIsFlipped(false);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  const handleToggleNeedsReview = () => {
    if (onToggleNeedsReview) {
      onToggleNeedsReview(word.id, !word.needsReview);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    e.preventDefault(); // Предотвращаем скролл при свайпе
    touchEndX.current = e.targetTouches[0].clientX;
    const distance = touchStartX.current - touchEndX.current;
    const absDistance = Math.abs(distance);

    if (absDistance > 10) {
      if (distance > 0) {
        setSwipeDirection("left");
      } else {
        setSwipeDirection("right");
      }
      // Прогресс от 0 до 1, максимум при 100px
      setSwipeProgress(Math.min(absDistance / 100, 1));
    }
  };

  const onTouchEnd = () => {
    if (!touchStartX.current) {
      setSwipeDirection(null);
      setSwipeProgress(0);
      return;
    }

    const endX = touchEndX.current ?? touchStartX.current;
    const distance = touchStartX.current - endX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    setSwipeDirection(null);
    setSwipeProgress(0);
    touchStartX.current = null;
    touchEndX.current = null;

    if (isLeftSwipe) {
      // Свайп влево = следующая карточка
      onNext();
    } else if (isRightSwipe && onPrevious) {
      // Свайп вправо = предыдущая карточка
      onPrevious();
    }
  };

  const handleToggleUnsure = () => {
    if (onToggleUnsure) {
      onToggleUnsure(word.id, !word.isUnsure);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 md:gap-4 p-1 md:p-4 w-full relative">
      {word.needsReview && (
        <div className="bg-yellow-500 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-semibold shadow-lg text-xs md:text-base">
          ⚠️ Требует проверки
        </div>
      )}
      {word.isUnsure && (
        <div className="bg-orange-500 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-semibold shadow-lg text-xs md:text-base">
          🤔 Сомневаюсь
        </div>
      )}

      <div
        className="relative w-full max-w-md h-56 md:h-96 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`relative w-full h-full transition-transform duration-300 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transform: swipeDirection
              ? `rotateY(${isFlipped ? 180 : 0}deg) translateX(${
                  swipeDirection === "left"
                    ? -swipeProgress * 20
                    : swipeProgress * 20
                }px)`
              : undefined,
            transition: swipeDirection ? "none" : "transform 0.3s",
          }}
        >
          {/* Front side */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center p-4 md:p-6 backface-hidden text-white">
            <div className="text-center w-full">
              <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
                {word.polish}
              </h2>
              {word.examples?.pl && !isFlipped && (
                <p className="text-sm md:text-xl italic mt-2 md:mt-4 opacity-90">
                  Пример: {word.examples.pl}
                </p>
              )}
              <p className="text-xs md:text-sm mt-3 md:mt-6 opacity-70">
                Нажмите, чтобы перевернуть
              </p>
            </div>
          </div>

          {/* Back side */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center p-4 md:p-6 backface-hidden text-white rotate-y-180">
            <div className="text-center w-full">
              <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
                {word.russian}
              </h2>
              {word.examples?.ru && (
                <p className="text-sm md:text-xl italic mt-2 md:mt-4 opacity-90">
                  Пример: {word.examples.ru}
                </p>
              )}
              <p className="text-xs md:text-sm mt-3 md:mt-6 opacity-70">
                Нажмите, чтобы вернуть
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки для малых экранов */}
      {isFlipped && (
        <div className="md:hidden flex flex-col gap-3 w-full max-w-md">
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg active:scale-95 text-sm"
              onClick={() => handleLevel(false, false)}
            >
              Не знаю
            </button>
            {mode === "pl-to-ru" && (
              <button
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95 text-sm"
                onClick={() => handleLevel(true, word.knowsRuToPl)}
              >
                Знаю
              </button>
            )}
            {mode === "ru-to-pl" && (
              <button
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95 text-sm"
                onClick={() => handleLevel(word.knowsPlToRu, true)}
              >
                Знаю
              </button>
            )}
            {onToggleUnsure && (
              <button
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all shadow-lg active:scale-95 text-sm ${
                  word.isUnsure
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
                onClick={handleToggleUnsure}
              >
                Сомневаюсь
              </button>
            )}
          </div>
        </div>
      )}

      {/* Кнопки навигации для больших экранов - Вперед и Назад */}
      <div className="hidden md:flex w-full max-w-md justify-center gap-4 mt-4">
        <button
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onPrevious}
          disabled={!onPrevious}
          title="Предыдущая карточка"
        >
          ← Назад
        </button>
        <button
          className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNext}
          title="Следующая карточка"
        >
          Вперед →
        </button>
      </div>

      {isFlipped && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg active:scale-95"
                onClick={() => handleLevel(false, false)}
              >
                Не знаю
              </button>
              {mode === "pl-to-ru" && (
                <button
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95"
                  onClick={() => handleLevel(true, word.knowsRuToPl)}
                >
                  Знаю
                </button>
              )}
              {mode === "ru-to-pl" && (
                <button
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95"
                  onClick={() => handleLevel(word.knowsPlToRu, true)}
                >
                  Знаю
                </button>
              )}
              {onToggleUnsure && (
                <button
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg active:scale-95 ${
                    word.isUnsure
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                  onClick={handleToggleUnsure}
                >
                  Сомневаюсь
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {onToggleNeedsReview && (
                <button
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg active:scale-95 ${
                    word.needsReview
                      ? "bg-yellow-500 text-white hover:bg-yellow-600"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                  onClick={handleToggleNeedsReview}
                >
                  {word.needsReview ? "✓ Требует проверки" : "Требует проверки"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
