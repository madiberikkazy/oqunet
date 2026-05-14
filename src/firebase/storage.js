// Firebase Storage helpers — uploads return a public URL.
// Falls back to data-URLs (in-memory) when Firebase isn't configured.

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "./config.js";

export async function uploadImage(file, path) {
  if (isFirebaseConfigured) {
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
