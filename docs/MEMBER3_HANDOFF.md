# Member 3 implementation and team handoff

**Update:** [Admin exercise management](EXERCISE_MANAGEMENT.md) adds a separate CRUD in
the `exercises` collection and a separate development admin credential. The session-only
storage description below applies to workout sessions; exercise management also writes
its own collection. Leader-workout timing integration is the next stage.

This branch now previews the leader's `/member2/workout` selection and API-loaded Workout Details. See [selection integration](WORKOUT_SELECTION_INTEGRATION.md) for that first stage and its remaining guidance/timing work. `/workout/browse` remains a testing route with three explicitly labelled sample workouts, API-loaded guidance, a shared active/timer view, pause/resume/skip/end, saved summaries with editable notes and confirmed deletion, and `/workout/sessions` for history and recovery.

The backend uses the existing Express 5 app and the existing connected Mongoose 9 instance. Only `test.workoutsessions` is written, using the `WorkoutSession` model and an explicit collection name without a member prefix. The catalog is code in `backend/src/catalog.js`; it is never seeded into MongoDB. No users, userprofiles, goals, emailverifications, workoutreminders, or team workout collections are read or changed by this module. The only added index is `{ownerId: 1, startedAt: -1}` on the session collection (in addition to MongoDB's `_id` index). Health checks, connection options and graceful shutdown are preserved.

Restart the backend after changing the collection name. Any collection created under the previous name remains in Atlas; existing documents are not automatically moved or deleted. All session CRUD and index initialization now target `workoutsessions`.

## Windows PowerShell setup

Use Node 24. The installed app uses Expo SDK 57, React Native 0.86 and npm (`package-lock.json`, no Bun lock). No dependencies were added. These commands work even when PowerShell blocks `npm.ps1`/`npx.ps1`:

```powershell
Set-Location C:\Users\minid\Documents\FitTrack_Mobile_App
npm.cmd ci
npm.cmd --prefix backend ci
if (-not (Test-Path -LiteralPath backend\.env)) {
    Copy-Item -LiteralPath backend\.env.example -Destination backend\.env
}
# Generate a private token into the clipboard without printing it in the terminal.
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | Set-Clipboard
notepad.exe backend\.env
```

Keep every existing backend environment entry. Privately add/set:

```dotenv
NODE_ENV=development
PORT=5001
MEMBER3_DEV_AUTH=true
MEMBER3_DEV_TOKEN=<paste the generated 64-character hex token here>
```

Keep the existing valid `MONGODB_URI`, explicitly naming `/test`. Preserve its other options. `CORS_ORIGINS` must include the exact Expo origin, normally `http://localhost:8081,http://localhost:8082`. Never put the MongoDB URI or token in `EXPO_PUBLIC_*`. `backend/.env` was not edited by this implementation. The placeholder in `.env.example` is intentionally unusable as a credential. Clear the clipboard after pasting the token into the backend and development UI if desired.

The root `.env.local` has already been configured with the following API address, preserving any other entries:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5001
```

If your old backend is still running on port 5001, stop it with Ctrl+C in its own terminal, then restart it to load the new code and settings. Do not start two backends on that port.

Terminal 1:

```powershell
Set-Location C:\Users\minid\Documents\FitTrack_Mobile_App
npm.cmd --prefix backend run dev
```

Terminal 2:

```powershell
Set-Location C:\Users\minid\Documents\FitTrack_Mobile_App
Invoke-RestMethod -Uri http://localhost:5001/api/health
npx.cmd expo start --web --port 8081
```

Open `http://localhost:8081`. Enter the same private token in **Local development identity**, then press **Use token**. The token is kept only in React memory: it is not written to AsyncStorage, the recovery journal, source code or public environment variables. Re-enter it after refresh.

## Identity boundary

No working team authentication exists in this repository. `backend/src/identity.js` implements an explicit local testing adapter. It requires both `NODE_ENV=development` and `MEMBER3_DEV_AUTH=true`, validates the configured token format at startup, binds the HTTP server to `127.0.0.1`, and resolves the bearer token to the fixed string `member3:local-development-only`. That string does not represent or create a team user. There is no user collection lookup. Missing/incorrect bearer tokens return 401. Enabling this adapter under production or test environments is rejected before connecting. With the adapter disabled, session endpoints reject access; the catalog and health endpoint remain available.

This setup intentionally supports local web testing. It is not production authentication and cannot be reached from a physical phone over the LAN. For team integration, replace the identity middleware with verified team access-token/session middleware that sets `req.ownerId` from the verified principal. Initialize/inject `createSessionRepository()` for that authentication path as well; currently lifecycle initialization is gated by the development opt-in. Replace the frontend token control with the team's authenticated API client. Do not reuse the development owner or migrate these test records into real user history automatically.

## Workout contract for the leader

Navigate using:

```tsx
router.push({ pathname: '/workout/details', params: { workoutId: selectedWorkout.id } });
```

Missing or unknown IDs produce an error. Details never silently select the first workout. The temporary `browse.tsx` screen can be removed once the leader supplies selection. Update `src/app/index.tsx` and temporary navigation destinations on integration.

`GET /api/member3/workouts` returns `{ workouts: Workout[] }`.
`GET /api/member3/workouts/:workoutId` returns `{ workout: Workout }`, or 404.

```ts
type Workout = {
  id: string; name: string; description: string; level: string;
  equipment: string[]; sample: boolean;
  rounds: number; workSeconds: number; restSeconds: number;
  durationSeconds: number;
  exercises: {
    id: string; name: string; subtitle: string; cue: string;
    steps: string[]; video: string | null;
  }[];
};
```

The fixtures are:

| workoutId | Exercises | Rounds | Work/rest | Default duration |
| --- | ---: | ---: | --- | ---: |
| `sample-gentle-start` | 2 | 1 | 20s / 10s | 60s |
| `sample-chair-strength` | 3 | 2 | 30s / 15s | 270s |
| `sample-full-body` | 5 | 3 | 40s / 20s | 900s |

Exercise IDs are `march`, `wall-push-ups`, `chair`, `side-steps`, `calf-raises`. All sample videos are null; the UI honestly shows unavailable and retains written instructions. For real videos supply licensed direct HTTPS media URLs supported by expo-video, not YouTube page URLs. Every round runs the ordered exercise list; each exercise has work then recovery, including final recovery. Total work sets = exercises.length × rounds, total intervals = total work sets × 2, and duration = sets × (workSeconds + restSeconds). A session copies the chosen plan and actual timer settings at creation. Existing sessions continue to use their snapshot if the live catalog later changes.

Replace `findWorkout`/`workouts` with the team's real catalog adapter at the same server boundary. Validate real data there (nonempty ordered exercises, stable unique IDs, positive integral rounds, valid timing and safe video URLs). No automatic seeding or import exists.

Guidance links carry `exercise` and either `workoutId` or `sessionId`. A session link loads its saved snapshot. Unknown exercise IDs are errors rather than a first-exercise fallback.

## Session API

All paths below are under `/api/member3` and require `Authorization: Bearer <token>`. Errors are `{ error: string }`, with no database-driver details. Bodies are limited to 16 KiB; unknown properties are rejected. Browser CORS supports GET, POST, PATCH, DELETE and OPTIONS for configured origins.

- `POST /workout-sessions`: `{ workoutId, requestId, workSeconds?, restSeconds? }`. Use a unique UUID for each intentional new start and retain it for all retries. IDs are deterministic SHA-256 of owner + requestId, enforced by MongoDB's `_id` uniqueness. Repeated requests return the same record; reusing a key for different settings returns 409. Work seconds must be integers 10–120 and rest seconds 5–120. Defaults come from the catalog. A retry key's lifetime ends when its record is explicitly deleted.
- `GET /workout-sessions`: `{ sessions: Session[] }`, newest first, maximum 200 for this testing module. Add pagination before using it as long-term production history.
- `GET /workout-sessions/:sessionId`: `{ session: Session }`. IDs must be 64 lowercase hexadecimal characters. Invalid format is 400; missing or other-owner records are 404.
- `PATCH /workout-sessions/:sessionId`: `{ revision, operationId, action, deltaMs?, note? }`. Both requestId and operationId accept 16–100 alphanumeric/hyphen characters. Action is `checkpoint`, `pause`, `resume`, `skip`, `end` or `note`. `deltaMs` is an integer 0–60000 of newly observed foreground active time; it defaults to zero. Paused sessions cannot add elapsed time. Resume requires paused status and zero delta. Skip and checkpoint require running status. Pause is idempotent in paused state. End produces `ended-early` unless the supplied delta naturally finishes the workout. `note` is allowed only on terminal sessions, with zero delta and at most 500 characters. Other actions cannot include note. Terminal sessions cannot resume or change progress.
- `DELETE /workout-sessions/:sessionId`: `{ revision }`. Only completed or ended-early sessions can be deleted; returns 204. Wrong/stale revisions return 409. The UI requires confirmation. Other-owner records remain inaccessible. Retrying a committed delete returns 404, which the frontend recovery path treats as already removed.

A Session includes `id`, `ownerId`, `workoutId`, `snapshot`, `status`, `startedAt`, `updatedAt`, optional `finishedAt`, `phase`, `remainingMs`, `elapsedMs`, `workSeconds`, `restSeconds`, `completedSets`, `skippedSets`, `completedIntervals`, `skippedIntervals`, `note` and `revision`. Timestamps are Unix milliseconds. Status is running, paused, completed or ended-early. `phase` is the zero-based current interval; even intervals are work and odd intervals recovery. The two interval arrays contain the indices already completed/skipped. On completion, phase equals total intervals and remainingMs is zero. `completed` means the plan reached its end, possibly with skips; completed/skipped counts distinguish the actual activity.

The shared pure engine in `shared/workout-engine.ts` derives progress on both client and server. The API never accepts ownership, snapshot, status, timestamps, counts, phase or remaining duration from a request body. Every repository query/update/delete includes ownerId. Updates use an atomic owner + ID + revision comparison and increment revision. Retrying the last identical operation (including concurrent identical requests) does not apply progress twice. A competing operation gets 409; no automatic stale-state overwrite or silent rebase occurs.

## Timer and recovery behavior

The provider holds one timer for active and timer views. Display updates run locally every 250ms; API saves happen on meaningful actions, phase changes, and roughly 10-second checkpoints. Only one mutation is sent at a time. Controls prevent overlapping changes, and leaving an active view queues a pause even if a checkpoint is still in flight. Hidden/background views pause; long scheduling gaps are treated as suspension. Unfinished sessions loaded from the API are paused without counting closed time.

A separate AsyncStorage request journal holds only a pending create/update/delete and its retry/revision identifiers. It is not a saved session history and never marks API failures as saved. Requests are journaled before sending. An outage stops the local timer and exposes **Retry pending API request**; enter the token again after refresh before retrying. Revision conflicts offer an explicit confirmed **Use server version** action which discards this device's pending state. The journal is removed only after success. A lost create response cannot create another record; a lost skip response cannot apply the skip twice.

Unsent sub-checkpoint progress is retained in memory while the page remains open. An abrupt process termination can lose that most recent unjournaled time (normally less than 10 seconds; up to the request timeout while an earlier checkpoint is in flight). Recovery uses the durable command and the server record, never time spent closed. A graceful browser pagehide attempts a pause but browsers do not guarantee asynchronous writes at shutdown. Do not clear site storage while recovering a pending request. Use a single active browser tab for the same session; revision conflicts protect against cross-tab overwrites, but there is no live multi-tab synchronization.

The old `fittrack:member3:workout:v1` object is left intact. Only local preferences are copied to the new preferences key; old sample sessions, history and notices are never uploaded. Exercise notes, timer preferences and watched markers remain local. Notifications are explicitly a local-only inbox, created after an API-confirmed finish; this stage does not schedule push notifications or touch shared workout reminders.

## Manual full-flow verification

1. Confirm health reports available. Open the catalog without a token; it should load all three samples. Start without a token or with an incorrect token; the API must reject it. Enter the correct token and retry the pending request, then open the restored paused session through history. Only one record should exist.
2. Choose **Sample: Gentle Start**. Details should show 2 movements / 1 round / 1 minute unless you saved custom timer settings. Open instructions and video; verify the selected exercise and the honest unavailable video state. Return and start; confirm Active Workout opens only after a successful creation.
3. Switch between Active Workout and Workout Timer. The same phase/countdown must continue. Pause, wait, resume, and skip. Open guidance or another module route while running; it must pause. Test browser tab hiding too.
4. End early using confirmation. Open its saved summary, edit the note, and verify success only after the API responds. Open history, refresh the browser, re-enter the token, and reopen the same summary. Verify the note persists.
5. Run the short sample to natural completion, including its final recovery. Repeat with the 3- and 5-exercise samples and/or custom timing; verify totals come from that workout, not 15 hard-coded sets. Restore an unfinished session from history and verify it is paused.
6. Stop the backend during a session, attempt pause/skip/end, and observe the visible failure with no saved claim. Restart it, retry the pending request, and verify the record is not duplicated and the action is not double-counted. Repeat with a browser refresh while the failed command is pending.
7. Use two tabs on the same session to cause a revision conflict. The stale tab must show an error. Only use **Use server version** after reviewing the confirmation; it discards unsaved changes.
8. In a terminal session's summary choose delete, cancel once to verify cancellation, then confirm. History should remove only that session. Other sessions and all catalog samples should remain. A running/paused record cannot be deleted through the API.
9. Test `/workout/details?workoutId=invalid` and `/workout/details` directly. Neither should silently show another workout.

In Atlas, open **Browse Collections → test → workoutsessions**. Filter by `{ "ownerId": "member3:local-development-only" }`. Refresh after each action. Inspect the selected workout snapshot, revision increments, interval arrays, paused/ended/completed status and note. Delete only the session you created through the app and verify its document disappears. The fixture catalog should not have created a workouts collection. No automated test in this task runs against Atlas.

## Checks and limitations

```powershell
Set-Location C:\Users\minid\Documents\FitTrack_Mobile_App
npm.cmd --prefix backend run check
npm.cmd --prefix backend test
npx.cmd tsc --noEmit
npx.cmd expo lint
```

Expo regenerates typed routes on `expo start`. If a fresh checkout has stale route types, start the development server once before typechecking. SDK references used: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/), [Video](https://docs.expo.dev/versions/v57.0.0/sdk/video/), [typed route generation](https://docs.expo.dev/router/reference/typed-routes/).

Backend tests use injected repositories, fake database lifecycle adapters, and real local HTTP requests. A model/repository test checks the actual Mongoose model registration and scoped filters with mocked database operations. These are not real MongoDB integration tests. No shared Atlas writes, manual visual UI pass or native-device end-to-end test was performed. Expo web compilation succeeds; the headless browser attempt could not establish a browser connection in this environment. Complete the manual flow above against your privately configured local backend before merging.

Verification results: backend syntax checks passed; all 32 backend tests passed; frontend TypeScript and Expo lint passed. The tests include the imported leader catalog contract, ownership isolation, payload/ID validation, all three sample plan lengths, transition consistency, creation retries, concurrent identical update retries, stale revisions, deletion restrictions, sanitization, development identity guards and shutdown during initialization. See the selection integration notes for manual browser/device checks still to perform.

Remaining integration work: real verified team identity, the leader's catalog, real licensed videos, production pagination/rate limits and any shared notification service. Deployment, EAS builds, commits and pushes are outside this change and were not performed.
