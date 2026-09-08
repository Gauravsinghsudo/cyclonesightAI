import React from 'react';
import { Bot, ChevronRight } from 'lucide-react';

interface FooterProps {
  onOpenDataSources: () => void;
  onOpenAICopilot: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDataSources,
  onOpenAICopilot,
}) => {
  return (
    <footer 
      id="app-status-footer"
      className="mt-6 border-t border-slate-800/80 bg-[#080d19] py-3.5 px-4 sm:px-6 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3"
    >
      {/* Left: Data Sources List */}
      <div className="flex items-center gap-1.5 flex-wrap text-center md:text-left">
        <span className="text-slate-300 font-medium">Data Sources:</span>
        <button
          onClick={onOpenDataSources}
          className="hover:text-blue-400 underline decoration-slate-700 hover:decoration-blue-400 transition cursor-pointer text-[11px]"
        >
          INSAT-3D, NOAA-20, HIMAWARI-9, Sentinel-1, ERA5, GFS, ECMWF, IMD Buoys, Argo Floats & more
        </button>
      </div>

      {/* Right: Version and AI Operational Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>CYCLONE SIGHT AI v2.0</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        </div>

        {/* AI Operational Badge */}
        <button
          onClick={onOpenAICopilot}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer text-emerald-400 text-xs font-medium shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Models: All Operational</span>
        </button>
      </div>
    </footer>
  );
};
