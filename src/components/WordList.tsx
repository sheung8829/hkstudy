import React, { useState } from 'react';
import type { Vocabulary, Lesson } from '../types';
import { SpeakButton } from './SpeakButton';
import { compressImage } from '../utils/image';

interface WordListProps {
  words: Vocabulary[];
  lessons: Lesson[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFields: Partial<Omit<Vocabulary, 'id' | 'createdAt'>>) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, lessons, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Omit<Vocabulary, 'id' | 'createdAt'>>>({});

  if (words.length === 0) {
    return <div className="text-center text-gray-500 py-8">暫時沒有生字，請新增！</div>;
  }

  const getLessonTitle = (lessonId?: string) => {
    if (!lessonId) return null;
    return lessons.find(l => l.id === lessonId)?.title;
  };

  const startEdit = (word: Vocabulary) => {
    setEditingId(word.id);
    setEditForm({
      word: word.word,
      meaning: word.meaning,
      example: word.example,
      imageUrl: word.imageUrl,
      lessonId: word.lessonId
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = (id: string) => {
    onUpdate(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setEditForm(prev => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (error) {
        console.error('Image processing failed:', error);
        alert('圖片處理失敗，請重試');
      }
    }
  };

  return (
    <div className="space-y-4">
      {words.map((word) => {
        const isEditing = editingId === word.id;
        const lessonTitle = getLessonTitle(word.lessonId);

        if (isEditing) {
          return (
            <div key={word.id} className="bg-white p-4 rounded-lg shadow border-2 border-blue-500">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">生字</label>
                  <input
                    type="text"
                    value={editForm.word || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, word: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">解釋</label>
                  <input
                    type="text"
                    value={editForm.meaning || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, meaning: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">例句</label>
                  <input
                    type="text"
                    value={editForm.example || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, example: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">所屬課文</label>
                  <select
                    value={editForm.lessonId || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, lessonId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">(無)</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">圖片</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                      id={`edit-file-upload-${word.id}`}
                    />
                    <label 
                      htmlFor={`edit-file-upload-${word.id}`}
                      className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300 text-sm transition"
                    >
                      選擇圖片
                    </label>
                    
                    {editForm.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={editForm.imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded border" />
                        <button 
                          onClick={() => setEditForm(prev => ({ ...prev, imageUrl: undefined }))}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          移除
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">未選擇任何圖片</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={cancelEdit} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">取消</button>
                  <button onClick={() => handleSave(word.id)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">儲存</button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={word.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-gray-900 mr-2">{word.word}</h3>
                <SpeakButton text={word.word} />
                {lessonTitle && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {lessonTitle}
                  </span>
                )}
              </div>
              <div className="flex items-start space-x-4">
                {word.imageUrl && (
                  <img 
                    src={word.imageUrl} 
                    alt={word.meaning || '解釋圖片'} 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{word.meaning}</p>
                    {word.meaning && <SpeakButton text={word.meaning} />}
                  </div>
                  {word.example && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-gray-500 italic">"{word.example}"</p>
                      <SpeakButton text={word.example} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={() => startEdit(word)}
                className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
              >
                修改
              </button>
              <button
                onClick={() => onDelete(word.id)}
                className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
              >
                刪除
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
