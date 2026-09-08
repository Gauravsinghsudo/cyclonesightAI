import React from 'react';
import { ArrowRight, Wind } from 'lucide-react';
import { CycloneData } from '../types';

interface ActiveCyclonesCardProps {
  cyclones: CycloneData[];
  selectedCycloneId: string | null;
  onSelectCyclone: (id: string) => void;
  onViewAll: () => void;
  onOpenTracker: () => void;
}

export const ActiveCyclonesCard: React.FC<ActiveCyclonesCardProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  onViewAll,
  onOpenTracker,
}) => {
  return (
    <div 
      id="active-cyclones-panel"
      className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Active Cyclones
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cyclones List */}
        {cyclones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-center">
            <Wind className="mx-auto mb-2 h-5 w-5 text-slate-500" />
            <p className="text-sm font-semibold text-slate-200">No active cyclones</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Archived storms are available in Cyclone Tracker and Historical Cyclones.</p>
          </div>
        ) : <div className="space-y-3">
          {cyclones.map((cyclone) => {
            const isRed = cyclone.categoryColor === 'red';
            const isSelected = selectedCycloneId === cyclone.id;

            return (
              <div
                key={cyclone.id}
                id={`cyclone-item-${cyclone.id.toLowerCase()}`}
                onClick={() => onSelectCyclone(cyclone.id)}
                className={`rounded-xl border p-3.5 sm:p-4 transition-all cursor-pointer ${
                  isSelected
                    ? isRed 
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30'
                      : 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Top row: Icon, Name, Category Pill, Sparkline */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Cyclone swirl badge */}
                    <div 
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isRed
                          ? 'bg-rose-600/20 border-rose-500/30 text-rose-400'
                          : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      <Wind className="w-4 h-4 animate-[spin_8s_linear_infinite]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {cyclone.name}
                        </span>
                        <span 
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isRed 
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' 
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {cyclone.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{cyclone.basin}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-mono">{cyclone.coordinates.latStr}, {cyclone.coordinates.lngStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline track trajectory mini graph */}
                  <div className="hidden xs:block">
                    <svg className="w-20 h-9 overflow-visible" viewBox="0 0 80 36">
                      <path
                        d={
                          isRed
                            ? 'M 5 30 Q 25 24, 45 15 T 75 6'
                            : 'M 5 8 Q 30 16, 50 24 T 75 30'
                        }
                        fill="none"
                        stroke={isRed ? '#ef4444' : '#10b981'}
                        strokeWidth="2"
                        strokeDasharray={isSelected ? 'none' : '2 1'}
                      />
                      {/* Dots on the sparkline */}
                      {isRed ? (
                        <>
                          <circle cx="5" cy="30" r="2.5" fill="#f87171" />
                          <circle cx="28" cy="23" r="2.5" fill="#f87171" />
                          <circle cx="50" cy="14" r="2.5" fill="#f87171" />
                          <circle cx="75" cy="6" r="3.5" fill="#ef4444" className="animate-pulse" />
                        </>
                      ) : (
                        <>
                          <circle cx="5" cy="8" r="2.5" fill="#34d399" />
                          <circle cx="28" cy="15" r="2.5" fill="#34d399" />
                          <circle cx="50" cy="24" r="2.5" fill="#34d399" />
                          <circle cx="75" cy="30" r="3.5" fill="#10b981" className="animate-pulse" />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Bottom row metrics: Max Wind, Pressure, Movement */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Wind</span>
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {cyclone.maxWindKmh} km/h
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pressure</span>
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {cyclone.pressureHpa} hPa
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Movement</span>
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {cyclone.movement.direction} {cyclone.movement.speedKmh} km/h
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </div>

      {/* View Cyclone Tracker Full Button */}
      <button
        id="btn-open-cyclone-tracker"
        onClick={onOpenTracker}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-[0.99]"
      >
        <span>View Cyclone Tracker</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
