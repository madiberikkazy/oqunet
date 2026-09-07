# OquNet push delivery

Two functions, both in `europe-west1` — the trigger region for this project's
`eur3` Firestore, and the closest region to the readers.

| export | what it is | who calls it |
|---|---|---|
| `api` | HTTP. Device registration: `/push/fcm/subscribe`, `/push/fcm/unsubscribe`, `/push/subscribe`, `/push/unsubscribe`, `/health` | the app, with a Firebase ID token |
| `onNotificationCreated` | Firestore trigger on `notifications/{id}` | Firestore |

## Why not the Express server

`server/` used to do this with a long-lived `onSnapshot` listener. That cannot
work on a free instance: it sleeps after fifteen minutes idle, the listener dies
with it, and the cursor that stops a restart re-pushing the whole database also
skips everything written during the sleep. Notifications arrived only while
something happened to be keeping the process awake.

A notification is an event, so a trigger delivers it. Nothing to keep alive,
nothing to wake, no cursor, no window in which a notification can be lost —
and it costs nothing between notifications.

`server/` still exists, for the Telegram phone-verification webhook. That one
really is request/response, and a sleeping instance makes it slow rather than
wrong.

## Deploy

```bash
firebase deploy --only functions
```

Requires the **Blaze** plan — Cloud Functions is not on Spark. The free
allowance (2M invocations a month) covers this workload many times over.

The deploy prints the URL of `api`. Put it in the app's `.env` as
`VITE_PUSH_SERVER`, then rebuild — Vite bakes it in at build time, so an
unchanged bundle keeps the old value:

```bash
npm run sync
```

Check it before trusting it:

```bash
curl https://europe-west1-oqunet-6070b.cloudfunctions.net/api/health
```

`{"ok":true,"push":{"web":false,"fcm":true}}` is the expected answer while only
mobile is configured. `fcm` is always true here — the credential is the
project's own, so there is nothing to set and nothing that can be half-set.

## Web Push (optional)

`web` above stays false until a VAPID pair is set. Native push does not use it.

```bash
npx web-push generate-vapid-keys
firebase functions:secrets:set VAPID_PRIVATE_KEY
```

The public half goes to the app as `VITE_VAPID_PUBLIC_KEY`, and to the function
as `VAPID_PUBLIC_KEY`.

## What the app has to have

Neither transport can deliver to a device that never registered, and a device
cannot register without Firebase configured on its side:

- **Android** — `android/app/google-services.json`
- **iOS** — `ios/App/App/GoogleService-Info.plist`, an APNs `.p8` key uploaded
  to Firebase → Cloud Messaging, and the Push Notifications + Background Modes
  capabilities on the Xcode target

## Logs

```bash
firebase functions:log --only onNotificationCreated
```

Every delivery logs how many devices each transport reached. A notification
that reached zero of both is a device that never registered, not a broken
function.
