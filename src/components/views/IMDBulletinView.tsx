import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  MapPin,
  Wind,
  Waves,
  Anchor,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  FileSearch,
} from 'lucide-react';
import { IMDBulletin } from '../../types';
import { fetchIMDBulletins, parseRawIMDBulletinWithAI } from '../../services/imdService';

interface IMDBulletinViewProps {
  onSelectCycloneTarget?: (bulletin: IMDBulletin) => void;
}

export const IMDBulletinView: React.FC<IMDBulletinViewProps> = ({ onSelectCycloneTarget }) => {
  const [bulletins, setBulletins] = useState<IMDBulletin[]>([]);
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [rawInputText, setRawInputText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'landfall' | 'ports' | 'districts' | 'actions' | 'parser'>('landfall');

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    setLoading(true);
    try {
      const data = await fetchIMDBulletins();
      setBulletins(data);
      if (data.length > 0) {
        setSelectedBulletinId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load IMD bulletins:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBulletin = bulletins.find((b) => b.id === selectedBulletinId) || bulletins[0];

  const handleParseCustomBulletin = async () => {
    if (!rawInputText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseRawIMDBulletinWithAI(rawInputText);
      if (parsed) {
        setBulletins((prev) => [parsed, ...prev]);
        setSelectedBulletinId(parsed.id);
        setActiveTab('landfall');
        setRawInputText('');
      }
    } catch (err) {
      console.warn('Failed to parse raw IMD bulletin:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyRawText = () => {
    if (activeBulletin?.rawText) {
      navigator.clipboard.writeText(activeBulletin.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStageBadgeColor = (stage?: string) => {
    if (!stage) return 'bg-blue-900/60 text-blue-300 border-blue-700';
    if (stage.includes('Red') || stage.includes('Stage 4')) return 'bg-rose-950 text-rose-300 border-rose-800';
    if (stage.includes('Orange') || stage.includes('Stage 3')) return 'bg-amber-950 text-amber-300 border-amber-800';
    if (stage.includes('Yellow') || stage.includes('Stage 2')) return 'bg-yellow-950 text-yellow-300 border-yellow-800';
    return 'bg-blue-950 text-blue-300 border-blue-800';
  };

  return (
    <div id="imd-bulletin-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                IMD Official Tropical Cyclone Bulletins
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800 font-semibold uppercase tracking-wider">
                RSMC New Delhi Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Official 4-Stage Warning Protocol, Landfall Forecasts, Port Warning Signals &amp; Coastal District Advisories
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadBulletins}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync IMD Feeds
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Bulletin Parser
          </button>
        </div>
      </div>

      {/* Bulletin Selector Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl overflow-x-auto">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">Active Bulletin:</span>
          <select
            value={selectedBulletinId}
            onChange={(e) => setSelectedBulletinId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 cursor-pointer font-medium max-w-[280px] sm:max-w-md truncate"
          >
            {bulletins.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bulletinNo} — {b.systemName}
              </option>
            ))}
          </select>
        </div>

        {activeBulletin && (
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold ${getStageBadgeColor(activeBulletin.warningStage)}`}>
              {activeBulletin.warningStage}
            </span>
          </div>
        )}
      </div>

      {/* Active Bulletin Overview Banner */}
      {activeBulletin && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{activeBulletin.bulletinNo}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Issued: {activeBulletin.issuedAt}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {activeBulletin.systemName} ({activeBulletin.category})
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {activeBulletin.location.description}
              </p>
            </div>

            {onSelectCycloneTarget && (
              <button
                onClick={() => onSelectCycloneTarget(activeBulletin)}
                className="self-start lg:self-center px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 font-semibold text-xs text-white shadow-lg shadow-orange-600/30 transition cursor-pointer"
              >
                Track {activeBulletin.systemName} on GIS Map →
              </button>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Peak Wind Speed</span>
              <div className="text-lg sm:text-xl font-bold text-amber-400 mt-1 font-mono">
                {activeBulletin.intensity.maxWindKmh} km/h
              </div>
              <span className="text-[10px] text-slate-400">Gusting to {activeBulletin.intensity.gustKmh} km/h ({activeBulletin.intensity.maxWindKnots} kt)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Central Pressure</span>
              <div className="text-lg sm:text-xl font-bold text-cyan-300 mt-1 font-mono">
                {activeBulletin.intensity.centralPressureHpa} hPa
              </div>
              <span className="text-[10px] text-slate-400">Core Barometric Minimum</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Movement Vector</span>
              <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1">
                {activeBulletin.movement.direction}
              </div>
              <span className="text-[10px] text-slate-400">Speed: {activeBulletin.movement.speedKmh} km/h</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Storm Surge</span>
              <div className="text-lg sm:text-xl font-bold text-rose-400 mt-1">
                {activeBulletin.landfall.stormSurgeMeters}
              </div>
              <span className="text-[10px] text-slate-400">Inundation Height</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'landfall', label: 'Landfall & Forecast Track', icon: MapPin },
          { id: 'ports', label: 'Port Signals (1-11)', icon: Anchor },
          { id: 'districts', label: 'District Alerts & Rainfall', icon: ShieldAlert },
          { id: 'actions', label: 'Action Suggested', icon: AlertTriangle },
          { id: 'parser', label: 'AI Bulletin Parser', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Landfall & Forecast Track */}
      {activeTab === 'landfall' && activeBulletin && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              Official IMD Landfall Forecast Summary
            </h3>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Expected Landfall Sector</span>
                <p className="text-base font-bold text-white mt-0.5">{activeBulletin.landfall.expectedArea}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Expected Time Window</span>
                  <p className="text-sm font-semibold text-cyan-300 font-mono mt-0.5">{activeBulletin.landfall.expectedTimeWindow}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Peak Landfall Sustained Wind</span>
                  <p className="text-sm font-semibold text-amber-400 font-mono mt-0.5">{activeBulletin.landfall.peakLandfallWindKmh} km/h</p>
                </div>
              </div>
            </div>

            {/* Fishermen Advisory */}
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Waves className="w-4 h-4" />
                Fishermen &amp; Sea Travel Warning
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{activeBulletin.fishermenWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Port Warning Signals (Signals 1-11) */}
      {activeTab === 'ports' && activeBulletin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              IMD Port Warning Signals (Signals 1 to 11)
            </h3>
            <span className="text-xs text-slate-400">Great Danger Signals (8, 9, 10) Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeBulletin.portSignals.map((port, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{port.portName}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
                    port.signalNo >= 8 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {port.signalName}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{port.advisory}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: District Alerts & Rainfall */}
      {activeTab === 'districts' && activeBulletin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            District-Wise Heavy Rainfall &amp; Vulnerability Matrix
          </h3>

          <div className="space-y-3">
            {activeBulletin.affectedDistricts.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{item.state} State</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    item.rainfallAlert === 'Extremely Heavy' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {item.rainfallAlert} Rainfall Warning
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.districts.map((d, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 font-medium">
                      📍 {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Action Suggested */}
      {activeTab === 'actions' && activeBulletin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            IMD Operational Action Suggested Checklist
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {activeBulletin.actionSuggested.map((action, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-200 leading-relaxed font-medium">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 5: AI Bulletin Parser Tool */}
      {activeTab === 'parser' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Instant AI IMD Bulletin Text Parser
              </h3>
              <p className="text-xs text-slate-400">
                Paste raw official IMD Bulletin text below to automatically extract structured metrics, port signals, and warnings using Gemini 2.5 Flash.
              </p>
            </div>
          </div>

          <textarea
            value={rawInputText}
            onChange={(e) => setRawInputText(e.target.value)}
            placeholder="Paste raw IMD text bulletin here (e.g. INDIA METEOROLOGICAL DEPARTMENT BULLETIN NO. 14...)"
            rows={8}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRawInputText('')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold hover:bg-slate-700 transition cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handleParseCustomBulletin}
              disabled={isParsing || !rawInputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-bold text-xs text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
              {isParsing ? 'Extracting Metrics...' : 'Parse Bulletin with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Raw Bulletin Accordion */}
      {activeBulletin?.rawText && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between p-4 bg-slate-950/60 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-orange-400" />
              Raw Official IMD Text Transcript
            </span>
            {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRawText && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={handleCopyRawText}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Transcript'}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                {activeBulletin.rawText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
