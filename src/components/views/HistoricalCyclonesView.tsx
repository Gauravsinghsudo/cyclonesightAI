import React, { useState, useMemo } from 'react';
import { Archive, Search, Calendar, Compass, ExternalLink, ArrowRight, Wind, ShieldCheck } from 'lucide-react';
import { CycloneData } from '../../types';
import localMosdacDb from '../../data/mosdacRecords.json';
import { convertMosdacTrackToCycloneData, MosdacFeatureCollection } from '../../services/mosdacService';

interface HistoricalCyclonesViewProps {
  onLoadCycloneToActive: (cyclone: CycloneData) => void;
}

export const HistoricalCyclonesView: React.FC<HistoricalCyclonesViewProps> = ({ onLoadCycloneToActive }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const yearList = (localMosdacDb as any).yearList || [];
  const tracksMap = ((localMosdacDb as any).tracks || {}) as Record<string, MosdacFeatureCollection>;

  // Filter years
  const currentYearGroup = useMemo(() => {
    return yearList.find((y: any) => y.Year === selectedYear) || yearList[1];
  }, [yearList, selectedYear]);

  // List of cyclones for selected year or search
  const displayedCyclones = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      const results: { year: string; name: string }[] = [];
      yearList.forEach((yg: any) => {
        (yg.Cyclonelist || []).forEach((cName: string) => {
          if (cName.toUpperCase().includes(q) && cName !== 'NO-Cyclone') {
            results.push({ year: yg.Year, name: cName });
          }
        });
      });
      return results;
    }

    return (currentYearGroup?.Cyclonelist || [])
      .filter((name: string) => name !== 'NO-Cyclone')
      .map((name: string) => ({ year: selectedYear, name }));
  }, [yearList, currentYearGroup, selectedYear, searchQuery]);

  const handleSelectStorm = (stormName: string) => {
    const rawTrack = tracksMap[stormName.toUpperCase()];
    if (rawTrack) {
      const cData = convertMosdacTrackToCycloneData(stormName, rawTrack);
      onLoadCycloneToActive(cData);
    } else {
      // Fallback
      onLoadCycloneToActive({
        id: `MOSDAC-${stormName}`,
        name: `Cyclone ${stormName}`,
        category: 'Severe Cyclonic Storm',
        categoryColor: 'red',
        basin: 'Bay of Bengal',
        coordinates: { lat: 18.5, lng: 88.0, latStr: '18.5°N', lngStr: '88.0°E' },
        maxWindKmh: 120,
        maxWindKnots: 65,
        pressureHpa: 980,
        movement: { direction: 'NW', speedKmh: 15 },
        trajectoryPoints: [],
        forecast5Days: [],
        riIndex: 50,
        riProbability24h: 40,
        statusDescription: `Historical cyclone records from MOSDAC SCORPIO for ${stormName}.`,
      });
    }
  };

  return (
    <div id="historical-cyclones-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              ISRO MOSDAC SCORPIO Cyclone Archive (2013 – Present)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Access authentic satellite tracks, intensity observations and trajectory records from https://mosdac.gov.in/scorpio/
            </p>
          </div>
        </div>

        <a
          href="https://mosdac.gov.in/scorpio/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition self-start sm:self-auto"
        >
          <span>Official SCORPIO Repository</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Year Selector & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Year Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {yearList
            .filter((y: any) => y.Year !== 'Recent')
            .map((yg: any) => (
              <button
                key={yg.Year}
                onClick={() => {
                  setSelectedYear(yg.Year);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  selectedYear === yg.Year && !searchQuery
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {yg.Year}
              </button>
            ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search storm (e.g. DANA, REMAL, AMPHAN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Storm Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCyclones.map(({ year, name }) => {
          const trackData = tracksMap[name.toUpperCase()];
          const featureCount = trackData?.features?.length || 0;

          // Calculate peak wind speed from features if available
          let peakKnots = 55;
          if (trackData?.features) {
            trackData.features.forEach((f) => {
              let val = parseFloat(f.properties.cyclone_intensity);
              if (val >= 200) val = val / 10;
              if (val > peakKnots) peakKnots = Math.round(val);
            });
          }
          const peakKmh = Math.round(peakKnots * 1.852);

          return (
            <div
              key={`${year}-${name}`}
              className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-400">{year} Season</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    {featureCount > 0 ? `${featureCount} Waypoints` : 'MOSDAC Catalog'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">Cyclone {name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Official historical cyclone track logged in ISRO MOSDAC SCORPIO archives.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Peak Wind</span>
                    <span className="text-white font-bold">{peakKmh} km/h</span> ({peakKnots} kt)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Format</span>
                    <span className="text-cyan-300 font-semibold">GeoJSON Track</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleSelectStorm(name)}
                  className="w-full py-2 px-3 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <span>Load Into Active Telemetry &amp; Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
