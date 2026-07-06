# Jujutsu-Fit MVP

Jujutsu-Fit is a **Fitness RPG** inspired by Jujutsu aesthetics where workouts become cursed energy, daily missions become curses, and progression follows sorcerer grades.

## MVP features implemented

- Google Sign-In flow (Expo Auth Session + Firebase credential exchange) with fallback to guest mode.
- Guest profile creation and local profile migration when a Google user signs in.
- Encrypted local save with AES + checksum validation to reduce simple stat tampering.
- Optional Firebase profile sync (Firestore) when runtime config is available.
- Workout logger (exercise, weight, reps, RPE) that converts training into cursed energy.
- Progression systems:
  - Sorcerer grade progression by XP
  - Domain expansion streak bonus (x1.5 for 2 days)
  - Daily missions with rewards
  - Weekend boss HP depletion from cumulative energy
  - Binding vows with success/failure XP outcomes
- Routine creator and progressive-overload summary (average volume by exercise).
- Rest timer with gym-friendly quick actions.
- Basic analytics hooks for key gameplay events.
- Smoke tests for core game logic.

## Stack

- Expo + React Native + TypeScript
- Firebase (Auth + Firestore, optional)
- AsyncStorage + SecureStore + CryptoJS
- Vitest for logic tests

## Run locally

```bash
npm install
npm run typecheck
npm run test
npm run start
```

## Optional cloud/auth configuration

Set these environment variables before running Expo to enable Firebase + Google sign-in:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Without these variables, the app still works in guest mode with encrypted local saves.

## Project structure

- `/App.tsx` → main UI flow and game loop wiring
- `/src/domain` → RPG progression formulas and gameplay rules
- `/src/services` → encrypted storage, profile repository, Firebase integration, analytics
- `/src/types` → canonical data model types
- `/src/config` → runtime config access
