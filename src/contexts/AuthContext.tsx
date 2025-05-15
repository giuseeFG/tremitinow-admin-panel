
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
    // onAuthStatusChanged gestisce la logica di recupero utente
    // e la trasformazione in AppUser.
    // La funzione di cleanup (unsubscribe) viene restituita e chiamata quando il componente smonta.
    const unsubscribe = onAuthStatusChanged((appUser, fbUser) => {
      setUser(appUser);
      setFirebaseUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && !pathname.startsWith('/_next/')) {
      router.replace('/login');
    } else if (!loading && user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);
  

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      // signInUserWithEmailAndPassword si occuperà di chiamare Firebase.
      // onAuthStatusChanged aggiornerà lo stato utente.
      await signInUserWithEmailAndPassword(email, pass);
      // La redirezione avverrà tramite l'useEffect che osserva [user, loading, pathname]
    } catch (error) {
      console.error("Failed to login with Firebase:", error);
      // Qui potresti voler impostare un messaggio di errore specifico per il login
      // Per ora, l'errore viene loggato e lo stato di caricamento gestito.
      // L'utente rimarrà null se il login fallisce, e onAuthStatusChanged lo confermerà.
      throw error; // Rilancia l'errore per gestirlo nel LoginForm
    } finally {
      setLoading(false); // Assicurati che loading sia false dopo il tentativo
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      // onAuthStatusChanged imposterà user a null e loading a false.
      // La redirezione avverrà tramite l'useEffect.
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
