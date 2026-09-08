import React from 'react';
import { X, Wind, Gauge, Compass, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import { CycloneData } from '../../types';

interface CycloneDetailModalProps {
  cyclone: CycloneData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CycloneDetailModal: React.FC<CycloneDetailModalProps> = ({
  cyclone,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !cyclone) return null;

  const isRed = cyclone.categoryColor === 'red';

  return (
    <div 
      id="cyclone-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isRed 
                  ? 'bg-rose-600/20 border-rose-500/30 text-rose-400' 
                  : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Wind className="w-5 h-5 animate-[spin_6s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{cyclone.name}</h3>
                <span 
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isRed 
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' 
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {cyclone.category}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/50">
                  MOSDAC SCORPIO Archive
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{cyclone.basin} • Representative Position: {cyclone.coordinates.latStr}, {cyclone.coordinates.lngStr}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Status highlight */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{cyclone.statusDescription}</span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] text-slate-400">Max Sustained Wind</span>
              <div className="text-lg font-bold text-white mt-0.5">{cyclone.maxWindKmh} km/h</div>
              <div className="text-[10px] text-slate-400">~{cyclone.maxWindKnots} knots</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] text-slate-400">Central Pressure</span>
              <div className="text-lg font-bold text-white mt-0.5">{cyclone.pressureHpa} hPa</div>
              <div className="text-[10px] text-emerald-400 font-medium">Deepening rate -3hPa/6h</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] text-slate-400">Movement Vector</span>
              <div className="text-lg font-bold text-white mt-0.5">{cyclone.movement.direction}</div>
              <div className="text-[10px] text-slate-400">{cyclone.movement.speedKmh} km/h forward speed</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] text-slate-400">RI Index (24h)</span>
              <div className="text-lg font-bold text-rose-400 mt-0.5">{cyclone.riIndex}%</div>
              <div className="text-[10px] text-slate-400">Prob: {cyclone.riProbability24h}%</div>
            </div>
          </div>

          {/* Past & Forecast Waypoints Table */}
          <div>
            <span className="text-xs font-semibold text-slate-200 block mb-2">Track Waypoints & Projections</span>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Lat</th>
                    <th className="py-2 px-3">Lng</th>
                    <th className="py-2 px-3">Est. Wind</th>
                    <th className="py-2 px-3">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                  {cyclone.trajectoryPoints.map((tp) => (
                    <tr key={tp.time} className={tp.time === 'Now' ? 'bg-blue-900/20 font-bold text-white' : ''}>
                      <td className="py-1.5 px-3">{tp.time}</td>
                      <td className="py-1.5 px-3">{tp.lat.toFixed(1)}°N</td>
                      <td className="py-1.5 px-3">{tp.lng.toFixed(1)}°E</td>
                      <td className="py-1.5 px-3">{tp.windSpeedKmh} km/h</td>
                      <td className="py-1.5 px-3 font-sans text-[10px]">
                        {tp.time.includes('(Fcst)') || tp.time.startsWith('+') ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-medium">MOSDAC Forecast</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">Observed Track</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
