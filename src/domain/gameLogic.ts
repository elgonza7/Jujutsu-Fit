import { BindingVow, DailyMission, SorcererGrade, UserProfile, WeekendBoss } from '../types/models';

const GRADE_THRESHOLDS: Array<{ grade: SorcererGrade; minXp: number }> = [
  { grade: 'Grado Especial', minXp: 12000 },
  { grade: 'Semi Especial', minXp: 8000 },
  { grade: 'Grado 1', minXp: 4500 },
  { grade: 'Grado 2', minXp: 2200 },
  { grade: 'Grado 3', minXp: 800 },
  { grade: 'Grado 4', minXp: 0 },
];

export const DOMAIN_STREAK_DAYS = 5;
export const DOMAIN_DURATION_DAYS = 2;
export const DOMAIN_MULTIPLIER = 1.5;

export function calculateCursedEnergy(weightKg: number, reps: number, rpe: number): number {
  const normalizedRpe = Math.max(1, Math.min(10, rpe));
  const raw = (weightKg * reps * (normalizedRpe / 5)) + reps * 2;
  return Math.max(5, Math.round(raw));
}

export function gradeForXp(xp: number): SorcererGrade {
  return GRADE_THRESHOLDS.find((entry) => xp >= entry.minXp)?.grade ?? 'Grado 4';
}

export function isSameDay(aISO: string, bISO: string): boolean {
  return aISO.slice(0, 10) === bISO.slice(0, 10);
}

function dayDiff(previousISO: string, currentISO: string): number {
  const previous = new Date(previousISO);
  const current = new Date(currentISO);
  previous.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  return Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
}

export function applyDomainMultiplier(baseEnergy: number, domainUntil?: string, nowISO = new Date().toISOString()): number {
  if (!domainUntil) return baseEnergy;
  return new Date(domainUntil) >= new Date(nowISO)
    ? Math.round(baseEnergy * DOMAIN_MULTIPLIER)
    : baseEnergy;
}

export function updateStreak(lastWorkoutISO: string | undefined, currentISO: string): number {
  if (!lastWorkoutISO) return 1;
  const diff = dayDiff(lastWorkoutISO, currentISO);
  if (diff === 0) return 0;
  if (diff === 1) return 1;
  return -1;
}

export function calculateMissionsForToday(todayISO: string): DailyMission[] {
  const seed = Number(todayISO.slice(8, 10));
  return [
    {
      id: `daily-energy-${todayISO.slice(0, 10)}`,
      title: 'Maldición Menor: Energía Maldita',
      description: 'Acumula Energía Maldita entrenando hoy.',
      targetValue: 600 + seed * 5,
      currentValue: 0,
      rewardXp: 220,
      completed: false,
    },
    {
      id: `daily-reps-${todayISO.slice(0, 10)}`,
      title: 'Maldición Menor: Resistencia',
      description: 'Completa repeticiones totales en tus combates.',
      targetValue: 50 + seed,
      currentValue: 0,
      rewardXp: 180,
      completed: false,
    },
  ];
}

export function defaultWeekendBoss(todayISO: string): WeekendBoss {
  return {
    id: `boss-${todayISO.slice(0, 10)}`,
    name: 'Maldición de Categoría Especial',
    maxHp: 4500,
    hp: 4500,
    escaped: false,
  };
}

export function resolveMissions(profile: UserProfile): { xpGain: number; currencyGain: number; missions: DailyMission[] } {
  let xpGain = 0;
  let currencyGain = 0;

  const missions = profile.missions.map((mission) => {
    if (mission.completed) return mission;
    if (mission.currentValue >= mission.targetValue) {
      xpGain += mission.rewardXp;
      currencyGain += Math.round(mission.rewardXp / 4);
      return { ...mission, completed: true };
    }
    return mission;
  });

  return { xpGain, currencyGain, missions };
}

export function createBindingVow(todayISO: string, promise: string, targetEnergy: number): BindingVow {
  const deadline = new Date(todayISO);
  const day = deadline.getDay();
  const daysUntilSunday = (7 - day) % 7 || 7;
  deadline.setDate(deadline.getDate() + daysUntilSunday);
  deadline.setHours(23, 59, 59, 999);

  return {
    id: `vow-${Date.now()}`,
    promise,
    targetEnergy,
    deadlineISO: deadline.toISOString(),
    fulfilled: null,
  };
}

export function settleBindingVow(profile: UserProfile, todayISO: string): { xpDelta: number; fulfilled: boolean } | null {
  const vow = profile.bindingVow;
  if (!vow || vow.fulfilled !== null) return null;

  if (new Date(todayISO) < new Date(vow.deadlineISO)) return null;

  const weeklyEnergy = profile.workouts
    .filter((workout) => workout.createdAt.slice(0, 10) >= shiftDate(todayISO, -7))
    .reduce((acc, workout) => acc + workout.cursedEnergy, 0);

  if (weeklyEnergy >= vow.targetEnergy) {
    return { xpDelta: 750, fulfilled: true };
  }

  return { xpDelta: -300, fulfilled: false };
}

function shiftDate(baseISO: string, days: number): string {
  const date = new Date(baseISO);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function averageVolumeByExercise(profile: UserProfile): Record<string, number> {
  const byExercise = new Map<string, { total: number; entries: number }>();
  for (const workout of profile.workouts) {
    const current = byExercise.get(workout.exercise) ?? { total: 0, entries: 0 };
    byExercise.set(workout.exercise, {
      total: current.total + workout.volume,
      entries: current.entries + 1,
    });
  }

  return Array.from(byExercise.entries()).reduce<Record<string, number>>((acc, [exercise, value]) => {
    acc[exercise] = Math.round(value.total / value.entries);
    return acc;
  }, {});
}
