import React, { useState, useEffect } from 'react';
import type { Vocabulary } from '../../types';
import { SpeakButton } from '../SpeakButton';

interface MatchingGameProps {
  words: Vocabulary[];
  onBack: () => void;
  isHardMode?: boolean;
}

interface Card {
  id: string;
  type: 'word' | 'meaning';
  content: string;
  originalId: string;
  isMatched: boolean;
  imageUrl?: string;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ words, onBack, isHardMode = false }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    initGame();
  }, [words]);

  useEffect(() => {
    let interval: any;
    if (isActive && !isGameComplete) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isGameComplete]);

  const initGame = () => {
    // Select up to 12 words to keep it playable (24 cards total is max for most screens)
    // If user wants to play all, they can play multiple rounds
    const gameWords = [...words].sort(() => Math.random() - 0.5).slice(0, 12);
    
    const newCards: Card[] = [];
    gameWords.forEach(w => {
      newCards.push({
        id: `word-${w.id}`,
        type: 'word',
        content: w.word,
        originalId: w.id,
        isMatched: false
      });
      newCards.push({
        id: `meaning-${w.id}`,
        type: 'meaning',
        content: w.meaning,
        imageUrl: w.imageUrl,
        originalId: w.id,
        isMatched: false
      });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setScore(0);
    setTime(0);
    setIsGameComplete(false);
    setIsActive(true);
    setSelectedCards([]);
  };

  const handleCardClick = (index: number) => {
    if (isGameComplete || cards[index].isMatched || selectedCards.includes(index)) return;

    // Play sound if it's a word card
    if (cards[index].type === 'word') {
       // We can trigger the speak button logic programmatically or just let user click the speak button separately.
       // For better UX in matching game, let's just let them click.
       // Or better, auto-speak on selection could be nice, but let's stick to visual logic first.
    }

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const card1 = cards[newSelected[0]];
      const card2 = cards[newSelected[1]];

      if (card1.originalId === card2.originalId && card1.type !== card2.type) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => 
            newSelected.includes(i) ? { ...c, isMatched: true } : c
          ));
          setSelectedCards([]);
          setScore(s => s + 10);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([]);
          setScore(s => Math.max(0, s - 2)); // Penalty for wrong match
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setIsGameComplete(true);
      setIsActive(false);
    }
  }, [cards]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-600">生字配對挑戰</h2>
        <div className="flex gap-4 text-lg font-medium">
          <span className="text-green-600">分數: {score}</span>
          <span className="text-gray-600">時間: {formatTime(time)}</span>
        </div>
      </div>

      {!isGameComplete ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const isSelected = selectedCards.includes(index);
            let bgColor = "bg-gray-100";
            if (card.isMatched) bgColor = "bg-green-100 border-green-500 opacity-50";
            else if (isSelected) bgColor = "bg-blue-100 border-blue-500";

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`
                  ${bgColor} 
                  border-2 
                  ${!card.isMatched ? 'border-gray-200 hover:border-blue-300 cursor-pointer' : 'border-transparent cursor-default'}
                  rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[120px] transition-all duration-200
                `}
              >
                {card.type === 'word' ? (
                   <div className="font-bold text-lg text-gray-800">{card.content}</div>
                ) : (
                   <div className="flex flex-col items-center w-full">
                     {card.imageUrl && (
                       <img src={card.imageUrl} alt="hint" className="w-12 h-12 object-cover rounded mb-2" />
                     )}
                     <div className="text-gray-700 text-sm">{card.content}</div>
                   </div>
                )}
                
                {!isHardMode && (
                  <div className="mt-2" onClick={e => e.stopPropagation()}>
                    <SpeakButton text={card.content} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">挑戰成功！</h3>
          <p className="text-gray-600 mb-6">
            你花了 {formatTime(time)} 完成配對，總得分：<span className="text-blue-600 font-bold text-xl">{score}</span>
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              返回選單
            </button>
            <button
              onClick={initGame}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
      
      {!isGameComplete && (
        <div className="mt-6 text-center">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 underline">
                放棄並返回
            </button>
        </div>
      )}
    </div>
  );
};
