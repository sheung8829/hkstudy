import { useState, useEffect, useMemo } from 'react';
import type { Vocabulary, Lesson } from './types';
import { AddWordForm } from './components/AddWordForm';
import { WordList } from './components/WordList';
import { Flashcard } from './components/Flashcard';
import { Login } from './components/Login';
import { LessonManager } from './components/LessonManager';
import { ChallengeHub } from './components/games/ChallengeHub';
import { useAuth, AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

function StudyApp() {
  const { user, logout } = useAuth();
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [showLessonManager, setShowLessonManager] = useState(false);

  // Load data for current user
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const response = await fetch(`${apiUrl}/api/data/${user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Check if we need to migrate from localStorage
            const localWords = localStorage.getItem(`studyweb_data_${user.id}`);
            const localLessons = localStorage.getItem(`studyweb_lessons_${user.id}`);
            
            if ((!data.words || data.words.length === 0) && localWords) {
               // Migration case
               const wordsToSync = JSON.parse(localWords);
               const lessonsToSync = localLessons ? JSON.parse(localLessons) : [];
               setWords(wordsToSync);
               setLessons(lessonsToSync);
               // Trigger save to sync
               return; 
            }

            setWords(data.words || []);
            setLessons(data.lessons || []);
          }
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      } else {
        setWords([]);
        setLessons([]);
      }
    };
    loadData();
  }, [user]);

  // Save data when it changes
  useEffect(() => {
    const saveData = async () => {
      if (user) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          await fetch(`${apiUrl}/api/data/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words, lessons })
          });
          
          // Also keep in localStorage as backup/offline cache
          localStorage.setItem(`studyweb_data_${user.id}`, JSON.stringify(words));
          localStorage.setItem(`studyweb_lessons_${user.id}`, JSON.stringify(lessons));
        } catch (error) {
          console.error("Failed to save data:", error);
        }
      }
    };
    
    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [words, lessons, user]);

  const addWord = (newWord: Omit<Vocabulary, 'id' | 'createdAt'>) => {
    const word: Vocabulary = {
      ...newWord,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setWords([word, ...words]);
  };

  const updateWord = (id: string, updatedFields: Partial<Omit<Vocabulary, 'id' | 'createdAt'>>) => {
    setWords(words.map(w => w.id === id ? { ...w, ...updatedFields } : w));
  };

  const deleteWord = (id: string) => {
    if (confirm('確定要刪除這個生字嗎？')) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const addLesson = (title: string) => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
    };
    setLessons([...lessons, newLesson]);
  };

  const deleteLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
    // Optionally remove lessonId from words, or keep it as orphan
    setWords(words.map(w => w.lessonId === id ? { ...w, lessonId: undefined } : w));
  };

  const filteredWords = useMemo(() => {
    if (!selectedLessonId) return words;
    return words.filter(w => w.lessonId === selectedLessonId);
  }, [words, selectedLessonId]);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">生字温習本</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">你好, {user.username}</span>
              <button onClick={logout} className="text-red-600 hover:text-red-800 underline text-sm">登出</button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
             <div className="flex items-center gap-2 flex-1">
                <label className="text-gray-700 font-medium whitespace-nowrap">篩選課文:</label>
                <select 
                  value={selectedLessonId} 
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="p-2 border border-gray-300 rounded bg-white flex-1 max-w-xs"
                >
                  <option value="">全部生字</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                  ))}
                </select>
             </div>
             
             <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => setShowLessonManager(!showLessonManager)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  {showLessonManager ? '隱藏管理' : '管理課文'}
                </button>
                <button
                  onClick={() => setShowFlashcard(true)}
                  disabled={filteredWords.length === 0}
                  className={`px-4 py-2 rounded text-white transition ${
                    filteredWords.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  開始温習 ({filteredWords.length})
                </button>
                <button
                  onClick={() => setShowChallenge(true)}
                  disabled={filteredWords.length < 4}
                  className={`px-4 py-2 rounded text-white transition ${
                    filteredWords.length < 4
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  title={filteredWords.length < 4 ? "至少需要 4 個生字才能挑戰" : ""}
                >
                  小挑戰
                </button>
             </div>
          </div>
        </header>

        {showChallenge ? (
          <ChallengeHub 
            words={filteredWords} 
            onBack={() => setShowChallenge(false)} 
          />
        ) : (
          <>
            {showLessonManager && (
              <LessonManager 
                lessons={lessons} 
                onAddLesson={addLesson} 
                onDeleteLesson={deleteLesson} 
              />
            )}

            <AddWordForm onAdd={addWord} lessons={lessons} />

            <div className="mb-4 text-gray-600 font-medium">
              生字列表 ({filteredWords.length})
              {selectedLessonId && ` - ${lessons.find(l => l.id === selectedLessonId)?.title}`}
            </div>

            <WordList words={filteredWords} lessons={lessons} onDelete={deleteWord} onUpdate={updateWord} />
          </>
        )}

        {showFlashcard && (
          <Flashcard words={filteredWords} onClose={() => setShowFlashcard(false)} />
        )}
      </div>
    </div>
  );
}

// NOTE: You need to replace "YOUR_GOOGLE_CLIENT_ID" with your actual Google Client ID
// You can get one from https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "404800308160-1l3b1p2rqnqbd8j6s1hc3qk05osus39i.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      // @ts-ignore - The type definition might be missing 'language' or 'hl' but it is supported by GSI
      onScriptLoadError={() => console.error("Google Script Load Error")}
      onScriptLoadSuccess={() => {
        // Force locale if possible via global google object
        // This is a workaround as react-oauth/google doesn't expose locale prop directly on Provider
      }}
    >
      <AuthProvider>
        <StudyApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
