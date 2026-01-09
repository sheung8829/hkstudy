import React, { useEffect, useState } from 'react';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({ text, className = '' }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();

    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    const utterance = new SpeechSynthesisUtterance(text);

    if (hasChinese) {
      // 1. 優先嘗試瀏覽器原生 API
      // 嚴格篩選：必須包含 HK/Cantonese，且絕不能包含 Mandarin/Taiwan/China (除非是 Google 粵語)
      const cantoneseVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        
        // 必須是粵語特徵
        const isCantonese = 
          lang === 'zh-hk' || 
          lang === 'yue-hk' ||
          lang === 'yue' || 
          name.includes('cantonese') || 
          name.includes('粵語') ||
          name.includes('hong kong') ||
          name.includes('hk') ||
          name.includes('hiugaai');

        // 絕對不能是普通話特徵 (除非它同時標榜是粵語，這很罕見)
        const isMandarin = 
          name.includes('mandarin') || 
          name.includes('putonghua') || 
          name.includes('taiwan') || 
          (name.includes('china') && !name.includes('hong kong')) ||
          name.includes('cn');

        return isCantonese && !isMandarin;
      });

      if (cantoneseVoice) {
        console.log(`Using native voice: ${cantoneseVoice.name} (${cantoneseVoice.lang}) for text: ${text}`);
        utterance.voice = cantoneseVoice;
        utterance.lang = 'zh-HK';
        window.speechSynthesis.speak(utterance);
        return;
      }

      // 2. 如果原生沒有，使用 ResponsiveVoice (這是目前唯一可靠的跨瀏覽器廣東話方案)
      if ((window as any).responsiveVoice) {
        console.log('Using ResponsiveVoice fallback');
        (window as any).responsiveVoice.speak(text, "Chinese (Hong Kong Female)");
        return;
      }

      // 3. 如果連 ResponsiveVoice 都失敗，提示使用者
      alert('您的裝置沒有內建廣東話語音，且網路發音失敗。');

    } else {
      // 英文發音
      if ((window as any).responsiveVoice) {
         (window as any).responsiveVoice.speak(text, "UK English Female");
         return;
      }
      
      const englishVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      className={`text-gray-500 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 ${className}`}
      title="發音"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
      </svg>
    </button>
  );
};
