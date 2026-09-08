import React from 'react';
import { Zap, AlertTriangle, ShieldCheck, Thermometer, Wind, Activity, ArrowUpRight, Droplets } from 'lucide-react';
import { CycloneData } from '../../types';

interface RapidIntensificationViewProps {
  activeCyclone?: CycloneData | null;
}

export const RapidIntensificationView: React.FC<RapidIntensificationViewProps> = ({ activeCyclone }) => {
  const riIndex = activeCyclone?.riIndex ?? 72;
  const probability24h = activeCyclone?.riProbability24h ?? 64;
  const isHighRisk = riIndex >= 60;

  const predictors = [
    {
      name: 'MOSDAC TCHCP (Ocean Heat)',
      value: '88 kJ/cm²',
      status: 'High Fuel Potential',
      threshold: '> 80 kJ/cm² triggers rapid convection',
      level: 'favorable',
    },
    {
      name: 'Vertical Wind Shear (200-850 hPa)',
      value: '8.4 knots',
      status: 'Low Shear (Highly Favorable)',
      threshold: '< 10 kt allows vertical vortex alignment',
      level: 'favorable',
    },
    {
      name: 'INSAT-3DS Cold Cloud Core',
      value: '-78.6°C',
      status: 'Extreme CDO Convection',
      threshold: '< -75°C signifies rapid central deepening',
      level: 'favorable',
    },
    {
      name: 'Mid-Tropospheric Moisture (RH 500-700)',
      value: '78%',
      status: 'Humid Environment',
      threshold: '> 70% prevents dry air intrusion',
      level: 'favorable',
    },
    {
      name: 'Upper-Level Divergence',
      value: '22 × 10⁻⁵ s⁻¹',
      status: 'Strong Outflow Channel',
      threshold: '> 15 provides robust exhaust mechanism',
      level: 'favorable',
    },
    {
      name: 'Sea Surface Temperature (SST)',
      value: '30.2°C',
      status: 'Hyper-warm Ocean Surface',
      threshold: '> 28.5°C threshold for explosive intensification',
      level: 'favorable',
    },
  ];

  const historicalRI = [
    { name: 'Super Cyclone AMPHAN (2020)', basin: 'Bay of Bengal', riSpeed: '+65 kt in 24h', peakIntensity: '140 kt (260 km/h)' },
    { name: 'Extremely Severe MOCHA (2023)', basin: 'Bay of Bengal', riSpeed: '+55 kt in 24h', peakIntensity: '135 kt (250 km/h)' },
    { name: 'Extremely Severe FANI (2019)', basin: 'Bay of Bengal', riSpeed: '+45 kt in 24h', peakIntensity: '115 kt (215 km/h)' },
    { name: 'Extremely Severe BIPARJOY (2023)', basin: 'Arabian Sea', riSpeed: '+40 kt in 24h', peakIntensity: '90 kt (165 km/h)' },
  ];

  return (
    <div id="rapid-intensification-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Rapid Intensification (RI) Diagnostic Suite
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Official IMD/MOSDAC Criteria: Sustained wind speed increase of ≥ 30 knots (55 km/h) within 24 hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800 text-xs font-bold">
            Target: {activeCyclone?.name || 'Tropical System'}
          </span>
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: RI Probability */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              24-Hour RI Probability
            </span>
            <div className="text-3xl font-extrabold text-white mt-2">{probability24h}%</div>
            <div className="text-xs text-rose-400 font-semibold mt-1">High Probability Envelope</div>
            <p className="text-xs text-slate-400 mt-2">
              Based on statistical-dynamical models comparing satellite infrared cooling rate and atmospheric shear.
            </p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600"
              style={{ width: `${probability24h}%` }}
            />
          </div>
        </div>

        {/* Card 2: MOSDAC RI Index */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              MOSDAC SCORPIO RI Index
            </span>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">{riIndex} / 100</div>
            <div className="text-xs text-amber-300 font-semibold mt-1">
              {isHighRisk ? 'Critical Conditions Met' : 'Moderate Potential'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Composite diagnostic index calculated from TCHCP, divergence aloft, and central core symmetry.
            </p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"
              style={{ width: `${riIndex}%` }}
            />
          </div>
        </div>

        {/* Card 3: Dvorak T-Number Progression */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Dvorak T-Number Intensity
            </span>
            <div className="text-3xl font-extrabold text-cyan-300 mt-2">T4.5 (65 kt)</div>
            <div className="text-xs text-slate-300 font-medium mt-1">24h Projection: T5.5 (102 kt)</div>
            <p className="text-xs text-slate-400 mt-2">
              Derived from INSAT-3DS Enhanced Infrared (EIR) curved band and eye-pattern temperature difference.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Dvorak Curve: Pattern 3</span>
            <span className="text-cyan-400 font-semibold">Eye Forming</span>
          </div>
        </div>
      </div>

      {/* Atmospheric & Oceanic Predictors Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Atmospheric &amp; Oceanic RI Predictor Matrix
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictors.map((pred, i) => (
            <div key={i} className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{pred.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {pred.status}
                </span>
              </div>
              <div className="text-xl font-bold text-white mt-1.5 font-mono">{pred.value}</div>
              <p className="text-[11px] text-slate-400 mt-2">{pred.threshold}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Historical RI Benchmarks in North Indian Ocean */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Historical Benchmark RI Events in North Indian Ocean
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Cyclone Event</th>
                <th className="py-2.5 px-3">Basin</th>
                <th className="py-2.5 px-3">RI Rate (24h)</th>
                <th className="py-2.5 px-3">Peak Intensity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {historicalRI.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-white">{row.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.basin}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{row.riSpeed}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-300">{row.peakIntensity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
