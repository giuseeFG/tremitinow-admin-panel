export interface User {
  id: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'operator';
  createdAt: string; // ISO date string
  disabled?: boolean;
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
