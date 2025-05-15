
import { 
  auth // Importa l'istanza auth configurata
} from './config'; 
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser // Rinomina per chiarezza, User è già nel nostro src/types
} from 'firebase/auth';
import type { User as AppUser } from '@/types'; // Il nostro tipo User applicativo
import { apiClient } from '@/lib/graphql/client'; 
import { GET_USER_BY_FIREBASE_ID } from '@/lib/graphql/queries';

// Funzione per recuperare i dettagli dell'utente da Hasura
async function getUserByFirebaseId(firebaseId: string): Promise<Partial<AppUser> | null> {
  try {
    // La query GET_USER_BY_FIREBASE_ID è già definita in queries.ts
    // e attende una variabile $firebaseId
    const response = await apiClient<{ users: any[] }>(GET_USER_BY_FIREBASE_ID, { firebaseId });

    if (response.errors) {
      console.error("GraphQL error fetching user by firebaseId:", response.errors);
      return null;
    }

    if (response.data && response.data.users && response.data.users.length > 0) {
      const dbUser = response.data.users[0];
      // Mappa i campi dalla risposta di Hasura al nostro tipo AppUser
      return {
        id: parseInt(dbUser.id, 10), // DB ID
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
        // Calcola displayName e disabled qui o nel callback di onAuthStatusChanged
      };
    }
    console.warn(`User with firebaseId ${firebaseId} not found in DB.`);
    return null;
  } catch (error) {
    console.error("Error fetching user data from Hasura by firebaseId:", error);
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
      // Dati base da FirebaseUser
      let appUser: AppUser = {
        firebaseId: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName, 
        id: 0, // Placeholder DB ID, sarà sovrascritto
      };

      try {
        const extendedProfile = await getUserByFirebaseId(fbUser.uid);
        if (extendedProfile) {
          appUser = {
            ...appUser, // Dati base da Firebase
            ...extendedProfile, // Sovrascrive con i dati da Hasura
            // Assicurati che id sia un numero se extendedProfile.id è stringa
            id: typeof extendedProfile.id === 'string' ? parseInt(extendedProfile.id, 10) : extendedProfile.id || appUser.id,
            disabled: extendedProfile.status === 'disabled',
            displayName: `${extendedProfile.first_name || ''} ${extendedProfile.last_name || ''}`.trim() || appUser.displayName,
          };
        } else {
          console.warn(`User ${fbUser.uid} authenticated with Firebase but no extended profile found in DB.`);
          // Potresti voler gestire questo caso, es. se un utente Firebase non ha un record corrispondente nel DB
          // Forniamo comunque i dati base di Firebase
          if (!appUser.displayName && appUser.email) { // Fallback per displayName
             appUser.displayName = appUser.email;
          }
          // Potresti voler assegnare un ruolo di default o gestire diversamente
          appUser.role = appUser.role || 'user'; // Fallback role
          appUser.disabled = appUser.disabled || false; // Fallback status
        }
      } catch (error) {
        console.error("Failed to fetch extended user profile during onAuthStatusChanged:", error);
        // In caso di errore nel fetch del profilo, procedi con i dati base di Firebase
         if (!appUser.displayName && appUser.email) {
             appUser.displayName = appUser.email;
          }
        appUser.role = appUser.role || 'user';
        appUser.disabled = appUser.disabled || false;
      }
      
      callback(appUser, fbUser);
    } else {
      callback(null, null);
    }
  });
};
