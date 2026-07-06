import { getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { firebaseConfig, hasFirebaseConfig } from '../config/firebase';
import { UserProfile } from '../types/models';

let firebaseReady = false;

function ensureFirebase() {
  if (!hasFirebaseConfig()) return null;
  if (getApps().length === 0) {
    initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
  }
  firebaseReady = true;
  return true;
}

export function isCloudSyncEnabled(): boolean {
  return Boolean(ensureFirebase());
}

export async function signInWithGoogleToken(idToken: string) {
  if (!ensureFirebase()) {
    throw new Error('Firebase no configurado. Usa modo invitado o configura variables EXPO_PUBLIC_FIREBASE_*');
  }

  const auth = getAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return {
    id: result.user.uid,
    email: result.user.email ?? undefined,
    displayName: result.user.displayName ?? 'Hechicero',
  };
}

export async function pullProfile(userId: string): Promise<UserProfile | null> {
  if (!firebaseReady && !ensureFirebase()) return null;
  const snapshot = await getDoc(doc(getFirestore(), 'profiles', userId));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function pushProfile(profile: UserProfile): Promise<void> {
  if (!firebaseReady && !ensureFirebase()) return;
  await setDoc(doc(getFirestore(), 'profiles', profile.id), profile, { merge: true });
}
