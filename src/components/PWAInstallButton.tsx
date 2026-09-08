import React, { useState } from 'react';
import { Download, Share, CheckCircle2, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useI18n } from '../i18n';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useI18n();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed standalone PWA, show a minimal badge or return null
  if (isInstalled) {
    return (
      <div 
        id="pwa-status-badge"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
        title="CYCLONE SIGHT AI is running in standalone PWA mode"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{t('installed')}</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        id="pwa-install-button"
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-md shadow-blue-900/30 transition-all active:scale-95 cursor-pointer border border-blue-400/30"
        aria-label="Install CYCLONE SIGHT AI Progressive Web App"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span className="hidden xs:inline font-semibold">{t('install')}</span>
        <span className="xs:hidden">{t('install')}</span>
      </button>

      {showGuide && (
        <div 
          id="pwa-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuide(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Install CYCLONE SIGHT AI PWA</h3>
                <p className="text-xs text-slate-400">Offline-capable cyclone intelligence app</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                <p className="font-medium text-white flex items-center gap-2">
                  <Share className="w-4 h-4 text-blue-400" />
                  Install on iOS Safari / iPad:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                  <li>
                    Tap the <strong className="text-white">Share</strong> button (box with upward arrow) in the Safari toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </li>
                  <li>
                    Confirm by tapping <strong className="text-white">Add</strong> in the top right.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                <p className="font-medium text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Install on Desktop / Android:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                  <li>
                    Click the <strong className="text-white">Install App</strong> icon in your browser address bar (or browser menu ⋮).
                  </li>
                  <li>
                    Select <strong className="text-white">Install CYCLONE SIGHT AI</strong> when prompted.
                  </li>
                  <li>
                    Launch CYCLONE SIGHT AI from your desktop or home screen for standalone full-screen monitoring!
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-xs text-white transition shadow-sm cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
