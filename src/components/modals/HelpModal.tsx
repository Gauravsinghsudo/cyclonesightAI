import React from 'react';
import { X, HelpCircle, Download, WifiOff, Layers, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      id="help-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">CYCLONE SIGHT AI Help & Documentation</h3>
              <p className="text-xs text-slate-400">PWA capabilities & meteorological telemetry guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-300">
          {/* PWA Section */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Download className="w-4 h-4 text-blue-400" />
              <span>Progressive Web App (PWA) Features</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              CYCLONE SIGHT AI is a fully certified PWA compliant with standalone installation on Android, iOS Safari, macOS, Windows, and ChromeOS. You can click the <strong>Install App</strong> button in the top bar to install it directly to your home screen or application dock.
            </p>
          </div>

          {/* Offline Section */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>Offline Resilience & Telemetry Caching</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When working in low-connectivity coastal disaster coordination zones, CYCLONE SIGHT AI’s integrated Service Worker precaches the latest radar snapshots, ensemble trajectories, and evacuation contact routes for seamless offline consultation.
            </p>
          </div>

          {/* Satellite IR color scale */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Infrared (IR) Cold Cloud Top Interpretation</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              White and deep-red colors represent intense convective cloud tops below -70°C to -80°C where violent updrafts and torrential rainbands occur. Orange and blue tones denote feeder bands and outer outflow cirrus shields.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
