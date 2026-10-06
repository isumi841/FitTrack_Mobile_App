import type { Href } from 'expo-router';
import type { NavigationIconName } from './navigation-icon';

export interface NavigationItem {
  id: string;
  label: string;
  icon: NavigationIconName;
  href: Href;
  matchPaths: readonly string[];
}

// Reuse this branch's workout routes until the team's Home/Profile destinations merge.
export const APP_NAV_ITEMS: readonly NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'home', href: '/', matchPaths: ['/'] },
  { id: 'workouts', label: 'Workouts', icon: 'workouts', href: '/member2/workout', matchPaths: ['/member2', '/workout/details', '/workout/browse', '/workout/instructions', '/workout/video', '/workout/active', '/workout/pause', '/workout/timer'] },
  { id: 'progress', label: 'Progress', icon: 'progress', href: '/workout/sessions', matchPaths: ['/workout/sessions', '/workout/completed'] },
  { id: 'profile', label: 'Profile', icon: 'profile', href: '/workout/notifications', matchPaths: ['/workout/notifications'] },
];

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: NavigationIconName;
  href: Href;
}

export const APP_QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'goal', label: 'Browse sample workouts', description: 'Choose a temporary test routine', icon: 'goal', href: '/workout/browse' },
  { id: 'reminder', label: 'Local notifications', description: 'Read this device’s session notices', icon: 'bell', href: '/workout/notifications' },
  { id: 'progress', label: 'Session history', description: 'Open your saved module test sessions', icon: 'progress', href: '/workout/sessions' },
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
