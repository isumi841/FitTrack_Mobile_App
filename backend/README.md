# FitTrack Member 3 backend

Backend for Exercise Guidance & Active Workout, using Node.js 24, Express 5 and
Mongoose 9. The health/lifecycle foundation is extended with a code-only sample
catalog and owner-scoped session CRUD in `test.workoutsessions`.
Automatic collection/index creation remains disabled; development startup explicitly
initializes only that collection's owner/date index. No team collections are seeded.

See [the full handoff](../docs/MEMBER3_HANDOFF.md) for the required private opt-in
development token, loopback-only setup, API contracts and manual CRUD verification.
The session engine is shared with the frontend in `../shared/workout-engine.ts`,
executed directly using Node 24 type stripping. Deploy this backend with that shared
directory available; it is no longer a standalone backend-directory-only package.

## Local setup (Windows PowerShell)

From the project root:

```powershell
Set-Location .\backend
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
notepad.exe .env
```

In **backend/.env only**, replace `<db_password>` in `MONGODB_URI` with your Atlas
database user's password. Remove the angle brackets. URL-encode special characters
in the password (for example, `@` becomes `%40`, `#` becomes `%23`, and `%` becomes
`%25`). Keep the username, cluster address, `/test` database, and query parameters
from the template. Never put this URI in Expo files or an `EXPO_PUBLIC_*` variable.
Do not paste your password into commands or logs.

The template uses `PORT=5001`, `NODE_ENV=development`, and browser origins
`http://localhost:8081,http://localhost:8082`. Add other exact HTTP(S) origins to
`CORS_ORIGINS` only if needed; omit paths, trailing slashes, and wildcards.

```powershell
npm.cmd run dev
# Or, without automatic source-file restarts:
npm.cmd start
```

The backend always loads `.env` relative to its own folder, even when started with
`npm.cmd --prefix backend start` or `node backend/src/server.js` from the project
root. Existing shell environment variables take precedence over `.env`. Restart
after changing `.env` (watch mode watches source files). Startup validates required
settings and rejects unresolved placeholders before attempting a connection.

Atlas must allow your current IP under Network Access and the database user must
have access to the configured database. The server starts listening only after
MongoDB connects and responds to a ping. Connection errors are sanitized and startup
fails with a nonzero exit code. Ctrl+C / SIGINT and SIGTERM stop new HTTP connections,
drain active requests, and close MongoDB, with a 10-second shutdown deadline.

## Health check

In a second PowerShell window:

```powershell
Invoke-RestMethod -Uri http://localhost:5001/api/health
```

Each request pings MongoDB with a 3-second operation timeout. A successful ping
returns HTTP 200 with `{"status":"ok","database":"available"}`. A failed ping or
disconnection returns HTTP 503 with
`{"status":"unavailable","database":"unavailable"}`. PowerShell reports a request
error for HTTP 503. No HTTP server is available if the initial connection failed.
Responses do not include the URI, credentials, or database error details.

Unlisted browser origins receive HTTP 403. Allowed origins receive CORS headers,
including on preflight requests. Requests without an Origin header (such as native
clients and PowerShell) are allowed. CORS is not authentication.

## Checks without Atlas credentials

```powershell
# Run inside backend:
npm.cmd run check
npm.cmd test

# Required existing Expo project checks, run from the project root:
Set-Location ..
npx.cmd expo lint
npx.cmd tsc --noEmit
```

Tests use fake database adapters and temporary local HTTP servers. They exercise
configuration loading/validation, startup ordering and failures, health 200/503,
CORS, and shutdown without contacting Atlas or changing any database records.
Passing these checks **does not verify a real Atlas connection**. That requires a
local password, successful startup, and the health request above.

`backend/.env` and `node_modules` are Git-ignored. `.env.example` and the backend
lockfile remain trackable. Setup commands preserve an existing `.env`.
