
"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  signInUserWithEmailAndPassword, 
  signOutUser, 
  onAuthStatusChanged 
} from '@/lib/firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth'; // Per il tipo restituito da onAuthStatusChanged

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null; // Potrebbe essere utile esporre il FirebaseUser originale
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStatusChanged((appUser, fbUser) => {
      setUser(appUser);
      setFirebaseUser(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAppPage = pathname.startsWith('/dashboard') || pathname.startsWith('/utenti') || pathname.startsWith('/operatori') || pathname.startsWith('/posts') || pathname.startsWith('/pagine') || pathname.startsWith('/richieste') || pathname.startsWith('/operator-dashboard') || pathname.startsWith('/tasse-sbarco') || pathname.startsWith('/permessi-veicoli');
      
      if (!user && isAppPage && pathname !== '/login') {
        router.replace('/login');
      } else if (user && pathname === '/login') {
        if (user.role === 'operator') {
          router.replace('/operator-dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else if (user) {
        // Redirect if user is on the wrong dashboard
        if (user.role === 'operator' && pathname === '/dashboard') {
          router.replace('/operator-dashboard');
        } else if (user.role !== 'operator' && pathname === '/operator-dashboard') {
          router.replace('/dashboard');
        }
        // Redirect if operator tries to access admin-only pages
        if (user.role === 'operator' && (pathname.startsWith('/utenti') || pathname.startsWith('/operatori') || pathname.startsWith('/posts') || pathname.startsWith('/pagine') || pathname.startsWith('/richieste'))) {
           router.replace('/operator-dashboard'); // Or a specific "access denied" page
        }
      }
    }
  }, [user, loading, pathname, router]);
  

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInUserWithEmailAndPassword(email, pass);
    } catch (error) {
      console.error("Failed to login with Firebase:", error);
      throw error; 
    } finally {
      setLoading(false); 
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error("Failed to logout with Firebase:", error);
      setLoading(false);
    }
  };
  
  const value = { user, firebaseUser, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
