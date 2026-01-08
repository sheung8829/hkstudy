import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, googleLogin, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (isRegister) {
      await register(username.trim(), password.trim());
    } else {
      await login(username.trim(), password.trim());
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    clearError();
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isRegister ? '註冊帳號' : '登入生字温習本'}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">使用者名稱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="請輸入您的名字"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="請輸入密碼"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200 mb-4"
          >
            {isRegister ? '註冊' : '登入'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
           <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) {
                  googleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.log('Google Login Failed');
              }}
              // useOneTap // Disabled temporarily to avoid FedCM NetworkError on localhost port mismatch
            />
        </div>

        <div className="text-center text-sm">
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {isRegister ? '已有帳號？點此登入' : '還沒有帳號？點此註冊'}
          </button>
        </div>
      </div>
    </div>
  );
};
