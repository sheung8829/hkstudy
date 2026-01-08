export interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  example: string;
  imageUrl?: string;
  lessonId?: string; // Optional for backward compatibility, but we will use it
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Simple password, stored locally (not secure, but fits requirements)
  createdAt: number;
}

export interface Lesson {
  id: string;
  title: string;
  createdAt: number;
}
