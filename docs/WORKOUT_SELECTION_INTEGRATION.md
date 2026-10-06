# Workout selection → Workout Details

**Current stage:** [Admin exercise management](EXERCISE_MANAGEMENT.md) now supplies the
editable exercise lineup and user-facing instructions/video. The integration notes below
describe the earlier selection import; live details now prefer managed exercises from
`exercises` instead of the original placeholder targets. Timed sessions are still next.

Imported from `isumi841/FitTrack_Mobile_App`, branch `member2_active_workout`, commit
`a4abe0e622c220dfa8af7b79acc60ccb97b6076f` (Complete Member 2 frontend workout screens).
Only workout selection, categories, filters, results, library, shared UI and catalog
were brought across. No branch merge, commit, push, authentication/profile replacement,
database seeding or environment-secret edits were performed.

## First stage

- `/` and the Workouts tab open `/member2/workout`.
- Recommended, library and filtered-result cards open `/workout/details` with the
  original `workoutId`. “View Quick Workout” opens the recommended routine's details.
- Details load from `GET /api/member3/workouts/:workoutId` and show the selected title,
  description, level, category, equipment, listed duration, low-impact flag and ordered
  exercise targets. Loading, retry and invalid-ID errors remain visible.
- The leader's catalog lives in `shared/discovery`, used by selection and the API.
  The original IDs, category mapping and target text are preserved. For example,
  `beginner-full-body` has eight exercises; it is distinct from the existing five-exercise
  `sample-full-body` test routine.
- Selection uses this branch's dark/lime theme and system fonts. Bookmarks are shared
  across selection and details in memory; refreshing resets them. No mock logged-in user
  from the leader's profile provider is imported.
- The workout provider is mounted at the app root so switching selection/guidance
  layouts preserves the development token, pending saves and current session.
  Leaving active/timer screens pauses the session.

## Catalog contract

`GET /api/member3/workouts` keeps returning the three runnable samples for the testing
screen. `GET /api/member3/workouts?source=leader` returns the imported workout overviews.
Both return `{workouts: [...]}`. Detail lookup supports IDs from either list and returns
`{workout: ...}`; unknown IDs return 404.

Leader overviews contain `id`, `name`, `description`, `level`, `category`, `equipment[]`,
`sample: false`, `sessionReady: false`, `durationSeconds`, `lowImpact`, and
`exercises: [{id, name, target}]`. Their duration is the leader's listed estimate,
not a computed timer total. Generated movement IDs follow the imported order and should
be replaced with canonical exercise IDs when the team defines the full guidance catalog.

The leader's branch supplies targets such as “12 reps”, but no complete interval plan
or written/video guidance. Start is therefore visibly unavailable for those routines;
the API also rejects session creation for them with 409, without writing a record.
It does not convert reps into fabricated timed sets or substitute sample exercises.
The existing complete sample-session contract and `workoutsessions` collection are unchanged.

## Run and review on Windows

From the repository root, start the backend in one terminal:

```powershell
npm.cmd --prefix backend run dev
```

If already inside `backend`, use `npm.cmd run dev` instead.
Start the app in a second terminal from the repository root:

```powershell
npx.cmd expo start --web
```

Use an origin configured in the backend's CORS allowlist (normally localhost:8081 or
localhost:8082). Restart the backend if it was running before these files were imported.
Viewing selection/details does not require a development token. Sample session CRUD
still requires the explicit development control described in `MEMBER3_HANDOFF.md`.

Manual checks:

1. Open the recommended Beginner Full Body card. Check its eight ordered exercises and
   targets, including 12-rep Bodyweight Squats and 1-minute Deep Breathing.
2. Return, open Categories, choose another category, and open a library card. Confirm
   the details change to that workout. Test difficulty/duration filters and an empty search.
3. Bookmark a card, open its details, remove the bookmark, and go back. Confirm both views agree.
4. Visit `/workout/details?workoutId=not-real`; it must show an error, not a default routine.
   Stop the backend to check retry, then restart it and retry.
5. Use the center quick-actions button → Browse sample workouts for existing session
   tests. Start a sample session, leave for Workouts and return via session history;
   verify the session is paused and the development token has not been lost.

## Next screen

Next implement Exercise Instructions for the leader's exercises using reviewed exercise
content and canonical IDs. Then add Video Demonstration (honest missing-video states),
define repetition/timing plans, and connect Active Workout/Timer, Pause/Resume, Completed,
and Notifications one screen at a time. Real authentication remains a separate team integration.

Automated verification uses the injected in-memory backend repository, never the shared
Atlas database. The added contract test checks every imported ID and ordered target,
the separate sample routine, and rejection of incomplete session plans without writes.

Verification for this stage: backend syntax checks and all 32 tests passed; frontend
TypeScript passed after Expo regenerated its route declarations. Expo lint and direct
lint of `src`/`shared` passed, then duplicate-import warnings in the two imported UI files
were fixed and those files passed again with zero warnings. Device/browser interaction
has not been exercised in this pass; use the manual checks above.
