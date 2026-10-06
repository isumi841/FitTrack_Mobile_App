# Admin dashboard integration

The dashboard was selectively imported from `origin/admin_dashboard_new`, commit
`2038248cf9d32037bd9cd12ed4e0afb3cc65eb00`. This keeps the existing workout/session
implementation while adopting the team's dashboard, header, desktop sidebar, mobile
drawer, stat cards, and theme. No new dependency is needed.

## Open the dashboard

1. Keep `ADMIN_DEV_AUTH=true`, a private `ADMIN_DEV_TOKEN`, and `NODE_ENV=development`
   in `backend/.env`. The development adapter requires the explicitly named `test`
   database. Keep the admin token different from the user development token.
2. From the repository root, start the backend with `npm.cmd --prefix backend run dev`
   and Expo in another terminal with `npx.cmd expo start --web`. Restart existing
   processes to pick up the new routes. If already inside `backend`, use
   `npm.cmd run dev`.
3. Open Workouts and select **Admin login**. Username: `admin`. Password: only the
   value after `ADMIN_DEV_TOKEN=` in your private `backend/.env`.
4. Select **Exercises** in the sidebar (or mobile menu), select a workout, and manage
   its exercises, instruction steps, and optional video.

This temporary setup is for the local development browser. The development backend
binds to `127.0.0.1`; a physical phone cannot reach the computer through its own localhost.
The UI supports narrow screens, but remote/device authentication needs the team's
proper authentication integration.

## Session behavior

`POST /api/member3/admin/login` validates the credentials on the backend and issues
a random one-hour session token. Login allows ten attempts per minute and up to 64
active sessions per backend process. The frontend stores the issued token only in
memory; it is not embedded in the bundle or persisted to browser/device storage.

The session survives navigation into user-facing instruction/video previews. Refreshing
the app requires login again. Logout clears local access immediately and revokes the
session on the server when reachable; offline sessions expire automatically. Restarting
the backend invalidates its issued sessions. Every protected API request checks admin
access independently of the UI. Existing private bearer-token API access is retained;
logging out an issued session does not rotate that configured development credential.

No team user account, password, or role is created or changed. Before production,
replace `backend/src/admin-auth.js` and the development identity adapter with the
teammate's verified login and server-side admin-role check. The temporary login is
disabled outside development.

## Connected and placeholder sections

- **Exercises** uses the existing saved exercise CRUD, workout chooser, editor,
  instruction preview, and video preview. The dashboard sidebar remains present
  throughout the admin exercise routes.
- **Dashboard** preserves the branch's sample statistics, chart, and activity feed.
  Its subtitle explicitly identifies these as sample data.
- **User Management**, **Workouts**, **Goals & Progress**, and **Settings** retain
  the branch's placeholder pages. This integration does not implement those members'
  backend features. Workout selection for exercises uses the imported leader catalog.

## Verification

Backend syntax checks, all 48 backend tests, frontend TypeScript, and lint pass.
Auth tests cover credential rejection, disabled environments, role separation, expiry,
individual-session revocation, rate limiting, and authenticated exercise creation/read
followed by denial after logout. Automated exercise tests use isolated repositories,
not shared Atlas writes.

A live check against the running local backend also passed: login, access verification,
and exercise listing returned 200; logout returned 204; reusing the revoked session
returned 403. This check created no exercise records and printed no credentials.

Manual browser/device review remains necessary: sign in from Workouts, open Exercises,
create/edit/preview/delete an exercise, return to the dashboard, and log out. Check
desktop sidebar and narrow-screen drawer navigation. Directly opening an admin route
without a session should return to login. Overview figures should remain labeled as
sample data.
