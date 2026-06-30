import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'USER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  provider: 'google' | 'github';
  telegramChatId?: string;
  telegramUsername?: string;
  telegramVerificationToken?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithGithub: (code: string) => Promise<void>;
  loginWithDemo: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('wg_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('wg_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { idToken });
      const { token, user: userData } = response.data;
      localStorage.setItem('wg_token', token);
      setUser(userData);
    } catch (err) {
      console.error('Google login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async (code: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/github', { code });
      const { token, user: userData } = response.data;
      localStorage.setItem('wg_token', token);
      setUser(userData);
    } catch (err) {
      console.error('GitHub login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (email: string, name?: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/email', { email, name });
      const { token, user: userData } = response.data;
      localStorage.setItem('wg_token', token);
      setUser(userData);
    } catch (err) {
      console.error('Demo login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('wg_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithGithub, loginWithDemo, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
