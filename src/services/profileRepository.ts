import { UserProfile } from '../types/models';
import { loadEncrypted, saveEncrypted } from './encryptedStorage';
import { pullProfile, pushProfile } from './firebaseClient';

const PROFILE_KEY = 'jjfit_profile_v1';

export async function loadLocalProfile(): Promise<UserProfile | null> {
  return loadEncrypted<UserProfile>(PROFILE_KEY);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await saveEncrypted(PROFILE_KEY, profile);
  await pushProfile(profile);
}

export async function hydrateProfile(userId: string): Promise<UserProfile | null> {
  const [local, cloud] = await Promise.all([
    loadEncrypted<UserProfile>(PROFILE_KEY),
    pullProfile(userId),
  ]);

  if (!local) return cloud;
  if (!cloud) return local;

  return new Date(local.updatedAt) > new Date(cloud.updatedAt) ? local : cloud;
}

export async function migrateGuestProfileToUser(guest: UserProfile, userId: string, email?: string): Promise<UserProfile> {
  const migrated: UserProfile = {
    ...guest,
    id: userId,
    email,
    isGuest: false,
    updatedAt: new Date().toISOString(),
  };

  await saveProfile(migrated);
  return migrated;
}
