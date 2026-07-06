import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const KEY_NAME = 'jjfit_encryption_key_v1';

async function createSecureKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;

  const generated = await createSecureKey();
  await SecureStore.setItemAsync(KEY_NAME, generated);
  return generated;
}

function wrapPayload(json: string): string {
  const checksum = CryptoJS.SHA256(json).toString(CryptoJS.enc.Hex);
  return JSON.stringify({ checksum, json });
}

function unwrapPayload(raw: string): string {
  const payload = JSON.parse(raw) as { checksum: string; json: string };
  const computed = CryptoJS.SHA256(payload.json).toString(CryptoJS.enc.Hex);
  if (computed !== payload.checksum) {
    throw new Error('Anti-cheat checksum mismatch.');
  }
  return payload.json;
}

export async function saveEncrypted<T>(key: string, value: T): Promise<void> {
  const secret = await getOrCreateKey();
  const wrapped = wrapPayload(JSON.stringify(value));
  const encrypted = CryptoJS.AES.encrypt(wrapped, secret).toString();
  await AsyncStorage.setItem(key, encrypted);
}

export async function loadEncrypted<T>(key: string): Promise<T | null> {
  const encrypted = await AsyncStorage.getItem(key);
  if (!encrypted) return null;

  const secret = await getOrCreateKey();
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    const json = unwrapPayload(decrypted);
    return JSON.parse(json) as T;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}
