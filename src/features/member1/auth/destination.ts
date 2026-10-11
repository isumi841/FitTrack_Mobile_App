export const HOME_ROUTE = '/member2/workout';
export const WELCOME_PLAN_ROUTE = '/member1_onboarding_personalization/personalized-plan';

export function authDestination(result: { user: { role?: string }; firstLogin?: boolean }) {
  if (result.user.role === 'admin') return '/admin';
  return result.firstLogin === true ? WELCOME_PLAN_ROUTE : HOME_ROUTE;
}
