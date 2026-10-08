# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Workout screens (Member 3)

Login, signup, email verification and onboarding are integrated from Member 1.
See [authentication integration](docs/MEMBER1_AUTH_INTEGRATION.md) for setup and
the mapping to your existing workout/session screens.

Log in with an existing admin email and password to enter the dashboard imported from
`admin_dashboard_new`. Open **Exercises** in its sidebar for exercise
CRUD. See [dashboard integration](docs/ADMIN_DASHBOARD_INTEGRATION.md) and
[exercise management setup](docs/EXERCISE_MANAGEMENT.md) for setup and manual checks.

Workouts and the admin exercise chooser now read the leader's MongoDB workout collection.
The backend database user needs `readWrite@test` plus `read@fittrack_db`.
See [workout backend integration](docs/WORKOUT_BACKEND_INTEGRATION.md).

The entry route opens onboarding when signed out and the workout library when signed in.
The leader's `/member2/workout` selection screen has cards linked
to `/workout/details?workoutId=...`. See [the selection integration notes](docs/WORKOUT_SELECTION_INTEGRATION.md)
for the imported branch, data contract, and next screen to implement. The temporary
`/workout/browse` catalog remains accessible through quick actions for session testing.
Workout screens use the dark
and lime palette in `src/constants/fittrack-theme.ts`, with shared controls in
`src/features/workout/ui.tsx`.

The floating dock lives in the workout layout so it stays mounted between screens.
Its destinations and quick actions are configured in
`src/components/navigation/navigation-config.ts`. It displays Home, Workouts,
Progress, and Profile around the center quick-actions button. Since this branch
does not include the team's Home or Profile destinations, those tabs temporarily
reuse the workout overview and notifications screens; `/member4/*` routes are
not included here. The quick actions open the sample catalog, local notifications,
and module session history. Opening quick
actions or leaving a session pauses it; switching between guided and timer views
keeps it running.

Run `npx expo lint` and `npx tsc --noEmit` to validate changes. On PowerShell with
script execution disabled, use `npx.cmd` in place of `npx`.

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
