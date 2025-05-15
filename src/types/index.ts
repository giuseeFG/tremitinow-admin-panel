

export interface User {
  id: number; // Database primary key (e.g., from users.id)
  firebaseId: string; // Firebase UID
  email: string | null;
  
  first_name?: string;
  last_name?: string;
  avatar?: string | null; // from users.avatar
  role?: 'user' | 'operator' | string; // From users.role
  status?: 'ACTIVE' | 'DISABLED' | string; // From users.status
  disabled?: boolean; // Derived from status, e.g., status === 'DISABLED'
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
  description?: string | null; // groups.description
  created_at?: string; // groups.created_at, ISO date string
  
  active?: boolean;
  can_send_notification?: boolean;
  can_publish_on_fb?: boolean;
  additional_btn_text?: string | null;
  additional_url?: string | null;
  btn_info_text?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  cover?: string | null;
  
  group_categories_2?: Array<{
    category?: { 
      id: number;
      category?: string; // Name of the category
    } | null;
  }>;

  // For list view, category might be simpler
  category?: { 
    id: number;
    category: string;
  } | null;

  metadata?: {
    address?: string | null;
    // phone, email, web, avatar, cover are now direct properties
    [key: string]: any;
  };
}

export interface AppRequest { // Renamed from Request to AppRequest
  id: number; // form_requests.id
  email: string;
  page_name: string | null; // from form_requests.page_name
  notes: string | null; // from form_requests.notes
  created_at: string; // ISO date string
  category?: { // Updated from category_detail due to GraphQL alias
    category?: string | null;
  } | null;
}

export interface GroupCategory {
  id: number;
  category: string;
}
