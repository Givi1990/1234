import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Создаем контекст
const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuth({ token });
      fetchUser(token).then(user => {
        setAuth(prev => ({ ...prev, user }));
        console.log('User object:', user); // Логируем объект пользователя
        console.log('Authenticated user ID:', user._id); // Логируем идентификатор пользователя
      }).catch(error => {
        console.error('Error fetching user:', error); // Обработка ошибки
      });
    }
  }, []);
  

  const fetchUser = async (token) => {
  try {
    const response = await axios.get('http://localhost:5002/api/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Server response:', response.data); // Логируем ответ сервера

    // Предполагаем, что текущий пользователь можно найти по email или другим критериям
    const currentUser = response.data.find(user => user.email === 'givi.khaduri@gmail.com'); // Замените на актуальный критерий

    return currentUser;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

  

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5002/api/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setAuth({ token });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    return new Promise((resolve) => {
      setAuth(null);
      localStorage.removeItem('token');
      resolve();
    });
  };

  const isAuthenticated = () => {
    return !!auth?.token || !!localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  return useContext(AuthContext);
};
