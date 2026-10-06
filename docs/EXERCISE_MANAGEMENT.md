# Admin exercise instructions management

This is the first stage of the two-CRUD module: admin exercise management and user
workout session management. The leader owns workout creation. Admins manage exercises
belonging to those workouts; users can read their instructions and watch their videos.
Notifications in Profile remain deferred.

## Implemented

- Open Workouts → **Admin login** (development builds), or `/admin-login`.
- Sign in, open **Exercises** in the dashboard sidebar, select a leader workout,
  then add, view, edit or delete exercises.
- An exercise has a name, target (reps/time), order, optional description/coaching cue,
  1–20 instruction steps, and an optional HTTPS video URL.
- Supported video links point directly to `.mp4` or `.m3u8` media. YouTube pages and
  local file uploads are not supported in this stage. Clearing a URL removes the video.
- Preview opens the user-facing instructions/video screens with the same saved data.
- User Workout Details shows the managed lineup. Empty workouts explain that exercises
  have not been added. The original branch's placeholder targets are not automatically
  seeded as managed instructions.
- Deletion requires confirmation. Revisions prevent stale edits/deletes. A failed create
  retains its request key and payload in the open form so retrying cannot duplicate it.
  Navigating away/refreshing discards that draft; check the list after an uncertain result.
- Writes allow 30 seconds for a response. An interrupted create automatically retries
  once with the same request ID and payload; rejected input/credentials are not replayed.
  The editor shows when it is checking an uncertain save. Connection failures, timeouts
  and unreadable responses have separate messages. Admin pages do not display unrelated
  workout-session errors or recovery controls.
- Saved session snapshots are not rewritten by exercise changes.

## Private development setup

The repository has a local user-token adapter, not integrated team authentication.
Admin requests now require a **different** local token. User credentials cannot mutate
exercises, and the admin credential does not grant user-session access.

Generate the admin token in PowerShell without printing it:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | Set-Clipboard
```

Add these entries privately to `backend/.env`, preserving existing settings:

```dotenv
ADMIN_DEV_AUTH=true
ADMIN_DEV_TOKEN=<paste the new token from your clipboard>
```

`NODE_ENV` must be `development` and `MONGODB_URI` must explicitly name `/test`.
Enabling either local identity binds the backend to `127.0.0.1`. Temporary login uses
username `admin` and the private `ADMIN_DEV_TOKEN` value as its password. Login issues
a separate one-hour session token, kept only in frontend memory. Logout revokes that
session; refreshing clears the frontend session. Navigation into a user-facing preview
preserves it. Never put the password in an `EXPO_PUBLIC_*` variable. `.env.example` contains
placeholders; this implementation did not edit `backend/.env`.

From the repository root, use separate terminals:

```powershell
npm.cmd --prefix backend run dev
```

```powershell
npx.cmd expo start --web
```

If the terminal is already in `backend`, run `npm.cmd run dev` without `--prefix backend`.
Use an Expo port allowed by backend `CORS_ORIGINS`. Restart the backend after changing
its environment. Restart Expo as well so it discovers the new admin routes and refreshes
its generated route declarations. Open `/admin-login`, enter username `admin`, and paste
the `ADMIN_DEV_TOKEN` value into **Password**. See the
[dashboard integration notes](ADMIN_DASHBOARD_INTEGRATION.md) for the imported dashboard.

Before production, replace `createDevelopmentAdminAuth` and `developmentAdminIdentity` with the team's verified
authentication plus server-side admin-role authorization. The current adapter refuses
admin access outside development. No team user account or role is created or modified.

## Database and API

The `Exercise` model uses the database-owned Mongoose instance and the explicit
`exercises` collection. Its only index is scoped to workout/deletion/order/creation time.
There is no `member3_` collection prefix. Existing `workoutsessions` records are untouched.
Workouts remain the leader's imported catalog; no workout/user/profile collection is seeded.

Every managed exercise belongs to one immutable `workoutId`. Order is ascending `position`,
then creation time and ID for ties. Deletion hides the record using `deletedAt` rather than
removing its retry identity: this prevents a delayed create request from resurrecting it.
Deleted records remain visible in Atlas but are excluded from user/admin exercise lists.

All paths below are under `/api/member3`:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/login` | Exchange temporary username/password for a one-hour session |
| POST | `/admin/logout` | Revoke the authenticated temporary session |
| GET | `/admin/access` | Verify admin access |
| GET | `/admin/exercises?workoutId=...` | List a workout's managed exercises |
| POST | `/admin/exercises` | Create; requires `workoutId`, `requestId`, and exercise fields |
| GET | `/admin/exercises/:exerciseId` | Read one exercise |
| PATCH | `/admin/exercises/:exerciseId` | Update allowed fields with current `revision` |
| DELETE | `/admin/exercises/:exerciseId` | Delete with current `revision` |
| GET | `/workouts/:workoutId/exercises` | Public guidance: `{workout:{id,name,exercises}}` |

All `/admin` routes except login verify the admin credential server-side. Public guidance excludes
admin identity and retry metadata. Public workout details include the managed lineup and
`guidanceManaged: true` when the exercise repository is installed. Sample routines retain
their existing immutable guidance. Unknown workouts and deleted exercises do not fall back
to an unrelated exercise. Storage failures return an explicit retryable error.

Exercise input fields: `name` (1–100 chars), `target` (1–100), `subtitle` (0–200), `cue`
(0–300), `steps` (1–20 non-empty strings, each up to 500 chars), `video` (null or HTTPS MP4/HLS
URL up to 2048 chars), and `position` (integer 1–9999). Bodies are limited to 16 KB.
Ownership/workout reassignment, protected fields, malformed URLs, and stale revisions
are rejected. Shared frontend types are in `shared/exercise.ts`.

## Manual review

1. Sign in at `/admin-login` and open **Exercises**. A user token used as the password must be rejected.
2. Choose a workout and create an exercise with two instruction steps and no video.
3. Reopen it, edit the instructions/order, and add a working hosted video URL.
4. Preview its instructions and video; check playback and the missing-video state.
5. Visit user Workout Details for that workout and confirm it shows the saved exercise.
   Use **Refresh exercises** if details was already open.
6. Open the same exercise in two tabs; save one and verify the other's stale save is
   rejected with a reload option.
7. Delete after confirmation. Check it disappears from the lineup and its Atlas document
   has `deletedAt`. Existing session snapshots and the parent workout should remain.
8. Stop the backend during a save, restart it, and retry from the open form; check that
   only one record exists for that create request.

## Next stage and verification

The existing session CRUD still runs on the three complete sample plans. The leader's
workouts now have editable/readable guidance but still need a defined repetition/timing
plan before Start can create their sessions. That is the next stage of **Workout Session
Management**; then connect Active Workout/Timer, Pause/Resume and Completed in sequence.

Automated checks use injected in-memory repositories and mocked Mongoose calls, never
the shared Atlas database. Coverage includes admin/user separation, opt-in configuration,
CRUD, public guidance, validation, stable ordering, create retries, stale updates, deletion
retries/tombstones, unchanged saved snapshots, and sanitized storage failures. Browser/device
interaction and real Atlas integration still require the manual review above.

Backend syntax checks and all 48 backend tests passed, including temporary login,
session expiry, logout, and protected exercise requests. Frontend TypeScript passed after
regenerating Expo's route declarations; lint of `src` and `shared` passed with zero warnings.
Interactive browser/device testing of the integrated dashboard remains a manual check.
