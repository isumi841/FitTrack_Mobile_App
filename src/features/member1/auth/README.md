# Member 1 authentication

## Email/password API

The signup, verification, resend and login screens use `auth-api.ts` and the
shared base URL in `src/config/api.ts`. Existing form styling, images, social
buttons and web phone preview remain in place. No additional dependency is
required.

Create or edit `.env.local` in the **Expo project root**, not `backend/`, using
the public setting from the root `.env.example`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5000
```

This address works for Expo Web on the backend computer. For a physical phone,
replace `localhost` with the computer's LAN IPv4 address (find it with
`ipconfig`), for example `http://192.168.1.100:5000`. Keep the phone and computer
on the same network and allow the backend port through the computer's firewall.
The phone's `localhost` points to the phone. Restart Expo after changing the
setting and reload the app. The base URL omits `/api/auth`; the client adds each
endpoint path. If unset, the base URL defaults to `http://localhost:5000`.

Keep MongoDB and SMTP credentials exclusively in `backend/.env`.
`EXPO_PUBLIC_API_URL` is public client configuration and must contain only the
backend URL. Browser previews served from a different origin may also need that
origin added to the backend's existing `CORS_ORIGINS` setting.

- Signup validates the form, posts `{ email, password, confirmPassword }` to
  `/api/auth/signup`, and opens `verify-email` only after success. Route params
  contain only the normalized email. Password fields are then cleared.
- Verification reads and validates that email, accepts a six-digit string OTP,
  and posts `{ email, otp }` to `/api/auth/verify-email`. Success hides the input
  and resend action, displays "Your email is verified. Your account is ready.",
  and offers "Continue to Log In".
- Resend posts `{ email }` to `/api/auth/resend-otp`, displays the backend's
  success/error message, and clears the old code after a successful resend.
  The backend's existing 60-second cooldown still applies.
- Login posts `{ email, password }` to `/api/auth/login` and opens the temporary
  `login-success` route after success. The backend has no JWT/session yet, so
  this confirms credentials without adding persistent login or implementing
  the existing Remember me option.

Requests show a loading state, prevent repeat submissions, and are cancelled
when a screen loses focus. Backend errors appear in the existing feedback
areas. Connection failures and 45-second timeouts show safe retry messages.
Passwords and OTPs are never stored, logged, or included in URLs. Development
OTP mode continues to print the code in the backend terminal; SMTP mode sends
it to the submitted email address.

## Social authentication

`handleSocialLogin(provider)` is shared by Login and Sign Up. Google, Apple and Facebook use their provider flows instead of email/password form validation. Personal emails and Apple relay emails are allowed; email/name may be absent. A successful real adapter returns `{ status: 'success', account }` with `id`, `provider` and optional `email`, `name`, `avatarUrl`. This layer does not create a FitTrack session or navigate automatically.

The project currently has `expo-web-browser`, but no authentication SDK, `expo-auth-session`, `expo-crypto`, `expo-apple-authentication`, provider credentials or social-authentication backend integration. No adapter is registered yet. Buttons therefore return `unavailable`, never fabricated account information. Development messages identify missing configuration; production messages stay suitable for users.

## Connect an actual provider

Add a separate provider adapter outside `src/app/`, then call `registerSocialLoginAdapter('Google' | 'Apple' | 'Facebook', adapter)` at application startup. An adapter supplies `supportedPlatforms` and `signIn(configuration)`. `signIn` must invoke the real SDK, normalize its response to `SocialAdapterResult`, handle SDK cancellation and return `unavailable` when its device/request is not ready. No mock account belongs in a production adapter.

Prepare web requests before the button press. Open the provider prompt synchronously inside `signIn` before asynchronous work so browsers retain the user gesture. Use the SDK's state/nonce and code/PKCE handling. Send provider credentials to a future backend for verification and session creation; a profile ID alone must not authenticate backend requests. Never log provider tokens or send secrets through these result messages.

