import React, { useState } from 'react';
import type { Lesson } from '../types';

interface LessonManagerProps {
  lessons: Lesson[];
  onAddLesson: (title: string) => void;
  onDeleteLesson: (id: string) => void;
}

export const LessonManager: React.FC<LessonManagerProps> = ({ lessons, onAddLesson, onDeleteLesson }) => {
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLessonTitle.trim()) {
      onAddLesson(newLessonTitle.trim());
      setNewLessonTitle('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">課文分類管理</h2>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="新增課文分類 (例如：Lesson 1)"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
        >
          新增
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {lessons.length === 0 ? (
          <span className="text-gray-500 text-sm">暫無課文分類</span>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-gray-800">{lesson.title}</span>
              <button
                onClick={() => {
                  if (confirm(`確定要刪除「${lesson.title}」分類嗎？(生字不會被刪除)`)) {
                    onDeleteLesson(lesson.id);
                  }
                }}
                className="text-gray-400 hover:text-red-500 font-bold"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
