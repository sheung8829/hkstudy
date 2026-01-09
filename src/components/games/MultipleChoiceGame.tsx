import React, { useState, useEffect } from 'react';
import type { Vocabulary } from '../../types';
import { SpeakButton } from '../SpeakButton';

interface MultipleChoiceGameProps {
  words: Vocabulary[];
  onBack: () => void;
  isHardMode?: boolean;
}

interface Question {
  targetWord: Vocabulary;
  options: Vocabulary[]; // 4 options including target
  correctIndex: number;
}

export const MultipleChoiceGame: React.FC<MultipleChoiceGameProps> = ({ words, onBack, isHardMode = false }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    initGame();
  }, [words]);

  const initGame = () => {
    if (words.length < 4) return; // Need at least 4 words

    // Use all words for questions (randomized order)
    const shuffledWords = [...words].sort(() => Math.random() - 0.5); 
    
    const newQuestions: Question[] = shuffledWords.map(target => {
      // Pick 3 distractors
      const distractors = words
        .filter(w => w.id !== target.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const options = [target, ...distractors].sort(() => Math.random() - 0.5);
      
      return {
        targetWord: target,
        options,
        correctIndex: options.findIndex(o => o.id === target.id)
      };
    });

    setQuestions(newQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setShowResult(false);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentQIndex].correctIndex;
    if (isCorrect) {
      setScore(s => s + 10);
      // Auto play sound on correct answer
      // But SpeakButton component handles speech, we can trigger it or let user click
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  if (words.length < 4) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 mb-4">生字數量不足，無法開始選擇題。</p>
        <p className="text-gray-500 mb-6">請至少新增 4 個生字。</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          返回選單
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">挑戰完成！</h2>
        <div className="text-6xl mb-6">🏆</div>
        <p className="text-xl text-gray-700 mb-2">
          總得分：<span className="font-bold text-blue-600">{score}</span> / {questions.length * 10}
        </p>
        <p className="text-gray-600 mb-2">
           答對：<span className="text-green-600 font-bold">{score / 10}</span> 題 / 
           答錯：<span className="text-red-500 font-bold">{questions.length - (score / 10)}</span> 題
        </p>
        <p className="text-gray-500 mb-8">
          正確率：{Math.round((score / (questions.length * 10)) * 100)}%
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
    );
  }

  const currentQ = questions[currentQIndex];
  if (!currentQ) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-500 font-medium">題目 {currentQIndex + 1} / {questions.length}</span>
        <span className="text-blue-600 font-bold">得分: {score}</span>
      </div>

      <div className="mb-8 text-center">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">{currentQ.targetWord.word}</h3>
        {!isHardMode && (
          <div className="flex justify-center">
             <SpeakButton text={currentQ.targetWord.word} className="scale-125" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {currentQ.options.map((option, index) => {
          let btnClass = "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
          
          if (isAnswered) {
            if (index === currentQ.correctIndex) {
              btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
            } else if (index === selectedOption) {
              btnClass = "bg-red-100 border-red-500 text-red-800";
            } else {
              btnClass = "opacity-50 cursor-not-allowed bg-gray-50";
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(index)}
              disabled={isAnswered}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center
                ${btnClass}
              `}
            >
              <span className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center mr-3 text-sm font-bold text-gray-500 shadow-sm">
                {String.fromCharCode(65 + index)}
              </span>
              <div className="flex-1 flex items-center gap-2">
                 <div className="text-lg">{option.meaning}</div>
                 {!isHardMode && option.meaning && (
                    <div onClick={e => e.stopPropagation()}>
                      <SpeakButton text={option.meaning} className="p-1" />
                    </div>
                 )}
                 {isAnswered && index === currentQ.correctIndex && (
                    <div className="text-sm text-green-600 mt-1 w-full">"{option.example}"</div>
                 )}
              </div>
              {option.imageUrl && (
                <img src={option.imageUrl} alt="hint" className="w-12 h-12 object-cover rounded ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="text-center animate-bounce-in">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 shadow-lg transition transform hover:scale-105"
          >
            {currentQIndex < questions.length - 1 ? '下一題 →' : '查看結果'}
          </button>
        </div>
      )}
      
      {!isAnswered && (
         <div className="text-center mt-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm underline">
                退出挑戰
            </button>
         </div>
      )}
    </div>
  );
};
