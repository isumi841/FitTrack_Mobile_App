# Start workout

Workout Details → Start workout → Get ready → Active workout → Summary.
The setup screen lets the member choose 1–5 rounds and rest between movements.
An in-progress session can be resumed or ended before starting another on this device.
Signing in restores the most recent unfinished session paused. If recovery fails,
retry it before starting another session. Workout history also lets you resume a
saved unfinished session.

## Member sign-in

Log in with your Member 1 email/password account. Workout sessions and local recovery
data are separated by account. Demo-member access is no longer used. The previous
shared demo records remain untouched and are not assigned to real users.
See [authentication integration](MEMBER1_AUTH_INTEGRATION.md) for signup, SMTP and
admin setup. Web reloads require sign-in again; native sessions use SecureStore.

## Session plan and persistence

- `GET /api/member3/workouts/:id/session-plan` reads the active parent workout and
  the admin's ordered exercises. Empty exercise lists cannot start.
- Explicit targets such as `30 seconds`, `3min` and `1.5 minutes` count down.
  Reps, sets, per-side and ambiguous targets use **Complete exercise**. No rep-to-time
  conversion is inferred. Instructions and the exact target remain visible.
- Managed workouts finish after the last exercise, without a final recovery period.
  Sample workouts retain their original interval behavior.
- Start creates a snapshot in `test.workoutsessions`: exercise order, target,
  instructions, video, rounds and rest. Subsequent admin changes do not alter it.
- Pause, resume, skip, manual completion, end early, note editing and confirmed
  deletion use owner-scoped, revision-checked session endpoints.
- Summaries show completed, skipped and unfinished exercises for each round.
  Notes allow up to 500 characters. Viewing, editing or deleting an older summary
  preserves the current workout; deleting a record requires confirmation.
- Saves are journaled before submission. A lost response retries the same operation.
  Even if an admin deletes the original workout, a successful Start can be recovered
  using its request ID. Leaving the screen or backgrounding pauses activity.
- Mixed/manual plans have no promised total duration; their stored duration is the
  timed portion plus recovery. Actual elapsed time is saved throughout the session.

## Local verification

From the repository root, run `npm.cmd --prefix backend run dev` and, in another
terminal, `npx.cmd expo start --web`. Existing backend/frontend API configuration is
used. Select a saved workout with admin-managed exercises and follow the flow above.

Try a timed exercise (`10 seconds`) followed by a rep target (`12 reps`), two rounds,
pause/resume, opening video guidance (which pauses), skipping rest, completing the
session, editing its note and deleting its saved summary. Reload during a session,
sign in again, and return to the restored workout; a pending save should be retried first.

Automated coverage uses injected repositories, never writes to Atlas, and covers
mixed timing, rounds, completion replays, snapshot recovery, empty plans, boundary
skips, owner isolation and the existing CRUD behavior.

The 430 × 932 browser walkthrough passed against the real API routes with isolated,
in-memory repositories: login, start, pause/resume, guidance, manual completion,
automatic countdown, skip, summary, re-login recovery, note editing with a simulated
lost response, confirmed deletion, and ending early. Editing/deleting an older
summary was checked while another workout remained paused. Lint, TypeScript and
all 117 backend tests passed. Physical-device and live-Atlas walkthroughs remain
manual checks; these tests did not create records in the shared database.
