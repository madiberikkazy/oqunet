import { useEffect, useState } from 'react';
import { t } from '../utils/i18n.js';

function navOnline() {
  // navigator may be undefined in some test/SSR contexts; treat that as online.
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export default function OfflineIndicator() {
  const [showBanner, setShowBanner] = useState(!navOnline());

  useEffect(() => {
    const handleOnline = () => setShowBanner(false);
    const handleOffline = () => setShowBanner(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top fade-in duration-300">
      <div className="bg-red-500 text-white px-4 py-3 flex items-center gap-3 text-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
        <span className="text-[14px] font-medium">
          {t.offlineWarning}
        </span>
        <button
          onClick={() => setShowBanner(false)}
          className="ml-auto text-[20px] hover:opacity-80 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

