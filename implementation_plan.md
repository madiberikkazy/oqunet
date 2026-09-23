# Implementation Plan: App Store Review Fixes

## 1. Goal Description
Fix the issues identified by Apple App Store Review in Guideline 4.8 (Login Services) and Guideline 1.2 (User-Generated Content). This will involve adding "Sign in with Apple", enforcing EULA agreement before any sign up/login, translating the EULA to English, and adding the ability to report/block users directly from the chat screen.

## 2. Proposed Changes

### Guideline 4.8: Sign In With Apple
- **[MODIFY] `capacitor.config.json`**: Add `"apple.com"` to the `FirebaseAuthentication` providers.
- **[NEW] `src/native/appleAuth.js`**: Create a helper similar to `googleAuth.js` to handle native Apple Sign In using `@capacitor-firebase/authentication`.
- **[MODIFY] `src/firebase/auth.js`**: Add `signInWithApple()` using `appleAuth.js` for native iOS and `OAuthProvider('apple.com')` for web/Android.
- **[MODIFY] `src/pages/auth/Login.jsx` & `Register.jsx`**: Add a "Sign in with Apple" button below the Google button. Conditionally show it via `isNative` (or specifically `isIOS`).
- **[MODIFY] `ios/App/App/App.entitlements`**: Add the "Sign in with Apple" entitlement (`com.apple.developer.applesignin`).
- **[MODIFY] `ios/App/App.xcodeproj/project.pbxproj`**: Ensure the entitlements file is linked.

### Guideline 1.2: EULA and Moderation
- **[MODIFY] `src/content/terms.js`**: Update to support English translation (`getTermsSections(lang)`) and explicitly include the keyword "End User License Agreement (EULA)" and Apple's required wording: "There is no tolerance for objectionable content or abusive users."
- **[MODIFY] `scripts/build-legal.mjs`**: Update script to generate both RU and EN HTML terms or a dual-language `terms.html`.
- **[MODIFY] `src/components/TermsDialog.jsx`**: Pass the current language to fetch the correct translated sections.
- **[MODIFY] `src/pages/auth/Register.jsx`**: Move the `acceptedTerms` checkbox from Step 3 to Step 1. Enforce that it must be checked before proceeding to Step 2 or before clicking Google/Apple Sign In.
- **[MODIFY] `src/pages/auth/Login.jsx`**: Add a prominent disclaimer below the login buttons explicitly stating that logging in constitutes agreement to the EULA and Privacy Policy, and re-stating the zero-tolerance policy. Add a link to open `TermsDialog.jsx`.
- **[MODIFY] `src/pages/user/Chat.jsx`**: Add the `ModerationMenu` component to the chat header (next to the invite button) to allow users to Report or Block the person they are chatting with, fulfilling the UGC reporting requirement for all areas of the app.

## 3. Verification Plan
- Build and run the web version to test the UI changes (Terms checkbox on Register, disclaimer on Login, Apple button).
- Generate the new `terms.html` and verify the English translation contains the required EULA phrases.
- Check `Chat.jsx` to ensure the 3-dot Moderation menu appears and opens the report sheet or block modal.
- Test that clicking Google/Apple Sign In without checking the terms box correctly throws an error.
