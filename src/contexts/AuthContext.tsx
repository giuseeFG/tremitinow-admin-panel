"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - in a real app, this would come from Firebase Auth
const MOCK_OPERATOR_USER: User = {
  id: 'op1',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'op@example.com',
  role: 'operator',
  createdAt: new Date().toISOString(),
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking auth state
    const storedUser = localStorage.getItem('tremiti-auth-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    } else if (!loading && user && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);
  

  const login = async (email: string, pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === 'op@example.com' && pass === 'password') {
      localStorage.setItem('tremiti-auth-user', JSON.stringify(MOCK_OPERATOR_USER));
      setUser(MOCK_OPERATOR_USER);
      router.push('/dashboard');
    } else {
      // Basic error handling for demo
      alert('Invalid credentials. Use op@example.com and password.');
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('tremiti-auth-user');
    setUser(null);
    router.push('/login');
    setLoading(false);
  };
  
  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
