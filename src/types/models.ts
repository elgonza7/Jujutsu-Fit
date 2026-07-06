export type SorcererGrade = 'Grado 4' | 'Grado 3' | 'Grado 2' | 'Grado 1' | 'Semi Especial' | 'Grado Especial';

export type FocusArea = 'Tren Superior' | 'Tren Inferior' | 'Core' | 'Cardio';

export interface RoutineExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
}

export interface Routine {
  id: string;
  name: string;
  focus: FocusArea;
  exercises: RoutineExercise[];
}

export interface WorkoutEntry {
  id: string;
  createdAt: string;
  exercise: string;
  weightKg: number;
  reps: number;
  rpe: number;
  cursedEnergy: number;
  volume: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  rewardXp: number;
  completed: boolean;
}

export interface WeekendBoss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  escaped: boolean;
}

export interface BindingVow {
  id: string;
  promise: string;
  targetEnergy: number;
  deadlineISO: string;
  fulfilled: boolean | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
  xp: number;
  cursedEnergy: number;
  grade: SorcererGrade;
  streakDays: number;
  lastWorkoutDate?: string;
  domainUntil?: string;
  currency: number;
  routines: Routine[];
  workouts: WorkoutEntry[];
  missions: DailyMission[];
  weekendBoss: WeekendBoss;
  bindingVow?: BindingVow;
}

export interface FirebaseRuntimeConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  androidClientId?: string;
  iosClientId?: string;
  expoClientId?: string;
  webClientId?: string;
}
