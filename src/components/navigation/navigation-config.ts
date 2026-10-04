import type { Href } from 'expo-router';
import type { NavigationIconName } from './navigation-icon';

export interface NavigationItem {
  id: string;
  label: string;
  icon: NavigationIconName;
  href: Href;
  matchPaths: readonly string[];
}

// Only link to routes in this branch. Replace these when the team's features merge.
export const APP_NAV_ITEMS: readonly NavigationItem[] = [
  { id: 'workouts', label: 'Workouts', icon: 'workouts', href: '/workout/details', matchPaths: ['/', '/workout'] },
  { id: 'guide', label: 'Guide', icon: 'guide', href: '/workout/instructions', matchPaths: ['/workout/instructions', '/workout/video'] },
  { id: 'timer', label: 'Timer', icon: 'timer', href: '/workout/timer', matchPaths: ['/workout/timer'] },
  { id: 'inbox', label: 'Inbox', icon: 'bell', href: '/workout/notifications', matchPaths: ['/workout/notifications'] },
];

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: NavigationIconName;
  href: Href;
}

export const APP_QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'workout', label: 'Your workout', description: 'Start fresh or return to your session', icon: 'workouts', href: '/workout/details' },
  { id: 'timer', label: 'Workout timer', description: 'View your session or set your next intervals', icon: 'timer', href: '/workout/timer' },
  { id: 'summary', label: 'Latest session', description: 'Review your activity and session notes', icon: 'progress', href: '/workout/completed' },
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
