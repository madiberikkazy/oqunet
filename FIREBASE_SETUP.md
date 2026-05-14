# Firebase Setup — Step by Step (first-timer friendly)

This guide will get your OquNet app connected to Firebase from scratch.
Plan to spend about 10–15 minutes. You'll need a Google account.

What you'll set up:
1. A new Firebase project
2. Email/Password authentication
3. A Firestore database (where users, books, communities are stored)
4. Firebase Storage (where avatars and book covers are stored)
5. A web app inside the project (you'll get config keys)
6. A local `.env` file in OquNet so the app uses your project

---

## Step 1 — Create a Firebase project

1. Open https://console.firebase.google.com in your browser. Sign in with your Google account if asked.
2. Click the big **Add project** card (or **Create a project**).
3. **Project name**: type `oqunet` (or whatever you like). Click **Continue**.
4. **Google Analytics**: you can turn it off — toggle "Enable Google Analytics for this project" to **Off**. Click **Create project**.
5. Wait ~30 seconds while Firebase sets it up. Click **Continue** when it's done.

You'll land on the **Project overview** page. Keep this tab open — you'll come back to it.

---

## Step 2 — Turn on Email/Password sign-in

1. In the left sidebar, click **Build → Authentication**.
2. Click **Get started**.
3. You'll see a list of sign-in providers. Click **Email/Password**.
4. Toggle the first switch **Enable** to ON. Leave "Email link (passwordless)" OFF for now. Click **Save**.

That's it for auth. Email/password is now usable from the app.

---

## Step 3 — Create the Firestore database

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **Create database**.
3. **Start mode**: choose **Start in test mode** (this gives you 30 days of permissive rules, perfect for development). Click **Next**.
4. **Location**: pick the region closest to your users. For Kazakhstan/Central Asia, **`eur3 (europe-west)`** is a reasonable default. ⚠️ You cannot change this later. Click **Enable**.
5. Wait ~30 seconds. The database is now empty and ready.

> Don't worry about security rules yet — test mode is fine while you build. We'll tighten them at the end of this guide.

---

## Step 4 — Enable Firebase Storage

1. In the left sidebar, click **Build → Storage**.
2. Click **Get started**.
3. **Security rules**: leave the default ("Start in test mode") and click **Next**.
4. **Location**: it will likely match your Firestore region — click **Done**.

Storage is now ready to receive image uploads (avatars, book covers).

---

## Step 5 — Register a Web app and copy the config

1. Go back to **Project overview** (click the Firebase logo at top-left, or the home icon).
2. Below the project name you'll see a row of icons: iOS, Android, **`</>`** (Web), Unity. Click the **`</>`** icon.
3. **App nickname**: type `oqunet-web`. Leave the **"Also set up Firebase Hosting"** checkbox UNchecked. Click **Register app**.
4. Firebase shows a code snippet that includes a `firebaseConfig` object. It looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...XYZ",
     authDomain: "oqunet-xxxxx.firebaseapp.com",
     projectId: "oqunet-xxxxx",
     storageBucket: "oqunet-xxxxx.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:1234:web:abc123"
   };
   ```

   **Keep this page open** — you need each of these six values in the next step.
5. Click **Continue to console** at the bottom (you don't need to install anything from this page; OquNet already has the Firebase SDK).

---

## Step 6 — Put the config into OquNet's `.env`

1. Open the `oqunet` folder in your code editor (e.g. VS Code).
2. In the project root (the folder with `package.json`), create a new file called **`.env`** (just `.env`, no extension).
3. Copy the template from `.env.example` and fill in each line with the matching value from the Firebase snippet:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...XYZ
   VITE_FIREBASE_AUTH_DOMAIN=oqunet-xxxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=oqunet-xxxxx
   VITE_FIREBASE_STORAGE_BUCKET=oqunet-xxxxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:1234:web:abc123
   ```

   ⚠️ No quotes, no spaces around `=`.
4. Save the file.
5. In your terminal, stop the dev server if it's running (Ctrl-C), then restart it:

   ```bash
   npm run dev
   ```

   Vite only reads `.env` at startup, so a restart is required.

You should now see the app at http://localhost:5173 reading from Firebase instead of localStorage.

> If you see "Firebase config not detected" in the browser console, the `.env` file isn't where Vite expects it or one of the keys is misspelled (`VITE_` prefix is required).

---

## Step 7 — Try it end-to-end

1. Open http://localhost:5173.
2. Click **Регистрация**. Fill in: email, nickname, name, password.
3. Click **Регистрация** to submit.
4. Open the **Firebase Console**:
   - **Authentication → Users**: you should see your new user with their email.
   - **Firestore Database → Data**: you should see a `users` collection with one document containing your profile.
5. Log out (Settings → Выйти) and try to log in again using:
   - your **email** + password ✅
   - or your **nickname** + password ✅

Both should work.

---

## Step 8 — Tighten security rules (do this before going public!)

Test mode rules expire after 30 days. Before then, replace them with rules that actually authenticate.

**Firestore rules** — go to **Firestore Database → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone signed in can read profiles; only the user can edit their own.
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update, delete: if request.auth.uid == uid;
    }

    // Communities — readable by anyone signed in, mutable by their owner.
    match /communities/{cid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
    }

    // Books, posts, notifications, requests, borrowings, ratings, reviews —
    // anyone signed in can read/write for the MVP. Tighten further when you ship.
    match /{collection}/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

**Storage rules** — go to **Storage → Rules** and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Click **Publish**.

These rules require sign-in, cap uploads at 5 MB, and only allow image files. Good enough for the MVP.

---

## Common issues

- **"auth/operation-not-allowed"** — you forgot to enable Email/Password in Step 2.
- **"auth/email-already-in-use"** — that email already has an account. Use a different one or log in.
- **"Missing or insufficient permissions"** — your Firestore rules are too strict. Recheck Step 8 or temporarily go back to test mode.
- **CORS errors on image upload** — Storage isn't enabled, or the bucket name in `.env` is wrong.
- **App still uses localStorage** — `.env` is missing, in the wrong folder, has typos in key names, or you didn't restart `npm run dev`.

---

## You're done!

Your app is now backed by a real Firebase project. Every user, book, community, and notification lives in Firestore. Avatars and book covers live in Storage.

When you're ready to share OquNet with friends, deploy to **Firebase Hosting**, **Vercel**, or **Netlify** — the same `.env` values work in production (set them in your host's environment variables UI).
