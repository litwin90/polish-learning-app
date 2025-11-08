import { useState } from 'react';

import { Word } from '../types';

interface FlashCardProps {
  word: Word;
  onFlip?: () => void;
  onNext: () => void;
  onMarkDifficulty: (difficulty: Word["difficulty"]) => void;
}

export const FlashCard = ({
  word,
  onFlip,
  onNext,
  onMarkDifficulty,
}: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 300);
    if (onFlip) {
      onFlip();
    }
  };

  const handleDifficulty = (difficulty: Word["difficulty"]) => {
    onMarkDifficulty(difficulty);
    setIsFlipped(false);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-4 w-full">
      <div
        className="relative w-full max-w-md h-80 md:h-96 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
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
              {word.category && (
                <span className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm mb-4">
                  {word.category}
                </span>
              )}
              {word.example && !isFlipped && (
                <p className="text-lg md:text-xl italic mt-4 opacity-90">
                  Пример: {word.example}
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
              {word.example && (
                <p className="text-lg md:text-xl italic mt-4 opacity-90">
                  Пример: {word.example}
                </p>
              )}
              <p className="text-sm mt-6 opacity-70">Нажмите, чтобы вернуть</p>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg active:scale-95"
            onClick={() => handleDifficulty("easy")}
          >
            Легко
          </button>
          <button
            className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all shadow-lg active:scale-95"
            onClick={() => handleDifficulty("medium")}
          >
            Средне
          </button>
          <button
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg active:scale-95"
            onClick={() => handleDifficulty("hard")}
          >
            Сложно
          </button>
        </div>
      )}
    </div>
  );
};
