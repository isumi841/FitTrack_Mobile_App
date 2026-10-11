# 🏋️ Fit Track
### Home Workout and Fitness-Tracking App for Beginners

## 📌 Project Overview

Fit Track is a beginner-friendly home workout and fitness-tracking mobile application designed to help users maintain a healthy lifestyle through personalized workouts, exercise guidance, and fitness progress tracking.

The application provides an interactive platform where users can discover workouts, filter exercises, follow guided workout sessions, manage fitness goals, and monitor their progress.

An Admin Dashboard is also included to manage application users, workouts, exercises, and fitness goals.

## ✨ Main Features

### 👤 User Application
- User Registration and Login
- Email Verification
- Personalized Fitness Onboarding
- Workout Categories and Library
- Workout Search and Duration Filtering
- Workout Details and Exercise Instructions
- Exercise Video Demonstrations
- Active Workout Timer
- Pause and Resume Workouts
- Workout History
- Fitness Progress Tracking
- Goal Management
- Achievements and Reminders
- User Profile Management

### 🛠️ Admin Dashboard
- Admin Dashboard
- Sidebar Navigation
- User Management
- Workout Management
- Exercise Management
- Goal and Progress Management
- Admin Profile and Settings
- CRUD Operations (Create, Read, Update, Delete)

## 💻 Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Mobile Application Development |
| Expo | Application Development and Testing |
| TypeScript | Frontend Development |
| Expo Router | Application Navigation |
| Node.js | Backend Runtime |
| Express.js | REST API Development |
| MongoDB Atlas | Database |
| Mongoose | Database Models |
| Figma | UI/UX Design |
| Git & GitHub | Version Control |

## 🏗️ System Architecture

The application follows a three-layer architecture:

1. **Presentation Layer:** React Native and Expo mobile application.
2. **Application Layer:** Node.js and Express.js REST API.
3. **Data Layer:** MongoDB Atlas database.

**Data Flow:**

User → Mobile Application → REST API → Backend Server → MongoDB → Response → Mobile Application

## 🚀 Installation and Setup

### Prerequisites

- Node.js and npm
- Visual Studio Code
- Git
- Expo Go or a supported device/emulator
- MongoDB Atlas connection

### Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### Install Dependencies

```bash
npm install
```

### Start the Frontend

Run the following command from the frontend project directory:

```bash
npx expo start
```

To launch the web version:

```bash
npx expo start --web
```

### Start the Backend

Navigate to the backend directory and install dependencies:

```bash
npm install
```

Configure the required environment variables in `.env` according to the backend setup.

Start the backend using the script configured in its `package.json`.

**Note:** Never commit `.env` files, database credentials, or API secrets to GitHub.

## Integrated App Setup

Routes live in `src/app/`. The combined app includes authentication and onboarding,
workout discovery and guided sessions, admin management, and Member 4 profiles,
goals, progress, and reminders.

The integrated frontend uses `backend/` for its authenticated APIs. The original
`server/` workout service is also retained in this repository. These are separate
services; starting `server/` alone does not provide the integrated app's authentication,
exercise, session, or profile APIs.

From the repository root, install the integrated backend dependencies and start it
after configuring its private `.env` file:

```powershell
npm.cmd --prefix backend ci
if (-not (Test-Path -LiteralPath backend/.env)) {
    Copy-Item -LiteralPath backend/.env.example -Destination backend/.env
}
# Configure backend/.env before starting the service.
npm.cmd --prefix backend run dev
```

Set `EXPO_PUBLIC_API_URL` in the root `.env.local` to the backend address reachable
from your device. See the root `.env.example` and [backend setup](backend/README.md)
for configuration. Store real credentials only in private environment files;
`.env.example` files must contain empty values or placeholders.

Integration references:

- [Authentication and onboarding](docs/MEMBER1_AUTH_INTEGRATION.md)
- [Admin dashboard](docs/ADMIN_DASHBOARD_INTEGRATION.md)
- [Exercise management](docs/EXERCISE_MANAGEMENT.md)
- [Workout backend](docs/WORKOUT_BACKEND_INTEGRATION.md)
- [Workout selection](docs/WORKOUT_SELECTION_INTEGRATION.md)
- [Guided sessions](docs/MEMBER3_HANDOFF.md)
- [Profiles, goals, and progress](docs/MEMBER4_INTEGRATION.md)

Run the frontend checks from the repository root:

```powershell
npx.cmd expo lint
npx.cmd tsc --noEmit
```

## 🧪 Testing

The application is evaluated using functional and usability testing.

Testing areas include:

- User authentication
- Screen navigation
- Workout searching and filtering
- Workout session controls
- Progress and goal management
- Admin CRUD operations
- User interface usability


## 👩‍💻 Development Team

| Student ID | Main Contribution | Name |
|---|---|---|
| IT23542938 | Workout, Admin Dashboard and Workout Management | Isumi Kumarasinghe |
| IT23539204 | Exercise Management | Minindu Maheesha |
| IT23537538 | Authentication and User Management | Dilanka Jayaweera |
| IT23545526 | Goal and Progress Management | Dev Adithya |
  

## 🎓 Academic Information

 Home Workout and Fitness-Tracking App for Beginners

Final Project

 SLIIT 2026

Developed as an academic group project 
