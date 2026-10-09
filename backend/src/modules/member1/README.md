# Member 1 integration

This module contains the authentication, onboarding account, and admin API code from the Member 1 ZIP. It is mounted by `backend/src/app.js` at `/api/auth` and `/api/users`. Use the existing backend commands from `backend/`: `npm run dev` or `npm start`. There is one server and one MongoDB connection.

The module-local `package.json` only declares CommonJS for the imported JavaScript. Dependencies and commands are in `backend/package.json`; do not install a second backend here.

Add the necessary settings from `backend/.env.member1.example` to the existing `backend/.env`, preserving its MongoDB, port, development user and Cloudinary values. A JWT secret (at least 32 bytes) and email settings are required for authentication. `EMAIL_MODE=development` is an explicit local option that prints OTPs instead of sending mail; production requires SMTP. Google, Facebook and Apple sign-in need their own provider registrations and credentials. No credentials were copied from the ZIP, generated, or changed during the merge.

Without the additional authentication configuration, `/api/auth` and `/api/users` return a clear 503 response. Existing Member 4 routes continue to run. A valid bearer session is accepted by Member 4; its existing development user header remains available when no bearer token is supplied. This preserves the existing development workflow and is not a production-wide authentication enforcement change.

## Checks

- `npm run test:merge`: integration checks using local HTTP servers, synthetic configuration and isolated database doubles. No real accounts are modified and no email is sent.
- `npm run test:member1`: full imported test suite plus integration checks. The supplied ZIP has 15 pre-existing failures (33/48 imported tests pass), confirmed against its original route/service/model implementations. Its older assertions differ from current lowercase email normalization, four-digit OTPs, verification flow and response fields. These feature behaviors were not rewritten as part of this merge.
- `npm run smtp:verify`: optional real SMTP connection check using your configured settings. Not run during the merge.

The ZIP's standalone server, automatic index migration, dependency on the `node` package, and unrelated `server.js` npm dependency are not needed in the shared backend. No database migration or admin-seeding script ran during the merge.
