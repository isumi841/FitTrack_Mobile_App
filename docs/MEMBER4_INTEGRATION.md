# Member4 integration

Selectively adapted `member4_progress_motivation` at commit `61893fbc080e32bc13d397d423ad430941202521`.

## Included

- Profile viewing, editing, deletion, avatar upload/removal, and shared avatar/name state.
- Goal creation, viewing, editing, and deletion.
- Workout reminder preferences with create, update, and delete actions.
- Progress overview, period details, and achievements based on the signed-in member's saved workout sessions.
- Progress and Profile tabs, goal/reminder quick actions, and links to existing account, notifications, and session history screens.
- Browser-compatible confirmations and date selection within the existing 430px mobile viewport.

## Integration boundaries

The existing Member1 JWT login, backend connection, workout catalog, session engine, and navigation shell remain the shared implementations. Member4 requests use the verified account ID; the branch's fixed development user header is not used.

The new authenticated `/api/member4` routes use `goals`, `userprofiles`, and `workoutreminders` in the primary database. Workout history uses the existing `/api/member3/workout-sessions` endpoint and `workoutsessions` collection. No duplicate Workout model or workout-history collection is created.

Sample activities and historical chart totals are not used. Progress includes saved completed and ended-early sessions; workout-completion badges count completed sessions. Calories are shown as untracked because the session engine does not calculate them. Session snapshots currently have no workout category, so progress groups those sessions under Uncategorized. Goal records retain Member4's stored `current` value; automatic goal-progress updates from sessions are not implemented by this integration.

## Configuration

Set these privately in `backend/.env`, then restart the backend:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Save a profile before uploading its photo. The other profile features work without Cloudinary. Image uploads accept JPEG, PNG, WebP, HEIC, and HEIF, with a 5 MB limit. New native builds are required to apply image-picker permission configuration.

Reminders currently persist preferences only. Device notification scheduling and delivery are not connected; the screen states this explicitly.

## Verification

- TypeScript and Expo lint checks.
- Existing backend regression tests plus Member4 collection reuse, CRUD, validation, authentication, and account-isolation tests.
- Progress calculations checked against supplied sessions, including empty history.
- Browser checks at 430 × 932 using an isolated in-memory API with real JWT login: profile save and shared state, date picker, goals, reminder preferences, progress, achievements, and existing session history.
- Live Cloudinary uploads and native-device behavior require separate verification after configuration. Browser checks do not write to Atlas.
