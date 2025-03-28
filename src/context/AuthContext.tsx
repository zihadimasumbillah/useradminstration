'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '@/config/axios';
import { User } from '@/types/user';

interface AuthContextType {
  isLoading: boolean;
  loading: boolean; 
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get('/api/auth/me');
        setUser(response.data.user);
        setIsAdmin(response.data.user.role === 'admin');
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    setIsAdmin(response.data.user.role === 'admin');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loading: isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
