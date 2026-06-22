import { useState } from "react";
import { safeImageUrl } from "../utils/validators.js";

/**
 * Avatar — falls back to initials whenever:
 *   - no src was provided
 *   - the src isn't an http/https/data:image URL (blocks `javascript:` etc.)
 *   - the image fails to load (404, CORS, etc.)
 */
export default function Avatar({ src, name, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const safeSrc = safeImageUrl(src);

  const initials =
    (name || "?")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  if (safeSrc && !broken) {
    return (
      <img
        src={safeSrc}
        alt={name || ""}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
        loading="lazy"
        className="rounded-full object-cover bg-ink-100"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-semibold"
      aria-label={name || ""}
    >
      {initials}
    </div>
  );
}
