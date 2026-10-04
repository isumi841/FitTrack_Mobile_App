import type { Href } from 'expo-router';

import type { NavigationIconName } from './navigation-icon';

export interface NavigationItem {
  id: string;
  label: string;
  icon: NavigationIconName;
  href: Href;
  /** Include detail routes that should keep this item selected. */
  matchPaths: readonly string[];
}

/** Shared by all four members. Replace destinations here as feature routes are merged. */
export const APP_NAV_ITEMS: readonly NavigationItem[] = [
  { id: 'home', label: 'Home', icon: 'home', href: '/', matchPaths: ['/'] },
  {
    id: 'workouts', label: 'Workouts', icon: 'workouts',
    href: '/member4/workout-history', matchPaths: ['/member4/workout-history'],
  },
  {
    id: 'progress', label: 'Progress', icon: 'progress', href: '/member4/progress',
    matchPaths: [
      '/member4', '/member4/progress', '/member4/progress-details',
    ],
  },
  {
    id: 'profile', label: 'Profile', icon: 'profile',
    href: '/member4/profile',
    matchPaths: [
      '/member4/profile', '/member4/edit-profile', '/member4/goals',
      '/member4/achievements', '/member4/workout-reminder',
    ],
  },
];

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: NavigationIconName;
  href: Href;
}

export const APP_QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'goal', label: 'Set a new goal', description: 'Give your next milestone a target',
    icon: 'goal', href: { pathname: '/member4/goals', params: { create: '1' } },
  },
  {
    id: 'reminder', label: 'Plan a reminder', description: 'Make time for your next workout',
    icon: 'reminder', href: '/member4/workout-reminder',
  },
  {
    id: 'progress', label: 'Check your progress', description: 'See how far you have come',
    icon: 'progress', href: '/member4/progress-details',
  },
];

/** Longest segment match wins, so a member's parent route cannot steal a sibling tab. */
export function getActiveNavigationId(pathname: string): string | undefined {
  let activeId: string | undefined;
  let longestMatch = -1;
  for (const item of APP_NAV_ITEMS) {
    for (const path of item.matchPaths) {
      if ((pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))) &&
          path.length > longestMatch) {
        activeId = item.id;
        longestMatch = path.length;
      }
    }
  }
  return activeId;
}
