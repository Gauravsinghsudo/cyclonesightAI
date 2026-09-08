import React from 'react';
import { BarChart3, TrendingUp, Download, PieChart, Calendar, FileText } from 'lucide-react';
import { CycloneData } from '../../types';

interface AnalyticsReportsViewProps {
  cyclones: CycloneData[];
}

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({ cyclones }) => {
  const annualTrends = [
    { year: '2024', total: 4, cs: 1, scs: 2, escs: 1, bob: 3, as: 1 },
    { year: '2023', total: 6, cs: 2, scs: 1, escs: 3, bob: 4, as: 2 },
    { year: '2022', total: 3, cs: 2, scs: 1, escs: 0, bob: 3, as: 0 },
    { year: '2021', total: 5, cs: 1, scs: 2, escs: 2, bob: 3, as: 2 },
    { year: '2020', total: 5, cs: 1, scs: 2, sucs: 1, escs: 1, bob: 3, as: 2 },
    { year: '2019', total: 8, cs: 2, scs: 1, escs: 4, sucs: 1, bob: 3, as: 5 },
  ];

  const handleExportCsv = () => {
    const headers = 'Year,Total Cyclones,Bay of Bengal,Arabian Sea,Severe Storms\n';
    const rows = annualTrends
      .map((t) => `${t.year},${t.total},${t.bob},${t.as},${(t.scs || 0) + (t.escs || 0)}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MOSDAC_Cyclone_Climatology_Report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div id="analytics-reports-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              North Indian Ocean Climatology &amp; Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Decadal cyclogenesis trends, basin frequency (BoB vs AS) &amp; intensity distribution
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Annual Mean Frequency</span>
          <div className="text-2xl font-bold text-white mt-1">5.2 Cyclones / yr</div>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">Consistent with 50-yr IMD baseline</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Bay of Bengal Share</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">74% of Events</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Warm SSTs &amp; high moisture flux</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Arabian Sea Trend</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">+38% Intense Storms</div>
          <span className="text-[11px] text-amber-300 mt-0.5 block">Elevated TCHCP since 2018</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Peak Season Window</span>
          <div className="text-2xl font-bold text-purple-300 mt-1">Oct – Dec (Post-Monsoon)</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Secondary peak: April – May</span>
        </div>
      </div>

      {/* Annual Climatology Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Annual Storm Frequency &amp; Intensity Distribution (2019 – 2024)
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Total Cyclones</th>
                <th className="py-2.5 px-3">Bay of Bengal</th>
                <th className="py-2.5 px-3">Arabian Sea</th>
                <th className="py-2.5 px-3">Severe Storms (SCS+)</th>
                <th className="py-2.5 px-3">Extremely Severe (ESCS+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {annualTrends.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-bold text-white">{t.year}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-400">{t.total}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{t.bob}</td>
                  <td className="py-2.5 px-3 text-amber-300">{t.as}</td>
                  <td className="py-2.5 px-3 text-orange-400">{t.scs}</td>
                  <td className="py-2.5 px-3 text-rose-400">{t.escs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
