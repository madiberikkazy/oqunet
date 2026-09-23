# App Store Fixes Walkthrough

All issues cited in the App Store rejection have been addressed.

## Guideline 4.8: Sign In With Apple
- Enabled `apple.com` provider in `capacitor.config.json`.
- Implemented `appleAuth.js` which natively invokes `@capacitor-firebase/authentication` to present the native Apple sign-in sheet on iOS without WebViews.
- Hooked up `signInWithApple()` in `auth.js` to correctly normalize names, check for duplicates, and save the `acceptedTerms` flag on signup.
- Added native-only "Sign in with Apple" buttons in both `Login.jsx` and `Register.jsx`.
- Injected `App.entitlements` configuring `com.apple.developer.applesignin` so the binary compiles with the correct capabilities.

## Guideline 1.2: User-Generated Content & EULA
- **EULA Phrasing:** Added the exact required legal clause ("there is no tolerance for objectionable content or abusive users") in both English and Russian, updating `terms.js`.
- **EULA Up-front:** Relocated the terms acceptance checkbox in `Register.jsx` to Step 1 (above the email/social buttons). You cannot create an account without checking the box.
- **Login Disclaimer:** Placed a prominent statement on `Login.jsx` that authenticating constitutes agreement to the EULA, along with the zero-tolerance clause.
- **Reporting & Blocking:** Injected the `ModerationMenu` component into the chat screen (`Chat.jsx`) so users can now actively report or block abusive participants.
- **English Web Version:** Re-compiled `public/terms.html` to display the English variant so App Store reviewers reviewing your support/legal URL see the mandatory EULA clauses immediately.
