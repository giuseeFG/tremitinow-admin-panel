
export interface User {
  id: number; // Database primary key (e.g., from users.id)
  firebaseId: string; // Firebase UID
  email: string | null;
  
  first_name?: string;
  last_name?: string;
  avatar?: string | null; // from users.avatar
  role?: 'user' | 'operator' | string; // From users.role
  status?: string; // From users.status
  disabled?: boolean; // Derived from status, e.g., status === 'disabled'
  created_at?: string; // ISO date string from users.created_at

  // Fields from your GET_USER_BY_FIREBASE_ID query
  auth_complete?: boolean;
  born?: string; 
  cover?: string;
  notifications_enabled?: boolean;
  phone?: string;
  sex?: string;
  step?: number | string;

  // For display purposes, combining first and last name
  displayName?: string; 
}

export interface Post {
  id: number; // From posts.id
  title: string;
  content: string;
  author: {
    id: number; // User's database ID (users.id)
    first_name?: string;
    last_name?: string;
    displayName?: string; // Combined first_name and last_name
    avatar?: string | null;
  };
  group?: {
    id: number; // groups.id
    title: string;
    avatar?: string | null;
  } | null; // posts.group can be null
  created_at: string; // ISO date string
  media?: string[] | null; // Assuming media is an array of URLs or identifiers
  tags?: string[] | null;
}

export interface Page { // Mapped from 'groups' table in Hasura
  id: number; // groups.id
  title: string; // groups.title
  content: string | null; // groups.description
  created_at: string; // groups.created_at, ISO date string
  metadata?: {
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    web?: string | null;
    avatar?: string | null;
    cover?: string | null;
    // Add other fields from 'groups' table as needed
    [key: string]: any;
  };
}

export interface Request { // Mapped from 'form_requests' table
  id: number; // form_requests.id
  email: string;
  name: string | null; // from form_requests.page_name (or consider if another field represents user's name)
  note: string | null; // from form_requests.notes
  created_at: string; // ISO date string
  category_detail?: { // From form_requests.category_detail
    category?: string | null;
  } | null;
}
