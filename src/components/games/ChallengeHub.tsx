import React, { useState } from 'react';
import type { Vocabulary } from '../../types';
import { MatchingGame } from './MatchingGame';
import { MultipleChoiceGame } from './MultipleChoiceGame';

interface ChallengeHubProps {
  words: Vocabulary[];
  onBack: () => void;
}

type GameType = 'menu' | 'matching' | 'quiz';

export const ChallengeHub: React.FC<ChallengeHubProps> = ({ words, onBack }) => {
  const [gameType, setGameType] = useState<GameType>('menu');
  const [isHardMode, setIsHardMode] = useState(false);

  const renderContent = () => {
    switch (gameType) {
      case 'matching':
        return <MatchingGame words={words} onBack={() => setGameType('menu')} isHardMode={isHardMode} />;
      case 'quiz':
        return <MultipleChoiceGame words={words} onBack={() => setGameType('menu')} isHardMode={isHardMode} />;
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">選擇挑戰模式</h2>
            
            <div className="flex justify-center mb-8">
              <label className="flex items-center cursor-pointer select-none bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-100 transition">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isHardMode} 
                    onChange={() => setIsHardMode(!isHardMode)} 
                  />
                  <div className={`block w-10 h-6 rounded-full transition ${isHardMode ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isHardMode ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  🔥 高難度模式 (無發音提示)
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matching Game Card */}
              <button
                onClick={() => setGameType('matching')}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="text-4xl mb-4">🧩</div>
                <h3 className="text-2xl font-bold mb-2">配對挑戰</h3>
                <p className="text-blue-100 opacity-90">
                  測試你的反應速度！將生字與正確的解釋進行配對消除。
                </p>
              </button>

              {/* Quiz Game Card */}
              <button
                onClick={() => setGameType('quiz')}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="text-4xl mb-4">❓</div>
                <h3 className="text-2xl font-bold mb-2">選擇題</h3>
                <p className="text-purple-100 opacity-90">
                  經典測驗模式！從四個選項中選出正確的解釋。
                </p>
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 font-medium underline"
              >
                返回主選單
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {renderContent()}
    </div>
  );
};
