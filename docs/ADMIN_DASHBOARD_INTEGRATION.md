# Admin dashboard integration

The dashboard was selectively imported from `origin/admin_dashboard_new`, commit
`2038248cf9d32037bd9cd12ed4e0afb3cc65eb00`. This keeps the existing workout/session
implementation while adopting the team's dashboard, header, desktop sidebar, mobile
drawer, stat cards, and theme. No new dependency is needed.

## Open the dashboard

Log in through the mobile app with an existing admin email/password account. The
shared Member 1 authentication service supplies the verified admin session. Select
**Exercises** in the sidebar, then choose a category and workout.

The temporary username/token login has been replaced. See
[authentication integration](MEMBER1_AUTH_INTEGRATION.md) for configuration, account
isolation and running the shared backend. Ordinary member accounts cannot access
admin exercise endpoints. Existing admin accounts are read from the team's database;
this integration does not create accounts or promote users.

## Connected and placeholder sections

- **Exercises** uses the existing saved exercise CRUD, workout chooser, editor,
  instruction editor, and video links. Workout and exercise cards use responsive grids;
  each exercise card has only Edit. The dashboard sidebar remains present
  throughout the admin exercise routes.
- **Dashboard** preserves the branch's sample statistics, chart, and activity feed.
  Its subtitle explicitly identifies these as sample data.
- **User Management**, **Workouts**, **Goals & Progress**, and **Settings** retain
  the branch's placeholder pages. This integration does not implement those members'
  backend features. Workout selection for exercises now reads the leader's saved
  workouts; see [workout backend integration](WORKOUT_BACKEND_INTEGRATION.md).

## Verification

Backend syntax checks, all 55 backend tests, frontend TypeScript, and lint pass.
Auth tests cover credential rejection, disabled environments, role separation, expiry,
individual-session revocation, rate limiting, and authenticated exercise creation/read
followed by denial after logout. Automated exercise tests use isolated repositories,
not shared Atlas writes.

A live check against the running local backend also passed: login, access verification,
and exercise listing returned 200; logout returned 204; reusing the revoked session
returned 403. This check created no exercise records and printed no credentials.

Manual browser/device review remains necessary: sign in from Workouts, open Exercises,
create/edit/delete an exercise, view its guidance from user Workout Details,
return to the dashboard, and log out. Check
desktop sidebar and narrow-screen drawer navigation. Directly opening an admin route
without a session should return to login. Overview figures should remain labeled as
sample data.
