/**
 * Global Theme Configuration
 * Supports both Light and Dark modes.
 */

import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useRNColorScheme } from 'react-native';

export const Colors = {
  light: {
    text: '#101510',
    background: '#F5F8F4',
    backgroundElement: '#EDF3ED',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#53605A',
    tint: '#6FA313',
    icon: '#53605A',
    tabIconDefault: '#7B8780',
    tabIconSelected: '#6FA313',
  },
  dark: {
    text: '#F5F8F4',
    background: '#080D0B',
    backgroundElement: '#0D1311',
    backgroundSelected: '#18201D',
    textSecondary: '#A2ACA7',
    tint: '#B8F52A',
    icon: '#A2ACA7',
    tabIconDefault: '#707B76',
    tabIconSelected: '#B8F52A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    serif: 'var(--font-serif, serif)',
    rounded: 'var(--font-rounded, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ==========================================
// FITTRACK THEME PALETTES (Light & Dark)
// ==========================================

export const ThemedColors = {
  light: {
    // Exact specifications
    background: '#F5F8F4',
    secondaryBackground: '#EDF3ED',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FBF7',
    primaryGreen: '#6FA313',
    primaryLime: '#6FA313',
    brightLime: '#7CB916',
    secondaryTeal: '#278F7A',
    textPrimary: '#101510',
    textSecondary: '#53605A',
    textMuted: '#7B8780',
    border: 'rgba(20, 40, 30, 0.10)',
    greenDim: 'rgba(111, 163, 19, 0.10)',
    limeBorder: 'rgba(111, 163, 19, 0.45)',
    limeDim: 'rgba(111, 163, 19, 0.10)',
    limeGlow: 'rgba(111, 163, 19, 0.25)',

    // Backwards-compatible aliases
    bg: '#F5F8F4',
    bg2: '#EDF3ED',
    lime: '#6FA313',
    teal: '#278F7A',
    tealDim: 'rgba(39, 143, 122, 0.15)',
    tealDark: '#278F7A',
    textHeading: '#101510',
    textBody: '#101510',
    muted: '#53605A',
    subtle: '#7B8780',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(20, 40, 30, 0.10)',
    elevatedCard: '#F8FBF7',
    greenCard: '#EAF2DD',
    borderHighlight: 'rgba(111, 163, 19, 0.45)',
    white: '#FFFFFF',
    isDark: false,
    scheme: 'light' as const,
  },
  dark: {
    // Exact specifications
    background: '#080D0B',
    secondaryBackground: '#0D1311',
    surface: '#141A18',
    surfaceElevated: '#18201D',
    primaryLime: '#B8F52A',
    brightLime: '#C7FF32',
    secondaryTeal: '#36B89E',
    textPrimary: '#F5F8F4',
    textSecondary: '#A2ACA7',
    textMuted: '#707B76',
    border: 'rgba(255, 255, 255, 0.08)',
    greenDim: 'rgba(184, 245, 42, 0.12)',
    limeBorder: 'rgba(184, 245, 42, 0.55)',
    limeDim: 'rgba(184, 245, 42, 0.12)',
    limeGlow: 'rgba(184, 245, 42, 0.25)',

    // Backwards-compatible aliases
    bg: '#080D0B',
    bg2: '#0D1311',
    lime: '#B8F52A',
    primaryGreen: '#B8F52A',
    teal: '#36B89E',
    tealDim: 'rgba(54, 184, 158, 0.18)',
    tealDark: '#36B89E',
    textHeading: '#F5F8F4',
    textBody: '#F5F8F4',
    muted: '#A2ACA7',
    subtle: '#707B76',
    cardBg: '#141A18',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    elevatedCard: '#18201D',
    greenCard: '#1A2518',
    borderHighlight: 'rgba(184, 245, 42, 0.55)',
    white: '#FFFFFF',
    isDark: true,
    scheme: 'dark' as const,
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeMode = ColorScheme | 'system';
export type ThemePalette = {
  [K in keyof typeof ThemedColors.dark]: (typeof ThemedColors.dark)[K] extends boolean
    ? boolean
    : string;
};
export type ThemeType = ThemePalette;

// ==========================================
// THEME STATE & CONTEXT
// ==========================================

interface ThemeContextValue {
  theme: ThemeType;
  colorScheme: ColorScheme;
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_MODE_STORAGE_KEY = 'fittrack.member1.theme-mode';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

async function getPersistedThemeMode(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(THEME_MODE_STORAGE_KEY) ?? null;
  }

  return SecureStore.getItemAsync(THEME_MODE_STORAGE_KEY);
}

async function persistThemeMode(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(THEME_MODE_STORAGE_KEY, mode);
    return;
  }

  await SecureStore.setItemAsync(THEME_MODE_STORAGE_KEY, mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;

    const restoreThemeMode = async () => {
      try {
        const storedMode = await getPersistedThemeMode();
        if (isMounted && isThemeMode(storedMode)) {
          setThemeModeState(storedMode);
        }
      } catch {
        // Use System mode when a preference cannot be restored.
      }
    };

    void restoreThemeMode();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeScheme: ColorScheme = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void persistThemeMode(mode).catch(() => {
      // The in-memory selection remains active if persistence is unavailable.
    });
  };

  const toggleTheme = () => {
    setThemeMode(activeScheme === 'dark' ? 'light' : 'dark');
  };

  const setColorScheme = (s: ColorScheme) => {
    setThemeMode(s);
  };

  const theme = ThemedColors[activeScheme] as ThemeType;

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        theme,
        colorScheme: activeScheme,
        isDark: activeScheme === 'dark',
        themeMode,
        toggleTheme,
        setColorScheme,
        setThemeMode,
      },
    },
    children
  );
}

export function useTheme(): ThemeType & {
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
} {
  const context = useContext(ThemeContext);
  const systemScheme = useRNColorScheme();

  if (context) {
    return {
      ...context.theme,
      toggleTheme: context.toggleTheme,
      colorScheme: context.colorScheme,
      isDark: context.isDark,
      themeMode: context.themeMode,
      setThemeMode: context.setThemeMode,
      setColorScheme: context.setColorScheme,
    };
  }

  // Fallback if rendered outside ThemeProvider
  const resolved: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const theme = ThemedColors[resolved];
  return {
    ...theme,
    toggleTheme: () => {},
    colorScheme: resolved,
    isDark: resolved === 'dark',
    themeMode: 'system',
    setThemeMode: () => {},
    setColorScheme: () => {},
  };
}
