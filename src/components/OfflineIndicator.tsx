import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [checkedAt, setCheckedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setCheckedAt(new Date());
      setIsSyncing(false);
    }, 800);
  };

  if (isOnline) {
    return null;
  }

  return (
    <div 
      id="offline-indicator-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-amber-600/95 backdrop-blur-md border border-amber-400/40 px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <WifiOff className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-white">Offline Mode Active</p>
        <p className="text-[11px] text-amber-100">Service Worker caching active. Real-time data cached at {checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
      </div>
      <button
        onClick={handleRefresh}
        disabled={isSyncing}
        className="ml-2 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 border border-white/20 text-xs text-white flex items-center gap-1.5 transition cursor-pointer"
        title="Check connection"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
};
