import React, { useState } from 'react';
import { Settings, Gauge, Globe, Languages, CheckCircle, Sliders } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useI18n } from '../../i18n';

function getSavedSettings(): Record<string, string | boolean> {
  try {
    return JSON.parse(localStorage.getItem('cycloneai_settings') || '{}');
  } catch {
    return {};
  }
}

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const [refreshInterval, setRefreshInterval] = useState(() => String(getSavedSettings().refreshInterval || '15'));
  const [windUnit, setWindUnit] = useState(() => String(getSavedSettings().windUnit || 'kmh'));
  const [pressureUnit, setPressureUnit] = useState(() => String(getSavedSettings().pressureUnit || 'hpa'));
  const [defaultChannel, setDefaultChannel] = useState(() => String(getSavedSettings().defaultChannel || 'TIR1'));
  const [autoRotate, setAutoRotate] = useState(() => Boolean(getSavedSettings().autoRotate ?? true));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      'cycloneai_settings',
      JSON.stringify({ refreshInterval, windUnit, pressureUnit, defaultChannel, autoRotate, language })
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    localStorage.removeItem('cycloneai_active_cyclone');
    alert('Local browser cache cleared successfully.');
  };

  return (
    <div id="settings-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600/50">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Operational Settings &amp; Data Configuration
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure MOSDAC API refresh rates, meteorological unit preferences &amp; GIS display parameters
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          {savedSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Sliders className="w-4 h-4" />}
          <span>{savedSuccess ? t('preferencesSaved') : t('savePreferences')}</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Preferences */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Gauge className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('units')}</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">{t('windUnit')}</label>
              <select
                value={windUnit}
                onChange={(e) => setWindUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="kmh">Kilometers per hour (km/h) - IMD Standard</option>
                <option value="kt">Knots (kt) - WMO Marine Standard</option>
                <option value="ms">Meters per second (m/s) - SI Standard</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">{t('pressureUnit')}</label>
              <select
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="hpa">Hectopascals (hPa) - Standard Barometric</option>
                <option value="mbar">Millibars (mbar)</option>
                <option value="inhg">Inches of Mercury (inHg)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Languages className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('language')}</h2>
          </div>

          <div className="text-xs">
            <label htmlFor="display-language" className="text-slate-300 font-medium block mb-1">
              {t('preferredLanguage')}
            </label>
            <select
              id="display-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
            >
              {SUPPORTED_LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-slate-400 leading-relaxed">
              {t('languageHelp')}
            </p>
          </div>
        </div>

        {/* Satellite & Telemetry Feeds */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t('feedCache')}</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">{t('syncFrequency')}</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="5">Every 5 Minutes (Active Warning Mode)</option>
                <option value="15">Every 15 Minutes (INSAT-3DS Standard Cycle)</option>
                <option value="30">Every 30 Minutes</option>
                <option value="manual">Manual Refresh Only</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">{t('channel')}</label>
              <select
                value={defaultChannel}
                onChange={(e) => setDefaultChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="TIR1">Thermal Infrared 1 (10.8 µm - Cloud-Top Temperature)</option>
                <option value="WV">Water Vapor (6.8 µm - Mid-Level Moisture)</option>
                <option value="VIS">Visible (0.65 µm - Albedo)</option>
                <option value="MIR">Middle Infrared (3.9 µm - Hot Spots)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* System Status & Local Storage Reset */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          {t('dataCache')}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm">Clear Client Telemetry Cache</div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deletes stored cyclone choices, cached waypoints, and reloads fresh records directly from MOSDAC SCORPIO.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer self-start sm:self-auto"
          >
            {t('clearCache')}
          </button>
        </div>
      </div>
    </div>
  );
};
