
import { 
  auth // Importa l'istanza auth configurata
} from './config'; 
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser, // Rinomina per chiarezza, User è già nel nostro src/types
  createUserWithEmailAndPassword, // Importa la funzione per creare utenti
  sendPasswordResetEmail // Importa la funzione per inviare email di reset password
} from 'firebase/auth';
import type { User as AppUser } from '@/types'; // Il nostro tipo User applicativo
import { apiClient } from '@/lib/graphql/client'; 
import { GET_USER_BY_FIREBASE_ID, UPDATE_USER_STATUS_MUTATION } from '@/lib/graphql/queries'; // Ensure UPDATE_USER_STATUS_MUTATION is imported if used elsewhere, though not directly here
import { parseImg } from '@/lib/utils'; // Import parseImg

// Funzione per recuperare i dettagli dell'utente da Hasura
async function getUserByFirebaseId(firebaseId: string): Promise<Partial<AppUser> | null> {
  console.log(`[getUserByFirebaseId] Fetching user data for firebaseId: ${firebaseId}`);
  try {
    const response = await apiClient<{ users: any[] }>(GET_USER_BY_FIREBASE_ID, { firebaseId });

    if (response.errors) {
      console.error("[getUserByFirebaseId] GraphQL error fetching user by firebaseId:", JSON.stringify(response.errors, null, 2));
      return null;
    }

    if (response.data && response.data.users && response.data.users.length > 0) {
      const dbUser = response.data.users[0];
      console.log("[getUserByFirebaseId] User data found in DB:", dbUser);
      return {
        id: parseInt(dbUser.id, 10),
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        avatar: dbUser.avatar,
        role: dbUser.role,
        status: dbUser.status,
        auth_complete: dbUser.auth_complete,
        born: dbUser.born,
        cover: dbUser.cover,
        notifications_enabled: dbUser.notifications_enabled,
        phone: dbUser.phone,
        sex: dbUser.sex,
        step: dbUser.step,
        created_at: dbUser.created_at,
      };
    }
    console.warn(`[getUserByFirebaseId] User with firebaseId ${firebaseId} not found in DB.`);
    return null;
  } catch (error) {
    console.error("[getUserByFirebaseId] Catch block: Error fetching user data from Hasura by firebaseId:", error);
    return null;
  }
}


export const signInUserWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOutUser = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

export const onAuthStatusChanged = (
  callback: (user: AppUser | null, firebaseUser: FirebaseUser | null) => void
): (() => void) => { 
  return firebaseOnAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      let appUser: AppUser = {
        firebaseId: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName, 
        avatar: fbUser.photoURL,
        id: 0, 
        status: 'ACTIVE', 
        disabled: false, // Default to false, derived from status later
      };

      try {
        const extendedProfile = await getUserByFirebaseId(fbUser.uid);
        if (extendedProfile) {
          appUser = {
            ...appUser, 
            ...extendedProfile, 
            id: typeof extendedProfile.id === 'string' ? parseInt(extendedProfile.id, 10) : extendedProfile.id || appUser.id,
            avatar: extendedProfile.avatar || appUser.avatar,
            displayName: `${extendedProfile.first_name || ''} ${extendedProfile.last_name || ''}`.trim() || appUser.displayName || fbUser.email,
            status: extendedProfile.status || appUser.status,
            disabled: extendedProfile.status === 'DISABLED',
          };
        } else {
          console.warn(`[onAuthStatusChanged] User ${fbUser.uid} authenticated with Firebase but no extended profile found in DB.`);
          if (!appUser.displayName && appUser.email) {
             appUser.displayName = appUser.email;
          }
          appUser.role = appUser.role || 'user'; 
          appUser.status = appUser.status || 'ACTIVE';
          appUser.disabled = appUser.status === 'DISABLED';
        }
      } catch (error) {
        console.error("[onAuthStatusChanged] Failed to fetch extended user profile:", error);
         if (!appUser.displayName && appUser.email) {
             appUser.displayName = appUser.email;
          }
        appUser.role = appUser.role || 'user';
        appUser.status = appUser.status || 'ACTIVE';
        appUser.disabled = appUser.status === 'DISABLED';
      }
      
      callback(appUser, fbUser);
    } else {
      callback(null, null);
    }
  });
};

// Funzione per creare un utente in Firebase Authentication (Client SDK)
// Rinominata come richiesto dall'utente
export const registerFirebaseUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user in Firebase Auth:", error);
    throw error; // Rilancia l'errore per gestirlo nel form
  }
};

// Funzione per inviare l'email di reset password
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error; // Rilancia l'errore
  }
};
