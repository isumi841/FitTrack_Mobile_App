# Shared mobile viewport

All routes use one browser content area sized to **430 × 932 CSS pixels**.
It is centered in larger browser windows and contracts to fit smaller windows
without adding horizontal scrolling. At a DevTools viewport of 430 × 932, the
app fills the entire viewport. Native iOS and Android use their actual screen
dimensions and existing safe-area handling.

The root layout applies `MobileViewport` once. Onboarding no longer adds a
second phone bezel or an extra width constraint. Admin breakpoints and sheets
use `useAppViewport`, so a large desktop window still shows the mobile drawer.
Dialogs use `MobileModal` to stay aligned with the same browser content area.
Screen content scrolls independently; the shared viewport does not scale text
or touch targets down to fit.

Browser checks covered login, workout discovery, admin dashboard and exercise
categories at 430 × 932, narrower screens at 375 × 812, and a centered 430 × 932
preview within a 1440 × 1080 desktop window. Admin checks used isolated mocked
API responses; no live accounts were created or changed. Lint and TypeScript
checks passed. Native device walkthroughs were not performed.
