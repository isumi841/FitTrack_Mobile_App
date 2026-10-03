# FitTrack member1 authentication backend

This separate Node.js/Express project implements email/password signup for SLIIT
and personal addresses (including Gmail, Yahoo and Outlook),
email OTP verification, resend, and login. It does not issue JWTs, create social
login sessions, or change the Expo screens. Login currently returns a success
response and basic user information only.

## Install and configure

Use Node.js 22.13 or newer. From the repository root:

```powershell
cd backend
npm install express mongoose bcrypt nodemailer dotenv cors
Copy-Item .env.example .env
```

The dependencies are also recorded in `package.json` and `package-lock.json`,
so an existing checkout can use `npm ci` instead. No Expo dependency changes are
needed. Do not overwrite an existing `.env` containing your credentials.

Edit **backend/.env**:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=
EMAIL_MODE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
SMTP_ALLOW_SELF_SIGNED=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
OTP_EXPIRY_MINUTES=5
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
```

- `MONGODB_URI`: paste the MongoDB Atlas **Drivers** connection string, use your
  Atlas database user credentials, and include a database name such as `fittrack`.
  Atlas must allow the backend machine's IP in Network Access. Use an Atlas
  cluster supporting transactions; verification creates the user and consumes
  the pending registration in one transaction.
- `EMAIL_MODE`: `development` prints codes only in the backend terminal without
  loading Nodemailer or requiring SMTP credentials. `smtp` uses real email
  delivery and requires the SMTP settings below. If omitted, SMTP is used for
  compatibility with existing deployments. Other values are rejected.
- `EMAIL_HOST`, `EMAIL_PORT`: for the configured Gmail sender, use
  `smtp.gmail.com` and `587` (STARTTLS). Port 465 uses TLS immediately.
- `EMAIL_USER`: keep the existing Gmail account configured in `backend/.env`.
- `EMAIL_PASS`: keep that account's Google App Password. Gmail SMTP with this
  password-based setup requires an App Password, not the normal Gmail password.
  Enable 2-Step Verification on the Google account before creating one.
- `EMAIL_FROM`: use the same Gmail account as `EMAIL_USER`. An optional display
  name such as `FitTrack <...>` must contain that same address.
- `SMTP_ALLOW_SELF_SIGNED`: defaults to `false`. Only the exact value `true`
  enables the local SMTP certificate-validation bypass, and only when
  `NODE_ENV` is not `production`. Production always validates certificates,
  even if this flag is set to `true`. Gmail on port 587 still requires STARTTLS.
- `OTP_EXPIRY_MINUTES`: defaults to 5. Valid values are 1–60.
- `CORS_ORIGINS`: comma-separated exact browser origins. Include the actual
  origin shown by Expo Web. With `NODE_ENV=production`, provide explicit HTTPS
  origins. Native apps and command-line clients can send requests without an
  Origin header.

If an environment value contains `#` or spaces, quote it appropriately in `.env`.
URL-encode special characters in Atlas username/password components. Keep
credentials in this server environment; never put them in `EXPO_PUBLIC_*`.
The real `.env` and variants are gitignored, while `.env.example` is tracked.
`EMAIL_USER` and `EMAIL_PASS` always authenticate the configured SMTP account,
and `EMAIL_FROM` always supplies the sender. The address entered by a user is
only the email recipient (`To`); it never becomes the SMTP username, password,
sender or reply-to address.

### Switch OTP delivery modes

For local development without an app password, set this in **backend/.env**:

```dotenv
EMAIL_MODE=development
```

Keep `MONGODB_URI` configured. SMTP fields may remain blank in this mode. After
signup or resend, read the code in the terminal running the backend:

```text
[DEV ONLY] OTP for user@example.com: 123456
```

Only delivery changes: codes are still randomly generated, hashed in MongoDB,
subject to the same expiry, attempts, resend cooldown and duplicate checks, and
verified through the existing endpoints. No code is returned by the API.
Development mode is rejected when `NODE_ENV=production`.

