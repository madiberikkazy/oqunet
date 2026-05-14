import BottomNav from "./BottomNav.jsx";

/**
 * MobileShell — centered mobile-app frame.
 * No status bar or label above; content starts immediately at the top of the card.
 */
export default function MobileShell({ children, withNav = true, scrollable = true }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-8 px-2">
      <div className="mobile-shell flex flex-col w-full rounded-[28px] overflow-hidden">
        <main
          className={
            "flex-1 pt-4 " +
            (scrollable ? "overflow-y-auto no-scrollbar " : "") +
            (withNav ? "pb-24" : "pb-4")
          }
        >
          {children}
        </main>
        {withNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
