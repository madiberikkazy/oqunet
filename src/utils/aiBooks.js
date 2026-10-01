// The AI routes live on the same small server as push notifications. Keeping
// the API key there (rather than in a VITE_ variable) is non-negotiable: Vite
// deliberately ships VITE_ variables to every browser.
import { auth } from "../firebase/config.js";
import { shrinkImage, IMAGE_SIZES } from "./imageResize.js";

// The AI service normally shares the phone/push server. A separate origin is
// supported for deployments that scale image analysis independently.
const AI_SERVER = (import.meta.env?.VITE_AI_SERVER || import.meta.env?.VITE_PUSH_SERVER || "").replace(/\/+$/, "");

async function token() {
  const user = auth?.currentUser;
  if (!user) throw new Error("not-signed-in");
  return user.getIdToken();
}

async function post(path, body) {
  const idToken = await token();
  const response = await fetch(`${AI_SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `AI request failed (${response.status})`);
    error.code = data.error;
    throw error;
  }
  return data;
}

function asDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image-read-failed"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a cover with vision AI and returns the normalized fields a book form
 * understands. The shrink is for transport only; the original file remains
 * the cover that is uploaded when the admin saves the book.
 */
export async function scanBookCover(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("image-required");
  const analysisFile = await shrinkImage(file, { maxDimension: IMAGE_SIZES.cover });
  return post("/ai/book-intake", { imageDataUrl: await asDataUrl(analysisFile) });
}

/** Ask the protected server to choose books from the community shelf. */
export async function askBookFinder(question, books) {
  return post("/ai/book-search", {
    question: String(question || "").slice(0, 500),
    books: (books || []).slice(0, 100).map((book) => ({
      id: book.id,
      name: book.name || "",
      author: book.author || "",
      description: book.description || "",
      genres: book.genres || book.genre || [],
      language: book.language || "",
      status: book.status || "",
    })),
  });
}
