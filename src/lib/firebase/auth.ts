
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
import { GET_USER_BY_FIREBASE_ID } from '@/lib/graphql/queries';
// import { parseImg } from '@/lib/utils'; // parseImg non è usato qui direttamente

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

// Helper to decode JWT payload (client-side)
function decodeJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error("[decodeJwtPayload] Invalid token format: missing payload part.");
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[decodeJwtPayload] Failed to decode JWT payload:', error);
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
      console.log("[onAuthStatusChanged] Firebase user detected:", fbUser.uid);
      try {
        const idToken = await fbUser.getIdToken();
        const decodedTokenPayload = decodeJwtPayload(idToken);

        if (!decodedTokenPayload) {
          console.error("[onAuthStatusChanged] Failed to decode ID token. Signing out.");
          await firebaseSignOut(auth);
          callback(null, null);
          return;
        }

        const hasuraClaims = decodedTokenPayload['https://hasura.io/jwt/claims'];
        if (!hasuraClaims) {
          console.error("[onAuthStatusChanged] Hasura claims ('https://hasura.io/jwt/claims') not found in token. Signing out.");
          await firebaseSignOut(auth);
          callback(null, null);
          return;
        }

        const userRole = hasuraClaims['x-hasura-default-role'];
        console.log("[onAuthStatusChanged] User's x-hasura-default-role from token:", userRole);

        if (userRole !== 'admin' && userRole !== 'operator') {
          console.warn(`[onAuthStatusChanged] User role '${userRole}' is not authorized for this application. Signing out.`);
          await firebaseSignOut(auth);
          callback(null, null);
          return;
        }

        // Role is authorized, proceed to build AppUser
        let appUser: AppUser = {
          firebaseId: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          avatar: fbUser.photoURL,
          id: 0, // Default, will be overridden by Hasura data if available
          status: 'ACTIVE', // Default
          disabled: false, // Default
          role: userRole, // Set role from token
        };

        // Fetch extended profile from Hasura
        const extendedProfile = await getUserByFirebaseId(fbUser.uid);
        if (extendedProfile) {
          appUser = {
            ...appUser, // Keep defaults for fields not in extendedProfile
            ...extendedProfile, // Override with data from Hasura
            id: typeof extendedProfile.id === 'number' ? extendedProfile.id : (typeof extendedProfile.id === 'string' ? parseInt(extendedProfile.id, 10) : appUser.id),
            avatar: extendedProfile.avatar || appUser.avatar, // Prefer Hasura avatar
            displayName: `${extendedProfile.first_name || ''} ${extendedProfile.last_name || ''}`.trim() || appUser.displayName || fbUser.email,
            status: extendedProfile.status || appUser.status, // Prefer Hasura status
            disabled: extendedProfile.status === 'DISABLED',
             // Role from token is authoritative for access, but extendedProfile.role can be used for display or other logic
            role: extendedProfile.role || userRole,
          };
        } else {
          console.warn(`[onAuthStatusChanged] User ${fbUser.uid} authenticated with Firebase but no extended profile found in DB. Using token role and Firebase display name.`);
          if (!appUser.displayName && appUser.email) {
            appUser.displayName = appUser.email;
          }
          // appUser.role is already set from token claims
        }
        console.log("[onAuthStatusChanged] Authorized user. AppUser data:", appUser);
        callback(appUser, fbUser);

      } catch (error) {
        console.error("[onAuthStatusChanged] Error processing Firebase user or fetching token/profile:", error);
        // Attempt to sign out to prevent inconsistent states
        await firebaseSignOut(auth).catch(e => console.error("[onAuthStatusChanged] Error signing out after processing error:", e));
        callback(null, null);
      }
    } else {
      console.log("[onAuthStatusChanged] No Firebase user detected (user signed out or session expired).");
      callback(null, null);
    }
  });
};

// Funzione per creare un utente in Firebase Authentication (Client SDK)
export const registerFirebaseUser = async (email: string, password?: string): Promise<FirebaseUser> => {
  if (!password) {
    // Questo scenario non dovrebbe verificarsi con il flusso attuale del NewOperatorForm,
    // ma è una salvaguardia se la funzione viene chiamata senza password.
    // In produzione, la password dovrebbe sempre essere fornita o gestita in modo sicuro.
    console.warn("[registerFirebaseUser] Password not provided. This might lead to issues if Firebase requires it.");
    // Firebase createUserWithEmailAndPassword richiede una password.
    // Se vuoi generare una password casuale qui, dovresti farlo, ma il form ora la fornisce.
    // Per ora, se password è undefined, lanciamo un errore per chiarezza.
    throw new Error("Password is required to create a Firebase user with Client SDK.");
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user in Firebase Auth (Client SDK):", error);
    throw error;
  }
};

// Funzione per inviare l'email di reset password
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};
