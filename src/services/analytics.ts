export type AnalyticsEvent =
  | 'login_guest'
  | 'login_google'
  | 'workout_logged'
  | 'mission_completed'
  | 'vow_created'
  | 'vow_resolved';

export function trackEvent(event: AnalyticsEvent, payload: Record<string, unknown> = {}): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, payload);
  }
}
