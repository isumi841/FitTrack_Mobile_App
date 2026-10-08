# Member 1 authentication integration

Source: `member1_onboarding_personalization`, selectively updated through commit
`0a73dde678459a79170f2a2e605fd2525d2bc976` (Implement Google sign-up authentication flow).
Original integration baseline: `174873a171b142c75d8c3405abb7d8a66d589c7f`.

## October 8 update

Compared only the two new commits (`475ca42`, `0a73dde`) with the original source
baseline. Three-way merges retained local authentication fixes; existing workouts,
exercise management, owner-scoped sessions and dashboard navigation were preserved.
No dependency, environment, database-content or project-ownership changes were needed.

- Google on **Sign Up** retrieves the verified email without creating a social
  account or saving a session. The user then chooses a password and completes
  ordinary email verification. Google on **Log In** retains social login behavior.
  Live Google sign-in still requires the team's OAuth configuration.
- Added the branch's rotating plan images while keeping recommendations linked to
  actual leader workouts. Animation pauses when the plan screen loses focus.
- Imported the larger desktop phone preview and removed its simulated status bar.
- Replaced the dashboard's Users placeholder with search, verification filters,
  refresh, create, edit, roles and confirmed delete, using the existing admin shell.
  API responses consistently expose `id` for editing/deletion. Validation runs on
  the backend; errors and confirmations also work in the web dashboard.
- Settings now supports confirmed logout through the shared session provider.
- **Create administrator** requires an existing signed-in administrator. The
  upstream public admin-signup route was restricted and no automatic login into
  the newly created account is performed. No default passwords are generated.
- Admins in either `admins` or `users` are supported. Stored role/account validity
  is rechecked on protected requests, so deletion/demotion removes existing token
  access. Administrators cannot delete or demote their own account through Users.
- Mounted the new `/api/users` router on the existing server/database connection;
  did not copy the branch's standalone server, DNS overrides or startup seeding.

Backend regression tests cover CRUD validation, stable IDs, protected admin creation,
demotion/deletion, and preview identity without account/session creation. No live
accounts were created or modified to test this update.

## Integration choices

- Imported onboarding/auth screens, required components and missing images. Their
  theme lives in `src/features/member1/theme.ts`, preserving the existing workout
  and admin themes. The shared root retains all existing providers and routes.
- Imported the authentication implementation into `backend/member1` with its own
  CommonJS module scope. The existing ESM backend remains the only running server.
  `backend/member1/server.js` is just the upstream isolated HTTP test harness;
  it does not listen, connect to MongoDB, or load an environment file.
- `/api/auth/*` is mounted alongside existing workout/exercise endpoints on port
  **5001**. The new models are registered on the existing database connection, so
  they use the configured primary database (currently `test`). No users/admins are
  seeded, copied or assigned new roles. Existing collections are reused.
- Only missing dependencies were added. Expo/RN versions, current workout routes,
  exercise editor, session timer, dashboard and leader workout repository remain.
  The branch's standalone server, dependency downgrades, EAS project ownership,
  startup seed and index-dropping migration were not imported.
- Onboarding recommendations now use actual library workouts and their IDs. The
  extra placeholder workout session route redirects to the shared selection screen.

## Sign-in and account separation

Members use email/password → `/api/auth/login` → verified JWT. Signup requires the
branch's four-digit email verification before login. Ordinary signup always creates
a user, never an admin. Existing admin email/password login opens the dashboard;
admin responses include the fields required by the mobile response validator.
The API rechecks the stored account and role when accessing sessions/exercises.

Workout sessions use `user:<MongoDB user ID>` as owner. History, updates and deletes
stay owner-scoped. Frontend workout state, preferences, notices and pending requests
are reset/namespaced per account. Logout pauses and saves an active session first.
The old shared demo records and recovery keys are left intact but are not attributed
to any real user. Demo member controls and temporary admin login are removed.

Web bearer tokens stay in memory; a browser reload requires login. Native tokens
use Expo SecureStore. Expiry clears the active account; each protected request also
verifies token expiry on the backend. Logout clears client access; issued JWTs
expire naturally, following Member 1's stateless session design.

Onboarding preferences are local per account. A pre-signup draft is adopted on
first login when that account has no saved preferences. Theme preference is device-wide.

## Configuration and running

Use the existing `backend/.env` and `.env.local`. Set:

```dotenv
# backend/.env — private
PORT=5001
JWT_SECRET=<private-random-secret-at-least-32-bytes>
JWT_EXPIRY_MINUTES=60
MEMBER3_DEV_AUTH=false
ADMIN_DEV_AUTH=false
EMAIL_MODE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-mail-account>
EMAIL_PASS=<your-mail-provider-app-password>
EMAIL_FROM=<your-sender-address>
```

```dotenv
# .env.local — public API origin only
EXPO_PUBLIC_API_URL=http://localhost:5001
```

A private JWT secret was generated locally during integration; its value was not
printed or committed. Keep your own SMTP details private. Missing SMTP settings do
not block login for existing users, but signup cannot deliver its code until they
are configured. `EMAIL_MODE=development` is the upstream explicit alternative that
prints local verification codes to the backend terminal; it is forbidden in production.

From the repository root, in separate terminals:

```powershell
npm.cmd --prefix backend run dev
npx.cmd expo start --web --clear
```

Stop old instances first. From inside `backend`, use `npm.cmd run dev` without
another `--prefix backend`. Social buttons require the team's provider credentials,
callback URLs and native capabilities; importing their code does not provision
Google/Apple/Facebook services. Email/password login works independently of them.

## Checks and remaining manual checks

Tests include the imported OTP/SMTP/OAuth suites and the existing workout suites.
Integration tests exercise real password/JWT login, separate member histories,
cross-account mutation rejection, role isolation, expired/deleted/unverified accounts,
and rejection of legacy development tokens when real auth is active. Upstream tests
were updated to match the branch's four-digit OTP requirement for all email domains.
Legacy uppercase SLIIT accounts remain readable without a data migration.

Live read-only checks verified health, browser CORS and login lookup on port 5001
using a deliberately nonexistent test email. No real passwords were tested or reset;
no live users or sessions were created. Complete an actual browser login and workout
with your account, then verify SMTP signup once configured. Native/social-provider
walkthroughs and real SMTP delivery have not been performed.
