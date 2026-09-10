import React, { useMemo } from 'react';
import {
  Satellite,
  ExternalLink,
  Maximize2,
  Compass,
  MapPin,
  Gauge,
} from 'lucide-react';
import { CycloneData } from '../types';
import { LeafletCycloneMap } from './map/LeafletCycloneMap';

interface LiveSatelliteOverviewProps {
  cyclones: CycloneData[];
  selectedCycloneId: string | null;
  onSelectCyclone: (id: string) => void;
  onOpenFullMap: () => void;
}

export const LiveSatelliteOverview: React.FC<LiveSatelliteOverviewProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  onOpenFullMap,
}) => {
  const activeCyclone = useMemo(() => {
    return selectedCycloneId ? cyclones.find((c) => c.id === selectedCycloneId) || null : null;
  }, [cyclones, selectedCycloneId]);

  return (
    <div
      id="live-satellite-overview-panel"
      className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              INSAT-3DS Satellite &amp; Real Map of India
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              MOSDAC SCORPIO Live
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenFullMap}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer border border-slate-700 shadow-sm"
              title="Expand Full Screen Leaflet GIS Console"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen Map</span>
            </button>
          </div>
        </div>

        {/* Real Leaflet Cyclone Map */}
        <LeafletCycloneMap
          cyclones={cyclones}
          selectedCycloneId={selectedCycloneId}
          onSelectCyclone={onSelectCyclone}
          height="400px"
          showControls={true}
          emptyStateMessage="There are currently no active cyclones in the dashboard feed. Historical tracks are available in Cyclone Tracker and Historical Cyclones."
        />
      </div>

      {/* Footer telemetry summary */}
      <div className="mt-3 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        {activeCyclone ? <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Target: <strong className="text-white">{activeCyclone?.name}</strong> ({activeCyclone?.category})</span>
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Position: <strong className="text-white">{activeCyclone?.coordinates.latStr}, {activeCyclone?.coordinates.lngStr}</strong></span>
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Winds: <strong className="text-white">{activeCyclone?.maxWindKmh} km/h</strong></span>
          </span>
        </div> : <span className="text-slate-300">No active cyclone is currently being monitored.</span>}

        <a
          href="https://mosdac.gov.in/scorpio/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium hover:underline text-[11px]"
        >
          <span>ISRO MOSDAC SCORPIO Telemetry</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
