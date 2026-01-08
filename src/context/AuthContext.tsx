import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { jwtDecode } from "jwt-decode";
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

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
      // Direct Firestore query
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('帳號或密碼錯誤');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const currentUser: User = {
        id: userDoc.id,
        username: userData.username,
        createdAt: userData.createdAt
      };

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
      const usersRef = collection(db, 'users');
      
      // Check if user exists
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('使用者名稱已被使用');
      }

      // Create user
      const newUser = {
        username,
        password,
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(usersRef, newUser);
      
      const currentUser: User = {
        id: docRef.id,
        username: newUser.username,
        createdAt: newUser.createdAt
      };

      setUser(currentUser);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
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

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', email));
      const querySnapshot = await getDocs(q);

      let currentUser: User;

      if (querySnapshot.empty) {
        // Create new user
        const newUser = {
          username: email,
          googleId,
          createdAt: Date.now()
        };
        const docRef = await addDoc(usersRef, newUser);
        currentUser = {
          id: docRef.id,
          username: newUser.username,
          createdAt: newUser.createdAt
        };
      } else {
        // User exists
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Update googleId if missing
        if (!userData.googleId) {
           await updateDoc(userDoc.ref, { googleId });
        }

        currentUser = {
          id: userDoc.id,
          username: userData.username,
          createdAt: userData.createdAt
        };
      }

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
