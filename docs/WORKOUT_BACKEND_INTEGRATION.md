# Leader workout backend integration

Adapted from `member2_active_workout`, commit
`da9ba2423daea9cfd09a4b135c2c707bb5b05a01` (Connect Member 2 workouts to MongoDB backend).
The branch's schema, active-workout queries, filters, and read response contract are
integrated into the existing `backend` service. No second server, duplicate navigation,
profile/authentication provider, dependency set, or workout collection was added.

## Data flow

- Workouts, Library, Filter, Results, and the admin Exercises chooser load saved active
  workouts. Search is debounced; errors and empty results do not substitute local data.
- The leader's MongoDB `_id` becomes `workoutId` throughout navigation and exercise CRUD.
  Admin-created instructions/video remain in `test.exercises`, keyed by that ID.
- Workout Details and public instructions read the same managed exercises. Creating
  guidance does not change the leader's workout document or its embedded targets.
- Deleted/inactive database workouts cannot receive new exercises or serve public
  guidance. Existing records are not automatically deleted or reassigned.
- Old slug-based links and exercises remain readable for compatibility. They are not
  automatically attached to MongoDB workouts with similar names. The three complete
  sample plans and saved session snapshots remain unchanged.
- Start now uses the admin-managed exercise plan. Explicit duration targets are
  timed; rep-based and ambiguous targets are completed manually. See
  [Start workout](START_WORKOUT.md) for temporary sign-in and session behavior.

## Database access

The leader's branch explicitly selects `fittrack_db`. This integration reads its
`workouts` collection on the cluster configured by `MONGODB_URI`. Optional
`WORKOUT_DATABASE` defaults to `fittrack_db`. Keep the URI's primary database as `test`
for this module's development exercises/sessions and temporary identities.

The configured database user needs both:

| Role | Database | Purpose |
| --- | --- | --- |
| `readWrite` | `test` | Existing exercise and session CRUD |
| `read` | `fittrack_db` | Read the leader's saved workouts |

The user's confirmed account `fittrack_member3_min` currently has only
`readWrite@test`. Atlas connects successfully, but the live workout query was rejected
with MongoServerError code 8000. Add the `read` role for `fittrack_db` to that same user
in Atlas Database Access, preserving the existing role. A custom role granting `find`
only on `fittrack_db.workouts` is a narrower alternative. This integration does not
require Atlas admin privileges or write access to the leader's database.

After saving the Atlas permission, restart the backend and reload the app. No password
change is required solely to add a role. This task did not edit the private `.env`,
change Atlas roles, seed workouts, or write test records into either database.

## API compatibility

The existing backend port serves both modules:

- `GET /api/member2/workouts` preserves `{success, count, data}` from the leader's API.
- `GET /api/member2/workouts/:id` preserves `{success, data}`.
- `GET /api/member3/workouts?source=leader` returns the same saved workouts mapped to
  this module's overview contract. It supports the leader's filters.
- `GET /api/member3/workouts/:id` combines live metadata with managed guidance.
- Existing exercise endpoints validate the parent workout against the live collection.

Filters: `search`, `category`, `difficulty`, `duration`, `equipment`, `lowImpact`.
Search is literal case-insensitive text; malformed query types are rejected. Only active
workouts are listed/read. Database failures use sanitized 503 responses.

The leader's unrestricted POST/PUT/DELETE routes were not exposed. Workout creation
remains the leader's responsibility; this stage connects their saved data to exercise
management. Their standalone backend can continue managing the same collection.

## Verification

All 52 backend tests pass, as do backend syntax checks, frontend TypeScript, and lint.
New tests cover MongoDB-ID guidance CRUD, unchanged parent records, missing parents,
read API compatibility, filters, storage failures without fixture fallback, and the
read-only database adapter. Tests use isolated repositories and mocked Mongoose queries.

Live verification is pending the Atlas read permission above. Once granted:

1. Restart the backend and open Workouts/Library. Confirm saved workouts appear.
2. Test duration/category/search filters and open a card's details.
3. Sign in through Admin login, open Exercises, and select the same workout.
4. Create/edit instructions and an optional video; preview and check user Details.
5. Confirm an inactive/deleted workout disappears after returning to selection.

No browser or physical-device walkthrough has been performed for this stage.
