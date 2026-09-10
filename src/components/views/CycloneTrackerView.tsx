import React, { useEffect, useState } from 'react';
import { Compass, Download, Square, CheckSquare, Layers, Loader2 } from 'lucide-react';
import { CycloneData, TrajectoryPoint } from '../../types';
import { LeafletCycloneMap } from '../map/LeafletCycloneMap';

interface CycloneTrackerViewProps {
  cyclones: CycloneData[];
  selectedCycloneId: string | null;
  onSelectCyclone: (id: string) => void;
  archiveYearGroups: Array<{ Year: string; Cyclonelist: string[] }>;
  onLoadHistoricalCyclones: (names: string[]) => Promise<string[]>;
}

export const CycloneTrackerView: React.FC<CycloneTrackerViewProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  archiveYearGroups,
  onLoadHistoricalCyclones,
}) => {
  // Details and exports must follow the user's explicit map selection. Do not
  // fall back to the first loaded (often archived) track.
  const selectedTrack = selectedCycloneId
    ? cyclones.find((cyclone) => cyclone.id === selectedCycloneId) || null
    : null;
  const [filterType, setFilterType] = useState<'all' | 'observed' | 'forecast'>('all');
  const [visibleCycloneIds, setVisibleCycloneIds] = useState<string[]>(() =>
    selectedCycloneId ? [selectedCycloneId] : []
  );
  const historicalYearGroups = archiveYearGroups.filter((group) => group.Year !== 'Recent' && group.Cyclonelist.length > 0);
  const [historicalYear, setHistoricalYear] = useState(() => historicalYearGroups[0]?.Year || '');
  const [selectedHistoricalNames, setSelectedHistoricalNames] = useState<string[]>([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

  useEffect(() => {
    if (!historicalYearGroups.some((group) => group.Year === historicalYear)) {
      setHistoricalYear(historicalYearGroups[0]?.Year || '');
      setSelectedHistoricalNames([]);
    }
  }, [historicalYear, historicalYearGroups]);

  // A storm selected elsewhere in the app should be immediately visible when this page opens.
  useEffect(() => {
    if (selectedCycloneId) {
      setVisibleCycloneIds((current) => current.includes(selectedCycloneId) ? current : [...current, selectedCycloneId]);
    }
  }, [selectedCycloneId]);

  const visibleCyclones = cyclones.filter((cyclone) => visibleCycloneIds.includes(cyclone.id));
  const mapSelectedCycloneId = visibleCycloneIds.includes(selectedCycloneId || '')
    ? selectedCycloneId
    : null;

  const toggleCycloneVisibility = (id: string) => {
    setVisibleCycloneIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id]);
  };

  const historicalCyclones = historicalYearGroups.find((group) => group.Year === historicalYear)?.Cyclonelist || [];

  const toggleHistoricalCyclone = (name: string) => {
    setSelectedHistoricalNames((current) => current.includes(name)
      ? current.filter((selected) => selected !== name)
      : [...current, name]);
  };

  const loadSelectedHistoricalTracks = async () => {
    if (selectedHistoricalNames.length === 0) return;
    setIsLoadingHistorical(true);
    try {
      const ids = await onLoadHistoricalCyclones(selectedHistoricalNames);
      if (ids.length > 0) {
        setVisibleCycloneIds((current) => [...new Set([...current, ...ids])]);
        onSelectCyclone(ids[0]);
      }
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  const waypoints = selectedTrack?.trajectoryPoints || [];

  const filteredWaypoints = waypoints.filter((wp) => {
    const isFcst = wp.time.includes('(Fcst)') || wp.time.startsWith('+');
    if (filterType === 'observed') return !isFcst;
    if (filterType === 'forecast') return isFcst;
    return true;
  });

  const handleExportGeoJson = () => {
    if (!selectedTrack) return;
    const geojson = {
      type: 'FeatureCollection',
      name: `MOSDAC_Track_${selectedTrack.name}`,
      features: waypoints.map((wp, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [wp.lng, wp.lat],
        },
        properties: {
          step: i + 1,
          time: wp.time,
          windSpeedKmh: wp.windSpeedKmh,
          windSpeedKnots: Math.round(wp.windSpeedKmh / 1.852),
          cyclone_name: selectedTrack.name,
        },
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MOSDAC_${selectedTrack.name}_Track.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="cyclone-tracker-view" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              MOSDAC Cyclone Track &amp; Trajectory Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-point trajectory interpolation, central pressure calculation &amp; landfall prediction
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportGeoJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Download MOSDAC Track in standard GeoJSON format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 sm:p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mr-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Historical trajectories
              </div>
              <label htmlFor="historical-year-select" className="text-[11px] text-slate-400">Year:</label>
              <select
                id="historical-year-select"
                value={historicalYear}
                onChange={(event) => {
                  setHistoricalYear(event.target.value);
                  setSelectedHistoricalNames([]);
                }}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {historicalYearGroups.map((group) => <option key={group.Year} value={group.Year}>{group.Year}</option>)}
              </select>
              <button
                onClick={() => setSelectedHistoricalNames(historicalCyclones)}
                className="px-2 py-1 text-[11px] rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedHistoricalNames([])}
                className="px-2 py-1 text-[11px] rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Clear
              </button>
              <button
                onClick={loadSelectedHistoricalTracks}
                disabled={selectedHistoricalNames.length === 0 || isLoadingHistorical}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
              >
                {isLoadingHistorical && <Loader2 className="w-3 h-3 animate-spin" />}
                Show selected ({selectedHistoricalNames.length})
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {historicalCyclones.map((name) => {
                const isSelected = selectedHistoricalNames.includes(name);
                return (
                  <button
                    key={`${historicalYear}-${name}`}
                    onClick={() => toggleHistoricalCyclone(name)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg border transition ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-950/60 text-cyan-200'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    Cyclone {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Show on map:</span>
            <button
              onClick={() => setVisibleCycloneIds(cyclones.map((cyclone) => cyclone.id))}
              className="px-2 py-1 text-[11px] rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              All
            </button>
            <button
              onClick={() => setVisibleCycloneIds([])}
              className="px-2 py-1 text-[11px] rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              None
            </button>
            {cyclones.map((cyclone) => {
              const isVisible = visibleCycloneIds.includes(cyclone.id);
              return (
                <button
                  key={`visibility-${cyclone.id}`}
                  onClick={() => toggleCycloneVisibility(cyclone.id)}
                  aria-pressed={isVisible}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg border transition ${
                    isVisible
                      ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                      : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {isVisible ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  {cyclone.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map + Vital Metrics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map takes 2 cols */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Trajectory &amp; Cone of Uncertainty
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Total Recorded Waypoints: <span className="text-white font-mono">{waypoints.length}</span>
            </div>
          </div>

          <LeafletCycloneMap
            cyclones={visibleCyclones}
            selectedCycloneId={mapSelectedCycloneId}
            onSelectCyclone={onSelectCyclone}
            height="460px"
            showControls={true}
          />
        </div>

        {/* Current Storm Telemetry Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Selected track details</span>
                <span className="text-xl font-bold text-white">{selectedTrack?.name || 'No track selected'}</span>
              </div>
              {selectedTrack && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800/60">
                  {selectedTrack.category}
                </span>
              )}
            </div>

            {selectedTrack ? <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Basin Sector</span>
                <span className="font-semibold text-slate-200">{selectedTrack.basin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Position</span>
                <span className="font-mono font-semibold text-cyan-300">
                  {selectedTrack.coordinates.latStr}, {selectedTrack.coordinates.lngStr}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Peak Sustained Winds</span>
                <span className="font-mono font-bold text-white">
                  {selectedTrack.maxWindKmh} km/h ({selectedTrack.maxWindKnots} kt)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estimated Central Pressure</span>
                <span className="font-mono font-bold text-amber-400">{selectedTrack.pressureHpa} hPa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Translation Movement</span>
                <span className="font-semibold text-slate-200">
                  {selectedTrack.movement.direction} at {selectedTrack.movement.speedKmh} km/h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rapid Intensification Risk</span>
                <span className="font-bold text-rose-400">{selectedTrack.riIndex}% Index</span>
              </div>
            </div> : (
              <p className="text-xs leading-relaxed text-slate-400">Select a visible track on the map to view its details.</p>
            )}

            {selectedTrack && (
              <div className="mt-4 pt-3.5 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                {selectedTrack.statusDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Waypoint Chronology Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              MOSDAC GeoJSON Chronology &amp; Forecast Table
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact 6-hourly observation and ensemble forecast steps from ISRO MOSDAC SCORPIO
            </p>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({waypoints.length})
            </button>
            <button
              onClick={() => setFilterType('observed')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                filterType === 'observed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Observed
            </button>
            <button
              onClick={() => setFilterType('forecast')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                filterType === 'forecast' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Forecast
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Date / Hour</th>
                <th className="py-2.5 px-3">Latitude</th>
                <th className="py-2.5 px-3">Longitude</th>
                <th className="py-2.5 px-3">Sustained Wind</th>
                <th className="py-2.5 px-3">Knots</th>
                <th className="py-2.5 px-3">Estimated Pressure</th>
                <th className="py-2.5 px-3">Source &amp; Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredWaypoints.map((wp, idx) => {
                const isFcst = wp.time.includes('(Fcst)') || wp.time.startsWith('+');
                const kt = Math.round(wp.windSpeedKmh / 1.852);
                const p = Math.max(920, 1012 - Math.round(Math.pow(kt, 1.25) * 0.42));

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans font-medium text-white">{wp.time}</td>
                    <td className="py-2 px-3 text-cyan-300">{wp.lat.toFixed(2)}°N</td>
                    <td className="py-2 px-3 text-cyan-300">{wp.lng.toFixed(2)}°E</td>
                    <td className="py-2 px-3 text-slate-100">{wp.windSpeedKmh} km/h</td>
                    <td className="py-2 px-3 text-slate-200">{kt} kt</td>
                    <td className="py-2 px-3 text-amber-400">{p} hPa</td>
                    <td className="py-2 px-3 font-sans">
                      {isFcst ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                          MOSDAC SCORPIO Forecast
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          IMD Ground Observation
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
