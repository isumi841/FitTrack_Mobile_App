/**
 * Member 4 – Progress & Motivation feature colors.
 * Next-level dark fitness app design inspired by the reference UI.
 * Do NOT import or merge these into the global theme.ts.
 */

export const M4Colors = {
  dark: {
    // Backgrounds – deep dark like the reference image
    bg: '#0D1117',
    bg2: '#111820',
    surface: 'rgba(255,255,255,0.05)',
    cardBg: '#161C26',
    cardBdr: 'rgba(255,255,255,0.08)',

    // Borders
    border: 'rgba(255,255,255,0.07)',
    borderH: 'rgba(198,241,53,0.5)',

    // Lime-green accent (matching reference image: #C6F135 / neon-green)
    teal: '#C6F135',
    tealDim: 'rgba(198,241,53,0.15)',
    tealGlow: 'rgba(198,241,53,0.35)',

    // Text
    text: '#F0F4FF',
    muted: 'rgba(240,244,255,0.55)',
    subtle: 'rgba(240,244,255,0.30)',

    // Status
    success: '#C6F135',
    warning: '#FFB347',
    danger: '#FF5757',

    // UI helpers
    overlay: 'rgba(0,0,0,0.80)',
    ripple: 'rgba(198,241,53,0.12)',

    // Extra gradient stops
    gradStart: '#1A2535',
    gradEnd: '#0D1117',
  },

  light: {
    // Light mode – keep clean
    bg: '#F5F7FA',
    bg2: '#EAEFF5',
    surface: 'rgba(255,255,255,0.9)',
    cardBg: '#FFFFFF',
    cardBdr: 'rgba(198,241,53,0.25)',

    border: 'rgba(198,241,53,0.2)',
    borderH: 'rgba(100,170,0,0.55)',

    teal: '#5A9A00',
    tealDim: 'rgba(198,241,53,0.15)',
    tealGlow: 'rgba(198,241,53,0.25)',

    text: '#0D1117',
    muted: '#3D5060',
    subtle: '#6A8090',

    success: '#5A9A00',
    warning: '#E08A00',
    danger: '#CC3D3D',

    overlay: 'rgba(0,0,0,0.55)',
    ripple: 'rgba(90,154,0,0.10)',

    gradStart: '#E8EFF5',
    gradEnd: '#F5F7FA',
  },
} as const;

export type M4ColorScheme = typeof M4Colors.dark;
export type M4Theme = 'dark' | 'light';
