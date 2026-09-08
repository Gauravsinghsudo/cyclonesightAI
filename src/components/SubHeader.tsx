import React from 'react';
import { RefreshCw, Radio, Database, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n';

interface SubHeaderProps {
  years: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  availableCyclonesInYear: string[];
  selectedCycloneName: string;
  onSelectCycloneName: (name: string) => void;
  lastUpdatedText: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  mosdacAlertText?: string;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  years,
  selectedYear,
  onSelectYear,
  availableCyclonesInYear,
  selectedCycloneName,
  onSelectCycloneName,
  lastUpdatedText,
  isRefreshing,
  onRefresh,
  mosdacAlertText = 'No Cyclone in Indian Ocean',
}) => {
  const { t } = useI18n();
  return (
    <div id="dashboard-subheader" className="flex flex-col gap-4 pb-6 pt-2">
      {/* Top Banner: Welcome + Data Source Link + Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              MOSDAC SCORPIO Intelligence
            </h1>
            <a
              href="https://mosdac.gov.in/scorpio/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 hover:bg-blue-900/80 transition"
              title="Official ISRO Meteorological & Oceanographic Satellite Data Archival Centre"
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>mosdac.gov.in/scorpio</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Satellite-based Cyclone Observation & Real-time Prediction over Indian Ocean (INSAT-3DS / INSAT-3DR)
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="text-right hidden md:block">
            <span className="text-[11px] text-slate-400 block">
              Satellite Epoch: <span className="text-slate-200 font-medium">{lastUpdatedText}</span>
            </span>
          </div>

          <button
            id="btn-refresh-data"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-70"
            aria-label="Refresh live cyclone intelligence data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? t('syncing') : t('sync')}</span>
          </button>
        </div>
      </div>

      {/* MOSDAC Archive & Year Selector Bar */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Live status from alertfile.txt */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">{t('feedsActive')}</span>
          </div>

          <span className="text-slate-300 text-[11px] hidden sm:inline-block">
            {t('status')} <span className="text-slate-100 font-semibold">{mosdacAlertText}</span>
          </span>
        </div>

        {/* Right: Year and Cyclone Archive Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label htmlFor="scorpio-year-select" className="text-slate-400 text-[11px] font-medium">
              {t('archiveYear')}
            </label>
            <select
              id="scorpio-year-select"
              value={selectedYear}
              onChange={(e) => onSelectYear(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 font-medium text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === 'Recent' ? 'Recent (Live)' : yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="scorpio-cyclone-select" className="text-slate-400 text-[11px] font-medium">
              {t('cyclone')}
            </label>
            <select
              id="scorpio-cyclone-select"
              value={selectedCycloneName}
              onChange={(e) => onSelectCycloneName(e.target.value)}
              disabled={availableCyclonesInYear.length === 0}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 font-medium text-xs focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {availableCyclonesInYear.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
