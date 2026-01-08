import React, { useEffect, useState } from 'react';
// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Add type definition for ResponsiveVoice
declare global {
  interface Window {
    responsiveVoice?: {
      speak: (text: string, voice: string) => void;
      voiceSupport: () => boolean;
    };
  }
}

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

  /*
  const speakWithEdgeTTS = async (text: string, voice: string) => {
    // Note: In a production environment, you should use your own Azure Speech resource key and region.
    // For this demo, we will try to fallback to other methods if this is not configured.
    // Since we don't have a backend to hide the key, we'll stick to client-side methods first.
    // But since the user specifically asked for Edge TTS as an alternative, we will simulate the logic 
    // or use a public endpoint if available, but Microsoft doesn't offer a free unauthenticated public API for Edge TTS directly from browser easily without a proxy.
    
    // Instead of full Azure SDK implementation which requires a Key (that user doesn't have),
    // we will optimize the existing fallback chain which is actually the most robust "free" way.
    // The previous "edge-tts" plan might have been misleading as it usually requires a server-side component or a key.
    
    // However, we can try to force the "Microsoft HiuGaai Online (Natural) - Chinese (Cantonese)" if available in the browser (Edge browser has this built-in).
    return false;
  };
  */

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    // If it's Chinese, try to use Cantonese
    if (hasChinese) {
      // 1. First, try Local Edge TTS Backend (Highest Priority for reliability and quality)
      // This guarantees "zh-HK-HiuGaaiNeural" which is high quality Cantonese.
      const playAudio = (url: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.onended = () => resolve();
            audio.onerror = (e) => reject(e);
            audio.play().catch(reject);
          });
      };

      const tryBackendTTS = async () => {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            await playAudio(`${apiUrl}/api/tts?text=${encodeURIComponent(text)}`);
          } catch (e) {
            console.error('Local Edge TTS failed. Trying system voice fallback...', e);
            
            // 2. Fallback to System Voice (Only if strictly Cantonese)
            // This logic runs only if backend fails.
            let targetVoice = voices.find(v => 
              v.lang === 'zh-HK' || 
              v.lang === 'zh-HK.js' ||
              v.name.includes('Cantonese') || 
              v.name.includes('粵語') ||
              v.name.includes('Hong Kong') ||
              v.name.includes('HiuGaai') || 
              v.name.includes('HiuMaan')    
            );

            if (targetVoice) {
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.voice = targetVoice;
              utterance.lang = 'zh-HK';
              window.speechSynthesis.speak(utterance);
            } else {
              console.warn('No Cantonese voice found in system. Muted to avoid Mandarin fallback.');
            }
          }
      };
      
      tryBackendTTS();

    } else {
      // English handling (British preference)
      const utterance = new SpeechSynthesisUtterance(text);
      const targetVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
      
      if (targetVoice) {
        utterance.voice = targetVoice;
        utterance.lang = targetVoice.lang;
      } else {
        utterance.lang = 'en-GB';
      }
      
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
