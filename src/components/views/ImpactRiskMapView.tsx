import React from 'react';
import { ShieldAlert, AlertOctagon, Anchor, Users, Waves, MapPin, CheckCircle } from 'lucide-react';
import { CycloneData } from '../../types';
import { InteractiveCycloneMap } from '../map/InteractiveCycloneMap';

interface ImpactRiskMapViewProps {
  cyclones: CycloneData[];
  selectedCycloneId: string | null;
  onSelectCyclone: (id: string) => void;
}

export const ImpactRiskMapView: React.FC<ImpactRiskMapViewProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
}) => {
  const activeCyclone = cyclones.find((c) => c.id === selectedCycloneId) || cyclones[0] || null;

  const portWarnings = [
    { port: 'Dhamra Port', state: 'Odisha', signal: 'Signal No. 10 (Great Danger)', status: 'Operations Suspended' },
    { port: 'Paradip Port', state: 'Odisha', signal: 'Signal No. 10 (Great Danger)', status: 'Vessels Moved to Anchorage' },
    { port: 'Haldia Port', state: 'West Bengal', signal: 'Signal No. 9 (Great Danger)', status: 'Cargo Discharging Halted' },
    { port: 'Kolkata Port', state: 'West Bengal', signal: 'Signal No. 8 (Danger Signal)', status: 'River Pilots on Standby' },
    { port: 'Gopalpur Port', state: 'Odisha', signal: 'Signal No. 4 (Local Cautionary)', status: 'Monitoring Track' },
    { port: 'Visakhapatnam', state: 'Andhra Pradesh', signal: 'Signal No. 3 (Local Cautionary)', status: 'Normal Caution' },
  ];

  const highRiskDistricts = [
    { name: 'Bhadrak', state: 'Odisha', surge: '2.0m - 3.5m', evacuees: '185,000 evacuated', alert: 'Red Alert' },
    { name: 'Kendrapara', state: 'Odisha', surge: '2.5m - 4.0m', evacuees: '220,000 evacuated', alert: 'Red Alert' },
    { name: 'Balasore', state: 'Odisha', surge: '1.8m - 3.0m', evacuees: '140,000 evacuated', alert: 'Red Alert' },
    { name: 'East Medinipur', state: 'West Bengal', surge: '1.5m - 2.5m', evacuees: '95,000 evacuated', alert: 'Orange Alert' },
    { name: 'Jagatsinghpur', state: 'Odisha', surge: '1.5m - 2.8m', evacuees: '110,000 evacuated', alert: 'Red Alert' },
  ];

  return (
    <div id="impact-risk-map-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Coastal Impact &amp; Storm Surge Inundation Assessment
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution coastal risk modeling, storm surge heights &amp; port hazard warnings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold animate-pulse">
            Active Hazard Warning
          </span>
        </div>
      </div>

      {/* Map with Inundation Overlay */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Coastal Inundation &amp; Storm Surge GIS Map
            </h2>
          </div>
          <span className="text-xs text-rose-400 font-semibold">Max Estimated Surge: 4.0m above astronomical tide</span>
        </div>

        <InteractiveCycloneMap
          cyclones={cyclones}
          selectedCycloneId={selectedCycloneId}
          onSelectCyclone={onSelectCyclone}
          height="460px"
          showControls={true}
        />
      </div>

      {/* Grid: Port Warnings + Evacuation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Port Warning Signals */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Anchor className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Official IMD Port Warning Signals (1-11 System)
            </h2>
          </div>

          <div className="space-y-3">
            {portWarnings.map((port, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{port.port}</div>
                  <span className="text-slate-400">{port.state}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-400">{port.signal}</div>
                  <span className="text-[11px] text-slate-400">{port.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Districts & Inundation */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              District Evacuation &amp; Inundation Hazard
            </h2>
          </div>

          <div className="space-y-3">
            {highRiskDistricts.map((dist, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{dist.name}</div>
                  <span className="text-slate-400">{dist.state} • Surge: <span className="text-rose-400 font-semibold">{dist.surge}</span></span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                    {dist.alert}
                  </span>
                  <div className="text-[11px] text-emerald-400 font-medium mt-1">{dist.evacuees}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
