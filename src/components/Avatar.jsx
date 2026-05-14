export default function Avatar({ src, name, size = 40 }) {
  const initials =
    (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  if (src) {
    return (
      <img src={src} alt={name} style={{ width: size, height: size }}
        className="rounded-full object-cover bg-ink-100" />
    );
  }
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-semibold">
      {initials}
    </div>
  );
}
