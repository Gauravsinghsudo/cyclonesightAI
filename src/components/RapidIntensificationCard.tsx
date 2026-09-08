import React from 'react';
import { AlertTriangle, ArrowRight, Wind, ShieldCheck } from 'lucide-react';
import { CycloneData } from '../types';

interface RapidIntensificationCardProps {
  activeCyclone?: CycloneData | null;
  onViewAll: () => void;
}

export const RapidIntensificationCard: React.FC<RapidIntensificationCardProps> = ({
  activeCyclone,
  onViewAll,
}) => {
  const riIndex = activeCyclone?.riIndex ?? 72;
  const probability24h = activeCyclone?.riProbability24h ?? 64;
  const isHighRisk = riIndex >= 60;

  const keyFactors = [
    'Low Vertical Wind Shear',
    'MOSDAC TCHCP Ocean Heat > 80 kJ/cm²',
    'Upper-level Divergence',
    'INSAT Cold Cloud Core < -75°C',
  ];

  // Radial progress calculations (circle with radius 26)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probability24h / 100) * circumference;

  return (
    <div 
      id="rapid-intensification-panel"
      className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Rapid Intensification Risk (RI)
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Telemetry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alert Box: Dynamic Risk Level */}
        <div 
          id="ri-alert-box"
          className={`rounded-xl p-3.5 mb-4 border ${
            isHighRisk
              ? 'bg-rose-950/25 border-rose-600/30'
              : 'bg-amber-950/25 border-amber-600/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isHighRisk ? 'bg-rose-600/20 text-rose-400' : 'bg-amber-600/20 text-amber-400'
                }`}
              >
                {isHighRisk ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <div>
                <span className={`text-xs font-bold block ${isHighRisk ? 'text-rose-400' : 'text-amber-400'}`}>
                  {isHighRisk ? 'Elevated RI Risk Potential' : 'Moderate Intensification'}
                </span>
                <span className="text-[11px] text-slate-300">
                  {activeCyclone?.name || 'Tropical System'} • {activeCyclone?.basin || 'Indian Ocean'}
                </span>
              </div>
            </div>
            <Wind className={`w-4 h-4 ${isHighRisk ? 'text-rose-400/80' : 'text-amber-400/80'}`} />
          </div>
        </div>

        {/* RI Metrics: RI Index & Radial Probability Ring */}
        <div className="grid grid-cols-2 gap-3 items-center mb-4">
          {/* RI Index */}
          <div>
            <span className="text-[11px] text-slate-400 block">MOSDAC RI Index</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{riIndex}%</div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  isHighRisk
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
                style={{ width: `${riIndex}%` }}
              ></div>
            </div>
          </div>

          {/* Probability (Next 24h) with circular ring */}
          <div className="flex items-center justify-end gap-2.5">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">24h Probability</span>
              <span className="text-lg sm:text-xl font-bold text-white block">{probability24h}%</span>
            </div>

            {/* Circular Progress SVG */}
            <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={isHighRisk ? '#f43f5e' : '#f59e0b'}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Key Diagnostic Factors */}
        <div>
          <span className="text-[10px] text-slate-400 font-medium block mb-2">MOSDAC Diagnostic Predictors</span>
          <div className="flex flex-wrap gap-1.5">
            {keyFactors.map((factor) => (
              <span
                key={factor}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-medium text-slate-300"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom ETA Banner */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400">Peak Phase:</span>
        <span className="font-semibold text-amber-400">
          Max Wind {activeCyclone?.maxWindKmh || 95} km/h ({activeCyclone?.maxWindKnots || 50} kt)
        </span>
      </div>
    </div>
  );
};
