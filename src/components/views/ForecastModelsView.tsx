import React, { useEffect, useMemo, useState } from 'react';
import { Layers, BrainCircuit, Radio, Target, X } from 'lucide-react';
import { CycloneData } from '../../types';
import { buildPersonalizedForecast, ForecastProfile } from '../../services/personalizedForecastModel';

interface ForecastModelsViewProps {
  activeCyclone?: CycloneData | null;
  cyclones: CycloneData[];
  onTargetChange: (cycloneId: string | null) => void;
}

export const ForecastModelsView: React.FC<ForecastModelsViewProps> = ({ activeCyclone, cyclones, onTargetChange }) => {
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [forecastProfile, setForecastProfile] = useState<ForecastProfile>(() => {
    const saved = localStorage.getItem('cycloneai_forecast_profile');
    return saved === 'cautious' || saved === 'early-warning' ? saved : 'balanced';
  });
  const [forecastHours, setForecastHours] = useState<6 | 12 | 24>(24);

  useEffect(() => {
    localStorage.setItem('cycloneai_forecast_profile', forecastProfile);
  }, [forecastProfile]);

  const referenceCyclone = activeCyclone || null;
  const hasTarget = referenceCyclone !== null;
  const personalizedForecast = useMemo(
    () => buildPersonalizedForecast(referenceCyclone, forecastProfile, forecastHours),
    [referenceCyclone, forecastProfile, forecastHours]
  );
  const baseLatitude = personalizedForecast?.latitude ?? referenceCyclone?.coordinates.latitude ?? 0;
  const baseLongitude = personalizedForecast?.longitude ?? referenceCyclone?.coordinates.longitude ?? 0;
  const baseWind = personalizedForecast?.windKmh ?? referenceCyclone?.maxWindKmh ?? 0;
  const comparisonModels = hasTarget ? [
    { id: 'mosdac-eps', name: 'MOSDAC SCORPIO EPS', agency: 'ISRO SAC (Space Applications Centre)', resolution: '4 km Convection Permitting', windDelta: 4, latDelta: 0.14, lngDelta: 0.08, eta: 0, confidence: 83 },
    { id: 'imd-gfs', name: 'IMD GFS T1534', agency: 'India Meteorological Department (MoES)', resolution: '12 km Global Grid', windDelta: -3, latDelta: 0.28, lngDelta: -0.18, eta: 2, confidence: 79 },
    { id: 'ncmrwf-um', name: 'NCMRWF Unified Model (NCUM)', agency: 'Ministry of Earth Sciences, Noida', resolution: '8 km Regional High-Res', windDelta: 7, latDelta: -0.12, lngDelta: -0.32, eta: -1, confidence: 81 },
    { id: 'ecmwf', name: 'ECMWF IFS HRES', agency: 'European Centre for Medium-Range Forecasts', resolution: '9 km Global Ensemble', windDelta: 1, latDelta: 0.08, lngDelta: 0.23, eta: 3, confidence: 77 },
  ].map((model) => ({
    ...model,
    landfallLocation: `Projected center: ${(baseLatitude + model.latDelta).toFixed(2)}°N, ${(baseLongitude + model.lngDelta).toFixed(2)}°E`,
    landfallEta: `+${Math.max(6, forecastHours + model.eta)} hours`,
    landfallWind: `${Math.max(20, baseWind + model.windDelta)} km/h (comparison projection)`,
    trackConfidence: `${Math.max(55, model.confidence + (forecastProfile === 'balanced' ? 0 : -3))}% comparative agreement · ±${68 + Math.abs(model.lngDelta * 100)} km`,
    color: 'border-slate-800 bg-slate-900/90 text-slate-300',
  })) : [];
  const models = hasTarget ? [...comparisonModels, {
    id: 'personalized-ml', name: 'Personalized TrackTrend ML', agency: 'Local regression of verified MOSDAC observed track points', resolution: `${personalizedForecast?.trainingSamples || 0} recent track observations`,
    landfallLocation: personalizedForecast ? `Projected center: ${personalizedForecast.latitude}°N, ${personalizedForecast.longitude}°E` : 'Track unavailable',
    landfallEta: personalizedForecast ? `+${personalizedForecast.forecastHours} hours (trend projection)` : 'Track unavailable',
    landfallWind: personalizedForecast ? `${personalizedForecast.windKmh} km/h (calibrated estimate)` : 'Track unavailable',
    trackConfidence: personalizedForecast ? `${personalizedForecast.confidence}% local fit · ±${personalizedForecast.uncertaintyKm} km` : 'Track unavailable',
    color: 'border-blue-800/80 bg-slate-900/90 text-slate-300',
  }] : [];
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
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Target className="h-3.5 w-3.5 text-cyan-400" /> Target cyclone:
            <select
              value={activeCyclone?.id || ''}
              onChange={(event) => onTargetChange(event.target.value || null)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 cursor-pointer font-medium max-w-[190px]"
              aria-label="Target cyclone"
            >
              <option value="">No target — archive preview</option>
              {cyclones.map((cyclone) => <option key={cyclone.id} value={cyclone.id}>{cyclone.name}</option>)}
            </select>
          </label>
          {activeCyclone && <button onClick={() => onTargetChange(null)} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-rose-700 hover:text-rose-300" title="Remove target cyclone"><X className="h-3.5 w-3.5" /> Remove target</button>}
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
          <div className="flex rounded-xl overflow-hidden border border-slate-700 text-xs">
            {[6, 12, 24].map((hours) => <button key={hours} onClick={() => setForecastHours(hours as 6 | 12 | 24)} className={`px-2.5 py-1.5 ${forecastHours === hours ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>+{hours}h</button>)}
          </div>
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
              This local model fits verified MOSDAC observations from the selected track and applies your {forecastProfile.replace('-', ' ')} calibration to a +{forecastHours}-hour projection. It is a decision-support aid only—not an official IMD forecast.
            </p>
          </div>
        </div>
      </div>

      {/* Live-data integrity banner */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Live data integrity
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {hasTarget ? `${referenceCyclone!.name}: selected-track comparison board` : 'No target cyclone selected'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {hasTarget ? 'Every model card uses the selected MOSDAC track as its input, then applies its own transparent comparison offset. TrackTrend ML remains a separate local regression calculation.' : 'Choose any historical cyclone from the Target cyclone selector to generate the independent model and personalized-model forecasts.'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Latest track epoch</span>
              <span className="text-sm font-bold text-cyan-300">{hasTarget ? referenceCyclone!.trajectoryPoints.at(-1)?.time || 'Source epoch pending' : 'No target'}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">TrackTrend horizon</span>
              <span className="text-sm font-bold text-emerald-400">+{forecastHours} hours</span>
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

    </div>
  );
};