If choosing browser OAuth, first install SDK-compatible packages with `npx expo install expo-auth-session expo-crypto` (use `bunx` instead of `npx` if a Bun lockfile is adopted). Use `useAuthRequest`, `makeRedirectUri`, and `WebBrowser.maybeCompleteAuthSession()` in the provider integration. Its request must be ready before prompting. Use a development build for native OAuth; Expo Go does not supply a custom app scheme. Do not build a security flow from `expo-web-browser` alone. [Expo OAuth guide](https://docs.expo.dev/guides/authentication/), [SDK 57 AuthSession](https://docs.expo.dev/versions/v57.0.0/sdk/auth-session/).

## Google configuration

These exact public keys are read by `social-login.ts`:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: a Google Cloud **Web application** OAuth client ID. Required on web and as the native SDK's server/ID-token audience. `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is an optional alias for this web ID; it must also identify a Web application client.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: an **iOS** OAuth client ID bound to the eventual `expo.ios.bundleIdentifier`. Required by this seam on iOS.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: the **Android** OAuth client ID, if the selected adapter needs it at runtime. Native Google SDKs normally use the registered Android package/signing certificate plus the web client ID instead; this key is optional in this seam. Create the Android OAuth client in Google Cloud regardless, bound to the eventual `expo.android.package` and SHA-1 fingerprints for development/EAS and Play signing.

The current app config has no native bundle identifier or Android package. Choose and register those values when enabling native Google sign-in. Select an Expo-compatible native Google library from the current [Expo Google authentication guide](https://docs.expo.dev/guides/google-authentication/), configure its plugin/reversed iOS URL scheme as its documentation requires, and rebuild a development binary. Native Google integrations require custom native code.

For web, register local/deployed origins and exact redirect URIs as required by the chosen Google Identity Services/OAuth adapter. Configure the consent audience to allow personal Google accounts; do not apply a SLIIT hosted-domain restriction. Request basic identity/profile/email only, and use the provider account-picker option where available. [Google Identity Services setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Apple configuration

Native Apple currently has no client ID variable in this seam. Install `expo-apple-authentication` with `npx expo install`, add its config plugin, set `expo.ios.usesAppleSignIn: true`, and configure the bundle identifier's Sign in with Apple capability/signing. Build again with EAS. Register an iOS adapter which checks `AppleAuthentication.isAvailableAsync()`, invokes `signInAsync`, requests `EMAIL`/`FULL_NAME`, and returns the credential's stable `user` ID. Name/email may only be supplied on the initial authorization; preserve real data when backend/storage exists.

The native package supports iOS, not Android/web. Those platforms currently receive an appropriate message. A future separately configured Apple web OAuth adapter may register its supported platforms, but requires its own Services ID, domain and return URL; any private Apple signing key/client secret must stay on a backend. [SDK 57 Apple Authentication](https://docs.expo.dev/versions/v57.0.0/sdk/apple-authentication/).

## Facebook configuration

- `EXPO_PUBLIC_FACEBOOK_APP_ID`: the public Meta application ID, required by this seam.
- `EXPO_PUBLIC_FACEBOOK_REDIRECT_URI`: optional here, passed to the adapter if present. A browser OAuth adapter must provide its actual callback URI (using this value or a generated URI) and register that **exact** URI in Facebook Login's valid OAuth redirect settings. Register deployed/local domains/origins and native platform identifiers as required by the chosen SDK.

Select the provider SDK described in the [Expo Facebook authentication guide](https://docs.expo.dev/guides/facebook-authentication/) for native use, or a supported browser OAuth SDK. Set up Facebook Login, request basic profile/email access, configure SDK plugins, and build a development binary for custom native code. The adapter must return real provider information and handle missing email. App review/test-user/live-mode settings must permit the intended accounts. App IDs alone do not enable authentication; the registered adapter, platform setup and callback registration are also required.

## Environment and secrets

Set public IDs in an ignored local `.env` or the corresponding EAS environment. Expo embeds `EXPO_PUBLIC_*` into client bundles, so these values must never contain Google/Facebook client secrets, Apple private keys, JWT signing keys or backend credentials. Private values belong on a future backend. Direct `process.env.EXPO_PUBLIC_NAME` access is intentional; dynamic property lookup is not inlined by Expo. Reload/rebuild after changing public configuration. [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).
