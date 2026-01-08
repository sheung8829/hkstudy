import React, { useState, useRef } from 'react';
import type { Vocabulary, Lesson } from '../types';
import { compressImage } from '../utils/image';

interface AddWordFormProps {
  onAdd: (word: Omit<Vocabulary, 'id' | 'createdAt'>) => void;
  lessons: Lesson[];
}

export const AddWordForm: React.FC<AddWordFormProps> = ({ onAdd, lessons }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const base64 = await compressImage(file);
        setImageUrl(base64);
      } catch (error) {
        console.error('Failed to process image', error);
        alert('圖片處理失敗');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      alert('請輸入生字');
      return;
    }
    if (!meaning.trim() && !imageUrl) {
      alert('解釋欄位請至少輸入文字或上傳圖片');
      return;
    }
    onAdd({ word, meaning, example, imageUrl, lessonId: lessonId || undefined });
    setWord('');
    setMeaning('');
    setExample('');
    setImageUrl('');
    // Keep the lesson selected for convenience
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">新增生字</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">課文分類 (選填)</label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">(無分類)</option>
            {lessons.map(lesson => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">生字</label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="例如：Ephemeral"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">解釋 (可文字或圖片，或兩者皆有)</label>
        <input
          type="text"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
          placeholder="例如：短暫的"
        />
        
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden" 
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-full border-0 transition duration-200"
          >
            選擇圖片
          </label>
          <span className="text-sm text-gray-500">
            {imageUrl ? '已選擇圖片' : '未選擇任何圖片'}
          </span>

          {imageUrl && (
            <div className="relative ml-2">
              <img src={imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {isProcessing && <p className="text-sm text-blue-500 mt-1">處理圖片中...</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">例句 (選填)</label>
        <textarea
          value={example}
          onChange={(e) => setExample(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="例如：Fashion is ephemeral."
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full text-white py-2 px-4 rounded transition duration-200 ${
          isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        新增
      </button>
    </form>
  );
};
