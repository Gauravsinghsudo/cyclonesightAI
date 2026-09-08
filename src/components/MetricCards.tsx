import React from 'react';
import { Wind, Bell, Zap, Radio, ArrowRight } from 'lucide-react';

interface MetricCardsProps {
  activeCycloneCount: number;
  alertsCount: number;
  riRiskCount: number;
  dataSourcesOnline: number;
  totalDataSources: number;
  onViewCyclones: () => void;
  onViewAlerts: () => void;
  onViewRI: () => void;
  onViewDataSources: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  activeCycloneCount,
  alertsCount,
  riRiskCount,
  dataSourcesOnline,
  totalDataSources,
  onViewCyclones,
  onViewAlerts,
  onViewRI,
  onViewDataSources,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Active Cyclones */}
      <div 
        id="metric-card-active-cyclones"
        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
            <Wind className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Active Cyclones</span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-white">{activeCycloneCount}</div>
            <div className="mt-0.5 text-xs text-slate-400">In Indian Ocean</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
          <button 
            onClick={onViewCyclones}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer group/btn"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Card 2: Cyclone Alerts */}
      <div 
        id="metric-card-cyclone-alerts"
        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Cyclone Alerts</span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-white">{alertsCount}</div>
            <div className="mt-0.5 text-xs text-slate-400">Requires Attention</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
          <button 
            onClick={onViewAlerts}
            className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer group/btn"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Card 3: Rapid Intensification Risk */}
      <div 
        id="metric-card-ri-risk"
        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Rapid Intensification Risk</span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-white">{riRiskCount}</div>
            <div className="mt-0.5 text-xs text-rose-400 font-medium">High Risk Detected</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
          <button 
            onClick={onViewRI}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer group/btn"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Card 4: Data Sources */}
      <div 
        id="metric-card-data-sources"
        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 border border-teal-500/30 text-teal-400 group-hover:scale-105 transition-transform">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Data Sources</span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-white">
              {dataSourcesOnline} / {totalDataSources}
            </div>
            <div className="mt-0.5 text-xs text-emerald-400 font-medium">All Online</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
          <button 
            onClick={onViewDataSources}
            className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer group/btn"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
