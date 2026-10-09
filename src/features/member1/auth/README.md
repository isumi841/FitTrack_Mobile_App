# Member 1 authentication and onboarding

The imported screens remain under `src/app/member1_onboarding_personalization/`, with admin screens under `src/app/admin/`. Components, theme, authentication helpers and onboarding storage live under `src/features/member1/`. Images are isolated in `assets/images/member1/`.

The existing startup animation leads to the new welcome screen. Onboarding and login lead to the personalized plan. Its navigation opens the existing Member 4 workout history, progress and profile screens. The existing Home navigation returns to the personalized plan. The Member 1 theme is scoped to Member 1/admin and does not change Member 4 appearance.

Both feature clients use `src/config/api.ts`. The default API origin is `http://localhost:5001`, matching the original Member 4 client. Set `EXPO_PUBLIC_API_URL` in the project root `.env.local` to the shared backend origin (without `/api/auth` or `/api/member4`). For a physical device, use your computer's reachable LAN address and configured backend port. Reload Expo after changing the value.

Native sessions and onboarding preferences use Expo SecureStore. Web sessions stay in memory; onboarding and theme preferences use browser localStorage. Failed login attempts display the server error and remain on the login screen. The ZIP's testing-only login bypass was removed at the integration boundary.

The current server setup and required new credentials are described in `backend/src/modules/member1/README.md` and `backend/.env.member1.example`. Social sign-in requires a configured development build and provider credentials. Native bundle/package identifiers can be supplied through the imported `app.config.ts`; the existing app name, scheme, icon and splash branding are retained.

The supplied workout-session screen remains a placeholder. Full workout playback and unrelated CRUD changes were outside this merge request.
