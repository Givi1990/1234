import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Updated import

const AuthContext = createContext();

const api = "http://localhost:5002/api";
// const api = "https://cadd-93-177-143-13.ngrok-free.app"

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuth({ token });
      fetchUser(token).then(user => {
        setAuth(prev => ({ ...prev, user }));
      }).catch(error => {
        console.error('Error fetching user:', error);
      });
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${api}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users = response.data;
      console.log(users);
      
      const userId = jwtDecode(token).id;
      const currentUser = users.find(user => user._id === userId);

      if (!currentUser) {
        throw new Error('User not found');
      }

      return currentUser;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${api}/login`, { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      const user = await fetchUser(token);
      setAuth({ token, user });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    return new Promise((resolve) => {
      setAuth({ token: null, user: null });
      localStorage.removeItem('token');
      resolve();
    });
  };

  const isAuthenticated = () => !!auth.token;

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
