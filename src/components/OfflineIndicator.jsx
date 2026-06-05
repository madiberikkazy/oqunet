import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(!isOffline());
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

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
          Вы в режиме оффлайн. Некоторые функции недоступны.
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

function isOffline() {
  return !navigator.onLine;
}
