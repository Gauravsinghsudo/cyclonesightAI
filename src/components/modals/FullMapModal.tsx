import React from 'react';
import { X, Layers, Database, ExternalLink } from 'lucide-react';
import { CycloneData } from '../../types';
import { LeafletCycloneMap } from '../map/LeafletCycloneMap';

interface FullMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  cyclones: CycloneData[];
  onSelectCyclone: (id: string) => void;
}

export const FullMapModal: React.FC<FullMapModalProps> = ({
  isOpen,
  onClose,
  cyclones,
  onSelectCyclone,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="full-map-modal"
      className="fixed inset-0 z-[2000] isolate flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl h-[92vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  MOSDAC SCORPIO Leaflet Synoptic GIS &amp; Satellite Radar
                </h3>
                <a
                  href="https://mosdac.gov.in/scorpio/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                >
                  <Database className="w-3 h-3" />
                  <span>mosdac.gov.in/scorpio/</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-xs text-slate-400">
                Live Leaflet GIS Basemap with Verified ISRO MOSDAC Track Coordinates &amp; Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Map Canvas */}
        <div className="flex-1 w-full p-3 bg-[#050a14] overflow-hidden flex flex-col">
          <LeafletCycloneMap
            cyclones={cyclones}
            selectedCycloneId={cyclones[0]?.id}
            onSelectCyclone={onSelectCyclone}
            height="100%"
            showControls={true}
            emptyStateMessage="There are no active cyclones in the live dashboard feed. Use Cyclone Tracker to explore archived tracks."
          />
        </div>
      </div>
    </div>
  );
};
