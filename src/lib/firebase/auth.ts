
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
// import { apiClient } from '@/lib/graphql/client'; // Importeresti il tuo client GraphQL
// import { GET_USER_BY_FIREBASE_ID } from '@/path-to-your-graphql-queries'; // Sostituisci con il percorso corretto

// La tua funzione getUserByFirebaseId (o una versione adattata) andrebbe qui o in un file service.
// async function getUserByFirebaseId(firebaseId: string): Promise<Partial<AppUser> | null> {
//   //   const GET_USER_QUERY = `
//   //     query GetUserByFirebaseId($firebaseId: String!) {
//   //       users(where: {firebaseId: {_eq: $firebaseId}}) {
//   //         id # DB ID
//   //         first_name
//   //         last_name
//   //         avatar
//   //         role
//   //         status
//   //         # ... altri campi necessari da users table
//   //       }
//   //     }
//   //   `;
//   //   try {
//   //     const response = await apiClient<{ users: any[] }>(GET_USER_QUERY, { firebaseId });
//   //     if (response.data && response.data.users && response.data.users.length > 0) {
//   //       const dbUser = response.data.users[0];
//   //       return {
//   //         id: dbUser.id, // DB ID
//   //         first_name: dbUser.first_name,
//   //         last_name: dbUser.last_name,
//   //         avatar: dbUser.avatar,
//   //         role: dbUser.role,
//   //         status: dbUser.status,
//   //         // Mappa altri campi qui
//   //       };
//   //     }
//   //     return null;
//   //   } catch (error) {
//   //     console.error("Error fetching user data from Hasura:", error);
//   //     return null;
//   //   }
//    return null; // Placeholder
// }


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
        displayName: fbUser.displayName, // Potrebbe essere sovrascritto da first_name/last_name
        // Questi sono placeholder, id (db id), first_name, etc. verranno dal fetch del profilo esteso
        id: 0, // Placeholder DB ID, sarà sovrascritto
      };

      // TODO: Recupera il profilo utente esteso dal tuo backend (Hasura)
      // try {
      //   const extendedProfile = await getUserByFirebaseId(fbUser.uid); // Sostituisci con la tua implementazione
      //   if (extendedProfile) {
      //     appUser = {
      //       ...appUser,
      //       ...extendedProfile, // Sovrascrive con i dati da Hasura
      //       disabled: extendedProfile.status === 'disabled',
      //       displayName: `${extendedProfile.first_name || ''} ${extendedProfile.last_name || ''}`.trim() || appUser.displayName,
      //     };
      //   } else {
      //     // Utente autenticato con Firebase ma non trovato nel DB Hasura?
      //     // Gestisci questo caso: potrebbe essere un nuovo utente che necessita di creazione record in 'users'
      //     console.warn(`User ${fbUser.uid} authenticated with Firebase but no profile found in DB.`);
      //   }
      // } catch (error) {
      //   console.error("Failed to fetch extended user profile:", error);
      //   // Potresti voler gestire questo errore, ad es. facendo logout o mostrando un messaggio
      // }
      
      // Per ora, usiamo solo i dati Firebase e alcuni mock per ruolo/nome se non disponibili
      // Questo blocco è temporaneo fino a quando getUserByFirebaseId non è implementato
      if (!appUser.first_name && fbUser.displayName) {
         const nameParts = fbUser.displayName.split(' ');
         appUser.first_name = nameParts[0];
         appUser.last_name = nameParts.slice(1).join(' ');
      }
      appUser.role = appUser.email === 'op@example.com' ? 'operator' : 'user'; // Mock role
      appUser.disabled = false; // Mock status
      appUser.id = Date.now(); // Mock DB ID, da sostituire


      callback(appUser, fbUser);
    } else {
      callback(null, null);
    }
  });
};
