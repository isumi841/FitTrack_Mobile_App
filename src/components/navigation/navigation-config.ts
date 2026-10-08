import type { Href } from 'expo-router';
import type { NavigationIconName } from './navigation-icon';

export interface NavigationItem {
  id: string;
  label: string;
  icon: NavigationIconName;
  href: Href;
  matchPaths: readonly string[];
}

// Shared destinations for the integrated member modules.
export const APP_NAV_ITEMS: readonly NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'home', href: '/', matchPaths: ['/'] },
  { id: 'workouts', label: 'Workouts', icon: 'workouts', href: '/member2/workout', matchPaths: ['/member2', '/workout/details', '/workout/browse', '/workout/instructions', '/workout/video', '/workout/active', '/workout/pause', '/workout/timer'] },
  { id: 'progress', label: 'Progress', icon: 'progress', href: '/member4/progress', matchPaths: ['/member4/progress', '/member4/progress-details', '/member4/achievements', '/member4/goals', '/member4/workout-history', '/workout/sessions', '/workout/completed'] },
  { id: 'profile', label: 'Profile', icon: 'profile', href: '/member4/profile', matchPaths: ['/member4/profile', '/member4/edit-profile', '/member4/workout-reminder', '/workout/account', '/workout/notifications'] },
];

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: NavigationIconName;
  href: Href;
}

export const APP_QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'goal', label: 'Set a goal', description: 'Choose your next fitness target', icon: 'goal', href: '/member4/goals?create=1' },
  { id: 'reminder', label: 'Local notifications', description: 'Read this device’s session notices', icon: 'bell', href: '/workout/notifications' },
  { id: 'progress', label: 'Session history', description: 'Review your saved workout sessions', icon: 'progress', href: '/workout/sessions' },
];

/** Longest segment match keeps child routes in the correct tab. */
export function getActiveNavigationId(pathname: string): string | undefined {
  let activeId: string | undefined;
  let longestMatch = -1;
  for (const item of APP_NAV_ITEMS) {
    for (const path of item.matchPaths) {
      if ((pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))) && path.length > longestMatch) {
        activeId = item.id;
        longestMatch = path.length;
      }
    }
  }
  return activeId;
}
