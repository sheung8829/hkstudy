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
      const cantoneseVoice = voices.find(v => 
        v.lang === 'zh-HK' || 
        v.lang === 'yue-HK' || // Android 常見
        v.lang === 'yue' || 
        v.name.includes('Cantonese') || 
        v.name.includes('粵語') ||
        v.name.includes('Hong Kong') ||
        v.name.includes('HK') ||
        v.name.includes('HiuGaai')
      );

      if (cantoneseVoice) {
        console.log('Using native Cantonese voice:', cantoneseVoice.name);
        utterance.voice = cantoneseVoice;
        utterance.lang = 'zh-HK';
        window.speechSynthesis.speak(utterance);
        return;
      }

      // 2. 如果原生沒有，使用 Google Translate TTS
      console.log('Native Cantonese not found, trying Google TTS');
      const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-HK&client=tw-ob`;
      const audio = new Audio(googleTTSUrl);
      
      audio.play().catch(e => {
        console.error('Google TTS playback failed', e);
        // 3. 如果連 Google 都失敗，與其唸普通話，不如提示使用者
        alert('您的裝置沒有內建廣東話語音，且網路發音失敗。請在手機設定中安裝「Google 文字轉語音」的廣東話套件。');
      });

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
