import React from 'react';
import { ArrowRight, Home } from 'lucide-react';
import { ImpactArea } from '../types';

interface ImpactOverviewCardProps {
  impactAreas: ImpactArea[];
  onOpenRiskMap: () => void;
}

export const ImpactOverviewCard: React.FC<ImpactOverviewCardProps> = ({
  impactAreas,
  onOpenRiskMap,
}) => {
  const riskScore = 72; // Out of 100

  // Semi-circle gauge math
  // Arc from 180° (left) to 360° / 0° (right)
  const radius = 64;
  const strokeWidth = 10;
  const arcLength = Math.PI * radius; // 180 deg circumference
  const filledLength = (riskScore / 100) * arcLength;
  const remainingLength = arcLength - filledLength;

  return (
    <div 
      id="impact-overview-panel"
      className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Impact Overview
          </h2>
          <button
            onClick={onOpenRiskMap}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>View Risk Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Semi-circular Speedometer / Risk Gauge */}
        <div className="relative flex flex-col items-center justify-center my-1 select-none">
          <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
            <defs>
              <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Background Arc */}
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Filled Progress Arc */}
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke="url(#gauge-grad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${filledLength} ${remainingLength + 10}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>

          {/* Centered Numbers */}
          <div className="absolute top-10 flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-medium">Risk Score</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold text-white">{riskScore}</span>
              <span className="text-xs text-slate-400 font-medium">/100</span>
            </div>
            <span className="text-xs font-bold text-rose-400 -mt-0.5">High</span>
          </div>
        </div>

        {/* Potentially Affected Areas List */}
        <div className="mt-2 space-y-2">
          <div className="text-[11px] font-medium text-slate-400">
            Potentially Affected Areas
          </div>

          <div className="space-y-1.5">
            {impactAreas.map((area) => {
              const getRiskColor = (lvl: string) => {
                switch (lvl) {
                  case 'High':
                    return 'text-rose-400';
                  case 'Moderate':
                    return 'text-amber-400';
                  case 'Low':
                    return 'text-emerald-400';
                  default:
                    return 'text-slate-300';
                }
              };

              return (
                <div
                  key={area.id}
                  className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-sm">🏠</span>
                    <span className="font-medium text-slate-200">{area.name}</span>
                  </div>
                  <span className={`font-semibold ${getRiskColor(area.riskLevel)}`}>
                    {area.riskLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action button: View Impact & Risk Map */}
      <button
        id="btn-view-impact-risk-map"
        onClick={onOpenRiskMap}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-[0.99]"
      >
        <span>View Impact & Risk Map</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
