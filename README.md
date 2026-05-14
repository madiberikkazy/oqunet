# OquNet — Book Sharing Community (MVP)

React + Firebase web app where readers in a local community share physical books.

## Tech stack
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Firebase Auth (email/password), Firestore, Storage

The app works **with or without** Firebase configured. Without `.env`, all data falls back to `localStorage` so you can explore the UI immediately and connect Firebase later.

## Run locally

```bash
cd oqunet
npm install
npm run dev
```

Open http://localhost:5173.

## Connect Firebase

See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** for a complete step-by-step walkthrough — it's written for people who have never used Firebase before. It covers: creating the project, enabling email auth, creating Firestore + Storage, registering a web app, filling in `.env`, and tightening security rules.

Quick version: copy `.env.example` → `.env`, paste your Firebase web config, restart `npm run dev`.

## Auth flow
- **Register** — email, nickname, first name, last name, password (confirmed). Optional avatar upload.
- **Login** — email **or** nickname, plus password. Nickname is resolved server-side to its email, then Firebase Auth signs the user in.

## Project layout

```
src/
  firebase/         Firebase init + data layer (Firestore/Storage/Auth)
  contexts/         Auth & Community React contexts
  components/       BottomNav, BookCard, MobileShell, Stepper, ...
  pages/
    auth/           Register, Login
    user/           Home, Books, BookDetail, RequestBook, Notifications, Profile, Settings
    admin/          AdminHome, AdminBooks, AddBook (3-step), AdminNotification, AdminProfile
    community/      CreateCommunity (3-step), JoinCommunity, CommunityProfile, UserProfile
  utils/i18n.js     Russian/Kazakh labels
```

## MVP behavior

- One community per user. Books section is empty when the user isn't in a community.
- Email + password auth. Login accepts email or nickname.
- Borrowing: one active book at a time; return date capped by `maxDays`.
- Admin role: create posts, add books (3-step wizard with owner picker), approve/reject join requests, send notifications, invite users.
- Switching user → admin requires owning/creating a community; admin → user requires no active borrowing.

## Design notes
Clean, no fake browser/status bar. White card on a tinted background, soft pills, brand blue `#2D6BFF`, rounded inputs, consistent bottom nav across Home / Books / Notification / Profile.

## Roadmap (post-MVP)
- Super Admin role and multi-community moderation
- Push notifications (FCM)
- Dark theme + Kazakh language toggle
