import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  register: (username: string, password?: string) => Promise<boolean>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (username: string, password?: string) => {
    clearError();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '登入失敗');
      }

      const currentUser = await response.json();
      setUser(currentUser);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const register = async (username: string, password?: string) => {
    clearError();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '註冊失敗');
      }

      const newUser = await response.json();
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const googleLogin = async (credential: string) => {
    clearError();
    try {
      const decoded: any = jwtDecode(credential);
      const googleId = decoded.sub;
      const email = decoded.email;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, googleId })
      });

      if (!response.ok) {
        throw new Error('Google 登入失敗');
      }

      const currentUser = await response.json();
      setUser(currentUser);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setError(err.message || 'Google 登入失敗');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    clearError();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
