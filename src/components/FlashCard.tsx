import { useRef, useState } from 'react';

import { Word } from '../types';

interface FlashCardProps {
  word: Word;
  onFlip?: () => void;
  onNext: () => void;
  onMarkLevel: (knowsPlToRu: boolean, knowsRuToPl: boolean) => void;
  onToggleNeedsReview?: (id: string, needsReview: boolean) => void;
  mode?: "pl-to-ru" | "ru-to-pl"; // Режим обучения
}

export const FlashCard = ({
  word,
  onFlip,
  onNext,
  onMarkLevel,
  onToggleNeedsReview,
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

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 300);
    if (onFlip) {
      onFlip();
    }
  };

  const getCurrentLevel = (): number => {
    if (word.knowsPlToRu && word.knowsRuToPl) return 2;
    if (word.knowsPlToRu) return 1;
    return 0;
  };

  const handleLevel = (knowsPlToRu: boolean, knowsRuToPl: boolean) => {
    onMarkLevel(knowsPlToRu, knowsRuToPl);
    setIsFlipped(false);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  const handleSkip = () => {
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
    if (!isFlipped) return; // Свайпы работают только когда карточка перевернута
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isFlipped || !touchStartX.current) return;
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
    if (!touchStartX.current || !touchEndX.current) {
      setSwipeDirection(null);
      setSwipeProgress(0);
      return;
    }
    if (!isFlipped) return; // Свайпы работают только когда карточка перевернута

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    setSwipeDirection(null);
    setSwipeProgress(0);

    if (isLeftSwipe) {
      // Свайп влево = "знаю"
      if (mode === "pl-to-ru") {
        handleLevel(true, word.knowsRuToPl);
      } else {
        handleLevel(word.knowsPlToRu, true);
      }
    } else if (isRightSwipe) {
      // Свайп вправо = "не знаю"
      if (mode === "pl-to-ru") {
        handleLevel(false, word.knowsRuToPl);
      } else {
        handleLevel(word.knowsPlToRu, false);
      }
    }
  };

  // Определяем цвет карточки в зависимости от свайпа
  const getCardColor = (isBack: boolean) => {
    if (!isFlipped) {
      return isBack
        ? "from-indigo-500 to-blue-600"
        : "from-primary-500 to-purple-600";
    }
    if (swipeDirection === "left") {
      // Зеленый для "знаю"
      return `from-green-500 to-emerald-600`;
    } else if (swipeDirection === "right") {
      // Красный для "не знаю"
      return `from-red-500 to-rose-600`;
    }
    return isBack
      ? "from-indigo-500 to-blue-600"
      : "from-primary-500 to-purple-600";
  };

  return (
    <div className="flex flex-col items-center gap-4 md:gap-8 p-4 w-full relative">
      {word.needsReview && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
          ⚠️ Требует проверки
        </div>
      )}

      {/* Индикаторы свайпов */}
      {isFlipped && (
        <>
          <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div
              className={`flex flex-col items-center gap-2 transition-opacity duration-200 ${
                swipeDirection === "left" ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="bg-green-500 text-white px-3 py-2 rounded-lg font-semibold shadow-lg text-sm md:text-base">
                ✓ Знаю
              </div>
              <div className="text-green-500 text-2xl md:text-4xl">←</div>
            </div>
          </div>
          <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div
              className={`flex flex-col items-center gap-2 transition-opacity duration-200 ${
                swipeDirection === "right" ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold shadow-lg text-sm md:text-base">
                ✗ Не знаю
              </div>
              <div className="text-red-500 text-2xl md:text-4xl">→</div>
            </div>
          </div>
        </>
      )}

      <div
        className="relative w-full max-w-md h-80 md:h-96 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`relative w-full h-full transition-all duration-300 transform-style-preserve-3d ${
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
          <div
            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getCardColor(
              false
            )} rounded-2xl shadow-2xl flex items-center justify-center p-6 backface-hidden text-white transition-colors duration-200`}
          >
            <div className="text-center w-full">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {word.polish}
              </h2>
              {word.examples?.pl && !isFlipped && (
                <p className="text-lg md:text-xl italic mt-4 opacity-90">
                  Пример: {word.examples.pl}
                </p>
              )}
              <p className="text-sm mt-6 opacity-70">
                Нажмите, чтобы перевернуть
              </p>
            </div>
          </div>

          {/* Back side */}
          <div
            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getCardColor(
              true
            )} rounded-2xl shadow-2xl flex items-center justify-center p-6 backface-hidden text-white rotate-y-180 transition-colors duration-200`}
          >
            <div className="text-center w-full">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {word.russian}
              </h2>
              {word.examples?.ru && (
                <p className="text-lg md:text-xl italic mt-4 opacity-90">
                  Пример: {word.examples.ru}
                </p>
              )}
              <p className="text-sm mt-6 opacity-70">Нажмите, чтобы вернуть</p>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
            <span className="text-sm text-gray-600">Текущий уровень: </span>
            <span className="font-bold text-primary-600">
              {getCurrentLevel() === 0 && "0 - Не знаю"}
              {getCurrentLevel() === 1 && "1 - Знаю PL→RU"}
              {getCurrentLevel() === 2 && "2 - Знаю оба направления"}
            </span>
          </div>
          <div className="text-center text-sm text-gray-600 mb-2 md:hidden">
            Свайп влево = знаю | Свайп вправо = не знаю
          </div>
          <div className="hidden md:flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all shadow-lg active:scale-95"
              onClick={() => handleLevel(false, false)}
            >
              Не знаю (0)
            </button>
            {mode === "pl-to-ru" && (
              <button
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                onClick={() => handleLevel(true, word.knowsRuToPl)}
              >
                Знаю PL→RU
              </button>
            )}
            {mode === "ru-to-pl" && (
              <button
                className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg active:scale-95"
                onClick={() => handleLevel(word.knowsPlToRu, true)}
              >
                Знаю RU→PL
              </button>
            )}
            {(word.knowsPlToRu || word.knowsRuToPl) && (
              <button
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95"
                onClick={() => handleLevel(true, true)}
              >
                Знаю оба (2)
              </button>
            )}
          </div>
          <div className="hidden md:flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-lg active:scale-95"
              onClick={handleSkip}
            >
              Пропустить
            </button>
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
      )}
    </div>
  );
};
