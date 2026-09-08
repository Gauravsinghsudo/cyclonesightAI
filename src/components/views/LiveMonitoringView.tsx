import React, { useEffect, useState } from 'react';
import { Radio, Satellite, RefreshCw, Compass, Shield, Wind, ExternalLink, MapPin, Database } from 'lucide-react';
import { CycloneData } from '../../types';
import { LeafletCycloneMap } from '../map/LeafletCycloneMap';
import { convertMosdacTrackToCycloneData, getMosdacLiveTrack } from '../../services/mosdacService';

interface LiveMonitoringViewProps {
  cyclones: CycloneData[];
  selectedCycloneId: string | null;
  onSelectCyclone: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  mosdacAlertText: string;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  onRefresh,
  isRefreshing,
  mosdacAlertText,
}) => {
  const [liveCyclones, setLiveCyclones] = useState<CycloneData[]>([]);
  const noActiveCyclone = /no\s+(active\s+)?cyclone/i.test(mosdacAlertText);

  useEffect(() => {
    let cancelled = false;
    if (noActiveCyclone) {
      setLiveCyclones([]);
      return () => { cancelled = true; };
    }

    getMosdacLiveTrack().then((track) => {
      if (cancelled) return;
      setLiveCyclones(track ? [convertMosdacTrackToCycloneData('LIVE', track)] : []);
    });
    return () => { cancelled = true; };
  }, [mosdacAlertText, noActiveCyclone]);

  const activeCyclone = liveCyclones[0] || null;

  return (
    <div id="live-monitoring-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Live Satellite &amp; Real Map of India Monitoring Console
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time multi-spectral INSAT-3DS/3DR observations &amp; MOSDAC SCORPIO cyclogenesis tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          <a
            href="https://mosdac.gov.in/scorpio/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>MOSDAC Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Large Full-Width Visible & Understandable Map */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Leaflet Real Map of India &amp; North Indian Ocean GIS Radar
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            {activeCyclone ? (
              <>Active Storm Focus: <span className="text-cyan-400 font-bold">{activeCyclone.name}</span></>
            ) : (
              <span className="text-slate-400">SCORPIO status: No active cyclone</span>
            )}
          </div>
        </div>

        <LeafletCycloneMap
          cyclones={liveCyclones}
          selectedCycloneId={activeCyclone?.id || null}
          onSelectCyclone={onSelectCyclone}
          height="540px"
          showControls={true}
          emptyStateMessage={mosdacAlertText}
        />
      </div>

      {/* Real-time Basin Status & Sensor Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sensor 1 */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1">
            <Satellite className="w-4 h-4" />
            <span>INSAT-3DS Imager Payload</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">4km Resolution Standard Scan</div>
          <div className="text-xs text-slate-400 mt-1">
            6 Multi-Spectral Channels: TIR1 (10.8µ), TIR2 (12.0µ), MIR (3.9µ), WV (6.8µ), VIS (0.65µ), SWIR (1.6µ).
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Cadence: 15 minutes</span>
            <span className="text-emerald-400 font-medium">Nominal Orbit</span>
          </div>
        </div>

        {/* Sensor 2 */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <Wind className="w-4 h-4" />
            <span>EOS-06 Scatterometer (SCAT)</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">Ocean Surface Wind Vectors</div>
          <div className="text-xs text-slate-400 mt-1">
            Measures 10-meter neutral equivalent winds across Bay of Bengal and Arabian Sea at 25km/50km swath grid.
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Swath Width: 1400 km</span>
            <span className="text-emerald-400 font-medium">Active Pass</span>
          </div>
        </div>

        {/* Sensor 3 */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
            <Shield className="w-4 h-4" />
            <span>MOSDAC TCHCP Ocean Heat</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">Tropical Cyclone Heat Potential</div>
          <div className="text-xs text-slate-400 mt-1">
            Derived from satellite altimetry &amp; SST, measuring energy content from surface to 26°C isotherm depth.
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Energy Threshold: &gt; 80 kJ/cm²</span>
            <span className="text-amber-400 font-medium">High Heat Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
