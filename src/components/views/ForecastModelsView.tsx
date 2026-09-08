import React, { useEffect, useMemo, useState } from 'react';
import { Layers, CheckCircle2, BrainCircuit } from 'lucide-react';
import { CycloneData } from '../../types';
import { buildPersonalizedForecast, ForecastProfile } from '../../services/personalizedForecastModel';

interface ForecastModelsViewProps {
  activeCyclone?: CycloneData | null;
}

export const ForecastModelsView: React.FC<ForecastModelsViewProps> = ({ activeCyclone }) => {
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [forecastProfile, setForecastProfile] = useState<ForecastProfile>(() => {
    const saved = localStorage.getItem('cycloneai_forecast_profile');
    return saved === 'cautious' || saved === 'early-warning' ? saved : 'balanced';
  });

  useEffect(() => {
    localStorage.setItem('cycloneai_forecast_profile', forecastProfile);
  }, [forecastProfile]);

  const personalizedForecast = useMemo(
    () => buildPersonalizedForecast(activeCyclone, forecastProfile),
    [activeCyclone, forecastProfile]
  );

  const models = [
    {
      id: 'mosdac-eps',
      name: 'MOSDAC SCORPIO EPS',
      agency: 'ISRO SAC (Space Applications Centre)',
      resolution: '4 km Convection Permitting',
      landfallLocation: 'Between Dhamra and Balasore (Odisha)',
      landfallEta: '24 Oct 2024, 23:30 - 01:30 IST',
      landfallWind: '110-120 km/h (Gale gusts 135 km/h)',
      trackConfidence: 'High (Cluster consensus 88%)',
      color: 'border-slate-800 bg-slate-900/90 text-slate-300',
    },
    {
      id: 'imd-gfs',
      name: 'IMD GFS T1534',
      agency: 'India Meteorological Department (MoES)',
      resolution: '12 km Global Grid',
      landfallLocation: 'Near Chandbali / Dhamra Port (Odisha)',
      landfallEta: '25 Oct 2024, 01:00 IST',
      landfallWind: '105-115 km/h',
      trackConfidence: 'High (0.87 correlation)',
      color: 'border-slate-800 bg-slate-900/90 text-slate-300',
    },
    {
      id: 'ncmrwf-um',
      name: 'NCMRWF Unified Model (NCUM)',
      agency: 'Ministry of Earth Sciences, Noida',
      resolution: '8 km Regional High-Res',
      landfallLocation: 'North of Paradip Port (Odisha)',
      landfallEta: '24 Oct 2024, 22:45 IST',
      landfallWind: '115-125 km/h',
      trackConfidence: 'Very High',
      color: 'border-slate-800 bg-slate-900/90 text-slate-300',
    },
    {
      id: 'ecmwf',
      name: 'ECMWF IFS HRES',
      agency: 'European Centre for Medium-Range Forecasts',
      resolution: '9 km Global Ensemble',
      landfallLocation: 'Bhitarkanika / Dhamra Coast',
      landfallEta: '25 Oct 2024, 02:15 IST',
      landfallWind: '110 km/h',
      trackConfidence: 'High',
      color: 'border-slate-800 bg-slate-900/90 text-slate-300',
    },
    {
      id: 'personalized-ml',
      name: 'Personalized TrackTrend ML',
      agency: 'On-device calibration using this project’s selected cyclone track',
      resolution: `${personalizedForecast?.trainingSamples || 0} recent track observations`,
      landfallLocation: personalizedForecast
        ? `Projected center: ${personalizedForecast.latitude}°N, ${personalizedForecast.longitude}°E`
        : 'Waiting for a cyclone track with at least two points',
      landfallEta: personalizedForecast ? `+${personalizedForecast.forecastHours} hours (trend projection)` : 'Not available',
      landfallWind: personalizedForecast ? `${personalizedForecast.windKmh} km/h (calibrated estimate)` : 'Not available',
      trackConfidence: personalizedForecast
        ? `${personalizedForecast.confidence}% local fit · ±${personalizedForecast.uncertaintyKm} km`
        : 'Insufficient local track data',
      color: 'border-blue-800/80 bg-slate-900/90 text-slate-300',
    },
  ];
  const visibleModels = selectedModel === 'all' ? models : models.filter((model) => model.id === selectedModel);

  return (
    <div id="forecast-models-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Multi-Model Ensemble Forecast Comparison
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Consensus track divergence, cone probability &amp; landfall cross-validation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Model Focus:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 cursor-pointer font-medium"
          >
            <option value="all">Consensus Multi-Model Ensemble</option>
            <option value="mosdac-eps">MOSDAC SCORPIO EPS</option>
            <option value="imd-gfs">IMD GFS T1534</option>
            <option value="ncmrwf-um">NCMRWF NCUM</option>
            <option value="ecmwf">ECMWF IFS</option>
            <option value="personalized-ml">Personalized TrackTrend ML</option>
          </select>
          <select
            value={forecastProfile}
            onChange={(e) => setForecastProfile(e.target.value as ForecastProfile)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 cursor-pointer font-medium"
            aria-label="Personalized forecast calibration"
          >
            <option value="cautious">ML profile: Cautious</option>
            <option value="balanced">ML profile: Balanced</option>
            <option value="early-warning">ML profile: Early-warning</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Personalized TrackTrend ML</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              This on-device model fits the selected cyclone’s recent track and wind trend, then applies your {forecastProfile.replace('-', ' ')} calibration to a 24-hour projection. It is a decision-support aid only—not an official IMD forecast.
            </p>
          </div>
        </div>
      </div>

      {/* Consensus Summary Banner */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                High Multi-Model Consensus
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Projected Landfall: Dhamra Port to Chandbali (North Odisha Coast)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              All four leading meteorological numerical models show tight along-track agreement (&lt; 28 km dispersion)
              projecting landfall as a Severe Cyclonic Storm with sustained winds of 105-120 km/h.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Landfall Window</span>
              <span className="text-sm font-bold text-cyan-300">24 Oct Midnight – 25 Oct Dawn</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Dispersion Error</span>
              <span className="text-sm font-bold text-emerald-400">± 22 km (Low Spread)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleModels.map((model) => (
          <div
            key={model.id}
            className={`rounded-2xl border p-5 shadow-lg transition hover:border-blue-700/70 ${model.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{model.name}</h3>
                <span className="text-xs text-slate-400">{model.agency}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-700 text-slate-300">
                Res: {model.resolution}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Landfall Location:</span>
                <span className="font-semibold text-slate-200">{model.landfallLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expected Landfall Time:</span>
                <span className="font-semibold text-cyan-300 font-mono">{model.landfallEta}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Peak Landfall Wind:</span>
                <span className="font-bold text-amber-300 font-mono">{model.landfallWind}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Track Reliability:</span>
                <span className="font-semibold text-emerald-400">{model.trackConfidence}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast Verification & Track Error Metrics */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Average Track Forecast Errors in North Indian Ocean (MOSDAC vs IMD)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">+24h Track Error</span>
            <span className="text-lg font-bold text-white font-mono mt-1">42 km</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Below Global Avg</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">+48h Track Error</span>
            <span className="text-lg font-bold text-white font-mono mt-1">84 km</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">High Skill</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">+72h Track Error</span>
            <span className="text-lg font-bold text-white font-mono mt-1">126 km</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Nominal</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">+120h Track Error</span>
            <span className="text-lg font-bold text-white font-mono mt-1">198 km</span>
            <span className="text-[10px] text-amber-400 block mt-0.5">Ensemble Cone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
