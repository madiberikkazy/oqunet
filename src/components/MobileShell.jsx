import BottomNav from "./BottomNav.jsx";

/**
 * MobileShell — full-screen, edge-to-edge layout.
 * No card chrome, no gray borders — white all the way.
 *
 * Responsive content column:
 *  • Mobile  (< 640 px) : full width, px-4
 *  • Tablet  (640–1023): max-w-xl centered, px-6
 *  • Desktop (≥ 1024 px): max-w-2xl centered, px-8
 *
 * Page content fades + slides in on every mount (route change).
 */
export default function MobileShell({ children, withNav = true, scrollable = true }) {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      <main
        className={
          "flex-1 w-full pt-4 page-transition " +
          (scrollable ? "overflow-y-auto no-scrollbar " : "") +
          (withNav ? "pb-24" : "pb-4")
        }
      >
        {/* Responsive centred column */}
        <div className="w-full mx-auto sm:max-w-xl lg:max-w-2xl">
          {children}
        </div>
      </main>
      {withNav ? <BottomNav /> : null}
    </div>
  );
}
