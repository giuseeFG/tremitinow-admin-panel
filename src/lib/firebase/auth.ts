
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

export const signInUserWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOutUser = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Questa funzione wrappa onAuthStateChanged per trasformare FirebaseUser nel nostro AppUser (parzialmente)
// e gestire il caricamento dello stato utente esteso dal backend.
export const onAuthStatusChanged = (
  callback: (user: AppUser | null, firebaseUser: FirebaseUser | null) => void
): (() => void) => { // Restituisce la funzione di unsubscribe
  return firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // Mappa i dati base da FirebaseUser al nostro AppUser
      const appUser: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        avatarUrl: firebaseUser.photoURL,
        // I campi come firstName, lastName, role, ecc.,
        // dovrebbero essere recuperati dal tuo backend (es. usando getUserByFirebaseId).
        // Per ora, li lasciamo non definiti o puoi impostare dei placeholder.
      };
      // Qui potresti chiamare la tua funzione per recuperare dati aggiuntivi:
      // try {
      //   const extendedProfile = await getUserByFirebaseId(firebaseUser.uid); // getUserByFirebaseId non è definito qui
      //   if (extendedProfile) {
      //     appUser.firstName = extendedProfile.first_name;
      //     appUser.lastName = extendedProfile.last_name;
      //     appUser.role = extendedProfile.role;
      //     appUser.dbId = extendedProfile.id; // L'ID del DB, se diverso da Firebase UID
      //     appUser.createdAt = extendedProfile.created_at;
      //     appUser.status = extendedProfile.status;
      //     appUser.disabled = extendedProfile.status === 'disabled'; // Esempio di logica
      //     // ... mappa altri campi necessari
      //   }
      // } catch (error) {
      //   console.error("Failed to fetch extended user profile:", error);
      // }
      callback(appUser, firebaseUser);
    } else {
      callback(null, null);
    }
  });
};
