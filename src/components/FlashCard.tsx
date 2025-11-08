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
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (!isFlipped) return; // Свайпы работают только когда карточка перевернута

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

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

  return (
    <div className="flex flex-col items-center gap-8 p-4 w-full">
      {word.needsReview && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
          ⚠️ Требует проверки
        </div>
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
          className={`relative w-full h-full transition-transform duration-300 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front side */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center p-6 backface-hidden text-white">
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
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl shadow-2xl flex items-center justify-center p-6 backface-hidden text-white rotate-y-180">
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
          <div className="text-center text-sm text-gray-600 mb-2">
            Свайп влево = знаю | Свайп вправо = не знаю
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
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
          <div className="flex gap-3">
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
