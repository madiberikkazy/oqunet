/**
 * Sign in with Apple inside the native builds.
 *
 * Like googleAuth.js, this uses @capacitor-firebase/authentication to trigger the OS-level
 * native Apple sign-in sheet, instead of opening a web popup (which is blocked in WebViews).
 */

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { isNative, hasPlugin } from "./platform.js";

/** Is the native Apple picker available? */
export const hasNativeAppleAuth = isNative && hasPlugin("FirebaseAuthentication");

/**
 * Run the OS account picker and return a Firebase credential.
 *
 * @returns {Promise<import("firebase/auth").OAuthCredential | null>}
 */
export async function appleCredential() {
  const { OAuthProvider } = await import("firebase/auth");

  const result = await FirebaseAuthentication.signInWithApple();
  const idToken = result?.credential?.idToken;
  if (!idToken) return null;

  // The nonce and rawNonce are required to safely link the native Apple sign-in with Firebase Auth
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken,
    rawNonce: result.credential.nonce
  });
  
  return credential;
}
