import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, ChevronRight, Info, Sparkles } from 'lucide-react';
import { CycloneData } from '../types';
import { buildCyclogenesisOutlook, ForecastProfile } from '../services/personalizedForecastModel';

interface CyclogenesisOutlookCardProps {
  currentCyclone: CycloneData | null;
  historicalCyclones: CycloneData[];
  onOpenForecastModels: () => void;
}

export const CyclogenesisOutlookCard: React.FC<CyclogenesisOutlookCardProps> = ({
  currentCyclone,
  historicalCyclones,
  onOpenForecastModels,
}) => {
  const [profile, setProfile] = useState<ForecastProfile>(() => {
    const saved = localStorage.getItem('cycloneai_forecast_profile');
    return saved === 'cautious' || saved === 'early-warning' ? saved : 'balanced';
  });

  useEffect(() => {
    localStorage.setItem('cycloneai_forecast_profile', profile);
  }, [profile]);

  const outlook = useMemo(
    () => buildCyclogenesisOutlook(currentCyclone, historicalCyclones, profile),
    [currentCyclone, historicalCyclones, profile],
  );
  const levelStyles = outlook.level === 'High'
    ? { panel: 'border-rose-700/50 bg-rose-950/40', text: 'text-rose-300' }
    : outlook.level === 'Elevated'
      ? { panel: 'border-amber-700/50 bg-amber-950/40', text: 'text-amber-300' }
      : { panel: 'border-emerald-700/50 bg-emerald-950/40', text: 'text-emerald-300' };

  return (
    <section id="cyclogenesis-outlook" className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/15 text-violet-300">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">Future Cyclone Formation Outlook</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-950/60 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                <Sparkles className="h-3 w-3" /> Personalized AI model
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Local screening of focused telemetry and historical MOSDAC trajectories for the next 72 hours.</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          Sensitivity
          <select value={profile} onChange={(event) => setProfile(event.target.value as ForecastProfile)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none">
            <option value="cautious">Cautious</option>
            <option value="balanced">Balanced</option>
            <option value="early-warning">Early-warning</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr_1fr] md:items-center">
        <div className={`min-w-[150px] rounded-xl border px-4 py-3 ${levelStyles.panel}`}>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Formation likelihood</span>
          <span className={`mt-1 block text-3xl font-bold ${levelStyles.text}`}>{outlook.probability}%</span>
          <span className={`text-xs font-semibold ${levelStyles.text}`}>{outlook.level} screening signal</span>
          <span className="mt-1 block text-[10px] text-slate-400">Local-model confidence: {outlook.confidence}%</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current signal</span>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">{outlook.currentSignal}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Historical baseline</span>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">{outlook.historicalSignal}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          Trained locally on {outlook.historicalSamples} archived tracks. Decision support only—not an official IMD/MOSDAC forecast or warning.
        </p>
        <button onClick={onOpenForecastModels} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">
          Open model details <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
};
