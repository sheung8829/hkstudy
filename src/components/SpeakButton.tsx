import React, { useEffect, useState } from 'react';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({ text, className = '' }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
      // 策略 1: 絕對信任 lang 代碼 (最準確)
      let targetVoice = voices.find(v => 
        v.lang === 'zh-HK' || 
        v.lang === 'yue-HK' || 
        v.lang === 'zh-yue'
      );

      // 策略 2: 如果找不到標準代碼，才檢查名稱 (模糊搜尋)
      if (!targetVoice) {
        targetVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          // const lang = v.lang.toLowerCase(); // Unused
          
          const isCantonese = 
            name.includes('cantonese') || 
            name.includes('粵語') ||
            name.includes('hong kong') ||
            name.includes('hk') ||
            name.includes('hiugaai');

          // 簡單排華：只要不是明顯的普通話就行
          const isMandarin = name.includes('mandarin') || name.includes('putonghua');

          return isCantonese && !isMandarin;
        });
      }

      if (targetVoice) {
        console.log(`Using voice: ${targetVoice.name} (${targetVoice.lang})`);
        utterance.voice = targetVoice;
        utterance.lang = targetVoice.lang; // 使用語音自帶的 lang
        window.speechSynthesis.speak(utterance);
      } else {
        // 找不到廣東話，顯示安裝教學
        setShowInstallGuide(true);
      }
    } else {
      // 英文發音
      const englishVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
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

      {/* 安裝教學 Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setShowInstallGuide(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-800">找不到廣東話語音</h3>
            <p className="text-sm text-gray-600 mb-4">
              您的裝置尚未安裝廣東話語音包。請依照以下步驟安裝，即可享受離線發音：
            </p>
            
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-800 mb-1">Android 手機</div>
                <ol className="list-decimal ml-4 text-blue-700">
                  <li>前往 <strong>設定</strong> {'>'} <strong>系統</strong> {'>'} <strong>語言與輸入</strong></li>
                  <li>點擊 <strong>文字轉語音輸出</strong></li>
                  <li>點擊 Google 引擎旁的齒輪圖示</li>
                  <li>點擊 <strong>安裝語音資料</strong></li>
                  <li>找到 <strong>粵語 (香港)</strong> 並下載</li>
                </ol>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-800 mb-1">Windows 電腦</div>
                <ol className="list-decimal ml-4 text-green-700">
                  <li>前往 <strong>設定</strong> {'>'} <strong>時間與語言</strong></li>
                  <li>點擊 <strong>語音</strong></li>
                  <li>在 <strong>管理語音</strong> 下點擊 <strong>新增語音</strong></li>
                  <li>搜尋並安裝 <strong>中文 (香港特別行政區)</strong></li>
                </ol>
              </div>
            </div>

            <button 
              onClick={() => setShowInstallGuide(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              知道了
            </button>
            
            {/* Debug Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-mono mb-2">偵測到的中文語音 (Debug):</p>
              <div className="max-h-24 overflow-y-auto text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                {voices.filter(v => v.lang.includes('zh') || v.lang.includes('yue') || v.lang.includes('HK')).map((v, i) => (
                  <div key={i}>{v.name} ({v.lang})</div>
                ))}
                {voices.filter(v => v.lang.includes('zh') || v.lang.includes('yue') || v.lang.includes('HK')).length === 0 && (
                  <div>無 (請確認瀏覽器權限或系統設定)</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
