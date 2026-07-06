import { calculateMissionsForToday, defaultWeekendBoss, gradeForXp } from './gameLogic';
import { UserProfile } from '../types/models';

export function createStarterProfile(name: string, id: string, isGuest: boolean, email?: string): UserProfile {
  const now = new Date().toISOString();

  return {
    id,
    name,
    email,
    isGuest,
    createdAt: now,
    updatedAt: now,
    xp: 0,
    cursedEnergy: 0,
    grade: gradeForXp(0),
    streakDays: 0,
    currency: 0,
    routines: [],
    workouts: [],
    missions: calculateMissionsForToday(now),
    weekendBoss: defaultWeekendBoss(now),
  };
}
