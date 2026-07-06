import { describe, expect, it } from 'vitest';
import { applyDomainMultiplier, calculateCursedEnergy, createBindingVow, gradeForXp } from './gameLogic';

describe('gameLogic', () => {
  it('converts workouts into cursed energy', () => {
    const energy = calculateCursedEnergy(60, 10, 8);
    expect(energy).toBeGreaterThan(0);
  });

  it('promotes grade by XP', () => {
    expect(gradeForXp(0)).toBe('Grado 4');
    expect(gradeForXp(5000)).toBe('Grado 1');
    expect(gradeForXp(13000)).toBe('Grado Especial');
  });

  it('applies domain bonus only while active', () => {
    const now = '2026-01-01T10:00:00.000Z';
    const activeUntil = '2026-01-02T10:00:00.000Z';
    const expiredUntil = '2025-12-30T10:00:00.000Z';

    expect(applyDomainMultiplier(100, activeUntil, now)).toBe(150);
    expect(applyDomainMultiplier(100, expiredUntil, now)).toBe(100);
  });

  it('creates vows with future deadlines', () => {
    const vow = createBindingVow('2026-06-30T12:00:00.000Z', 'Test vow', 1000);
    expect(vow.targetEnergy).toBe(1000);
    expect(new Date(vow.deadlineISO).getTime()).toBeGreaterThan(new Date('2026-06-30T12:00:00.000Z').getTime());
  });
});
