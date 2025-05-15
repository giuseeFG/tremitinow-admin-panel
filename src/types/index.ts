
export interface User {
  id: string; // Firebase UID
  email: string | null;
  
  // Direttamente da FirebaseUser, possono essere mappati
  displayName?: string | null; 
  avatarUrl?: string | null; // da photoURL o dal campo 'avatar' del backend

  // Previsti dal backend dopo fetch con firebaseId (tramite getUserByFirebaseId)
  firstName?: string; // Corrisponde a first_name
  lastName?: string; // Corrisponde a last_name
  role?: 'user' | 'operator' | string; // Ruolo dal backend, più flessibile
  createdAt?: string; // Data di creazione ISO dal backend
  disabled?: boolean; // Potrebbe derivare da un campo 'status'

  // Altri campi potenziali dal backend (come mostrato in GET_USER_BY_FIREBASE_ID)
  dbId?: string; // ID del database del backend, se diverso da Firebase UID
  auth_complete?: boolean;
  born?: string; 
  cover?: string;
  notifications_enabled?: boolean;
  phone?: string;
  sex?: string;
  status?: string; // es. 'active', 'disabled', 'pending' -> per 'disabled'
  step?: number | string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    displayName: string;
  };
  group?: {
    id:string;
    title: string;
  };
  createdAt: string; // ISO date string
}

export interface Page {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO date string
}

export interface Request {
  id: string;
  email: string;
  name: string;
  note: string;
  createdAt: string; // ISO date string
}
