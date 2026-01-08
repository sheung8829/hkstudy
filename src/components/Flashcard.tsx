import React, { useState, useEffect } from 'react';
import type { Vocabulary } from '../types';
import { SpeakButton } from './SpeakButton';

interface FlashcardProps {
  words: Vocabulary[];
  onClose: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ words, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<Vocabulary[]>([]);

  useEffect(() => {
    // Shuffle words on mount
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, [words]);

  if (shuffledWords.length === 0) return null;

  const currentWord = shuffledWords[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % shuffledWords.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + shuffledWords.length) % shuffledWords.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative min-h-[500px] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          ✕
        </button>
        
        <div className="text-center mb-4 text-gray-500">
          {currentIndex + 1} / {shuffledWords.length}
        </div>

        <div 
          className="flex-1 flex flex-col items-center justify-center cursor-pointer mb-6 overflow-y-auto"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            // Front Side (Word only)
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-center text-gray-900 mb-4">
                {currentWord.word}
              </div>
              <SpeakButton text={currentWord.word} className="scale-150" />
            </div>
          ) : (
            // Back Side (Meaning + Image + Example)
            <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              {currentWord.imageUrl && (
                <img 
                  src={currentWord.imageUrl} 
                  alt="Explanation Image" 
                  className="max-h-48 max-w-full object-contain mb-4 rounded shadow-sm cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                />
              )}
              {currentWord.meaning && (
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="text-3xl font-bold text-center text-blue-600 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {currentWord.meaning}
                  </div>
                  <SpeakButton text={currentWord.meaning} />
                </div>
              )}
              {currentWord.example && (
                <div className="flex items-center gap-2 mt-2 px-4">
                  <div 
                    className="text-gray-500 italic text-center cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    "{currentWord.example}"
                  </div>
                  <SpeakButton text={currentWord.example} />
                </div>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-400 mt-8">
            (點擊翻轉)
          </div>
        </div>

        <div className="flex justify-between mt-auto pt-4 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            上一個
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            下一個
          </button>
        </div>
      </div>
    </div>
  );
};