For real email delivery, change the same setting:

```dotenv
EMAIL_MODE=smtp
```

Keep the existing `EMAIL_USER`, `EMAIL_PASS` and `EMAIL_FROM` in `backend/.env`;
the sender and SMTP login must refer to the same Gmail account. Use
`EMAIL_HOST=smtp.gmail.com` and `EMAIL_PORT=587`. SMTP mode does not print codes.
After either change, stop the backend with **Ctrl+C** and run `npm start` again from `backend/`.
Restart even when using `npm run dev`, because editing `.env` does not reload
the running configuration.

Reference: [Atlas connection strings](https://www.mongodb.com/docs/atlas/driver-connection/),
[Nodemailer SMTP configuration](https://nodemailer.com/smtp),
[Google App Passwords](https://support.google.com/accounts/answer/185833).

### Local SMTP certificate testing

If a local TLS proxy or antivirus causes `ESOCKET self-signed certificate in
certificate chain`, keep your existing Gmail credentials and set these values
in **backend/.env** for local testing:

```dotenv
NODE_ENV=development
EMAIL_MODE=smtp
SMTP_ALLOW_SELF_SIGNED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

This disables certificate validation for the SMTP transport only. SMTP mode
still sends real verification email and never prints OTP values or credentials.
`EMAIL_MODE=development` retains the existing local OTP behavior.
Restart the backend after editing `.env`.

From the repository root, test the SMTP TLS connection and authentication:

```powershell
cd backend
npm.cmd run smtp:verify
```

The command calls `transporter.verify()` using the OTP service's transport
settings; it sends no email and does not connect to MongoDB. Failure output
contains a safe error category instead of raw SMTP diagnostics or credentials.

Before deployment, set `NODE_ENV=production` and
`SMTP_ALLOW_SELF_SIGNED=false`, or remove `SMTP_ALLOW_SELF_SIGNED` entirely.
Never set `NODE_TLS_REJECT_UNAUTHORIZED=0`; it disables TLS validation globally.

## Start

Run these from `backend/`:

```powershell
npm start
```

For automatic restart while editing:

```powershell
npm run dev
```

The API starts after MongoDB connects and the unique email indexes are ready.
Configuration loads from `backend/.env` regardless of the launch directory.
Check the running server with `GET http://localhost:5000/api/health`.

## Endpoints

All bodies use `Content-Type: application/json`. Responses contain `success`
and `message`; successful signup/resend also return `email`, and successful
verification/login return `user: { id, email, isEmailVerified }`.

### POST /api/auth/signup

Body: `{ email, password, confirmPassword }`.

Email uses general ASCII email validation. Examples include
`IT12345678@my.sliit.lk`, `someone@gmail.com`, `someone@yahoo.com`,
`someone@outlook.com`, and `first.last+fitness@accounts.example.com`.
Whitespace, multiple `@` signs, empty parts, misplaced/consecutive dots,
invalid domain labels and overlong addresses are rejected. The full address is
capped at 254 characters, its local part at 64, and each domain label at 63.
Quoted local parts and Unicode addresses are outside this validator's scope.

Accepted personal addresses are stored and looked up in lowercase; for example,
`Someone@GMAIL.COM` and `someone@gmail.com` identify one account. Existing
student addresses keep their original key: case variants of
`IT12345678@my.sliit.lk` normalize to uppercase `IT`, eight digits, and lowercase
`@my.sliit.lk`. Validation and normalization match the Expo frontend; every
auth endpoint and both model schemas apply them. Existing unique indexes keep
duplicate protection without migrating the original student account keys.

Passwords need at least eight characters, ASCII uppercase and
lowercase letters, a digit, and a non-alphanumeric special character. Spaces
alone do not count as special characters. Passwords are capped at 72 UTF-8 bytes
because bcrypt truncates longer inputs. Confirmation must match exactly.

Signup rejects existing users and existing pending registrations. It hashes the
password and a cryptographically generated six-digit OTP using bcrypt with
12 rounds, saves a pending registration, and delivers the code using `EMAIL_MODE`.
In development mode HTTP 201 follows the terminal output; in SMTP mode it is
returned only after SMTP accepts the intended recipient. SMTP acceptance does
not guarantee inbox placement. No User is created yet.

### POST /api/auth/verify-email

Body: `{ email, otp }`. The OTP must be a six-character **string**.

Verification checks expiry and reserves an attempt atomically before comparing
the bcrypt OTP hash. At most five attempts are allowed per code. Correct codes
create a verified User and delete the matching pending registration in an Atlas
transaction. No password, OTP, hash, or JWT appears in the response.

### POST /api/auth/resend-otp

Body: `{ email }`.

Resend requires a pending registration, retains its original password hash,
replaces the code, resets attempts and expiry, and delivers the new code in the
selected mode. Wait at least 60 seconds between deliveries. Use the latest code
from the backend terminal in development mode or your inbox in SMTP mode.
Expired codes can be resent; pending records are automatically cleaned up one
day after OTP expiry. Verification always checks the five-minute expiry itself,
regardless of delayed MongoDB TTL cleanup.

Failed delivery removes a new pending registration or restores the previously
delivered code. Verification is blocked during delivery. Expired reservations
left by an interrupted send can recover through resend.

### POST /api/auth/login

Body: `{ email, password }`.

Login validates and normalizes the email, requires a verified user, and compares the
password with bcrypt. HTTP 200 means the credentials matched. JWT/session
creation will be added later.

## Test signup and verification

Start the backend, then open another PowerShell terminal. Replace the example
address with a real email you control. The original SLIIT example and personal
addresses both work:

```powershell
$accountEmail = 'IT12345678@my.sliit.lk'
$signupBody = @{
  email = $accountEmail
  password = 'FitTrack@123'
  confirmPassword = 'FitTrack@123'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/signup' -ContentType 'application/json' -Body $signupBody
```

Read the actual code in the backend terminal with `EMAIL_MODE=development`, or
check that mailbox with `EMAIL_MODE=smtp` (codes are not logged in SMTP mode).
Verify within five minutes:

```powershell
$otp = Read-Host 'Enter the 6-digit code from the backend terminal or your email'
$verificationBody = @{ email = $accountEmail; otp = $otp } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/verify-email' -ContentType 'application/json' -Body $verificationBody
```

If the code expires, wait for the resend cooldown and request a new one:

```powershell
$resendBody = @{ email = $accountEmail } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/resend-otp' -ContentType 'application/json' -Body $resendBody
```

After verification, test login:

```powershell
$loginBody = @{ email = $accountEmail; password = 'FitTrack@123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -ContentType 'application/json' -Body $loginBody
```

Errors use clear messages and these HTTP codes: 400 invalid input/code, 401 wrong
credentials, 403 email not verified or browser origin blocked, 404 no pending
registration, 409 duplicate/in-progress/changed verification, 410 expired OTP,
429 attempt/cooldown/request limit, 503 email delivery failure, and 500 unexpected
database/server failure.

## Automated verification

```powershell
npm test
```

Tests run real HTTP requests through Express and real bcrypt, using isolated
database doubles and an isolated mail service. They cover validation, expiry,
attempt limits, concurrent verification/resend, delivery rollback and recovery,
pending password preservation, CORS, model redaction, environment settings,
development delivery without SMTP, and suppression of OTPs in API responses.
No Atlas connection or email is used by these tests. Validate real Atlas indexes,
transactions, and email delivery separately after supplying credentials.

The HTTP IP limiter allows 30 authentication requests per 15 minutes per process;
OTP attempt and resend limits are additionally persisted in MongoDB. Multiple
server instances need a shared IP limiter for a single global request quota.
Proxy trust stays disabled; configure a specific trusted proxy only when your
deployment requires it. Development delivery logs only the recipient and code
with a `[DEV ONLY]` prefix. SMTP mode never logs codes; neither mode logs
passwords or request bodies.
