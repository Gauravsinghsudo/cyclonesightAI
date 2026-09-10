import React, { useState, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Eye,
  Shield,
  Wind,
  Navigation,
  MapPin,
  Calendar,
  Gauge,
  Thermometer,
  Play,
  Pause,
  Maximize2,
} from 'lucide-react';
import { CycloneData, TrajectoryPoint } from '../../types';

interface InteractiveCycloneMapProps {
  cyclones: CycloneData[];
  selectedCycloneId?: string | null;
  onSelectCyclone?: (id: string) => void;
  height?: string;
  showControls?: boolean;
  onOpenFullModal?: () => void;
}

// Major coastal cities and ports in North Indian Ocean basin with real coordinates
export const COASTAL_POINTS = [
  { name: 'Kolkata', lat: 22.57, lng: 88.36, state: 'West Bengal', type: 'port', pop: '14.8M' },
  { name: 'Haldia', lat: 22.06, lng: 88.06, state: 'West Bengal', type: 'port', pop: '200K' },
  { name: 'Digha', lat: 21.62, lng: 87.52, state: 'West Bengal', type: 'coast', pop: '50K' },
  { name: 'Balasore', lat: 21.49, lng: 86.93, state: 'Odisha', type: 'coast', pop: '150K' },
  { name: 'Dhamra Port', lat: 20.79, lng: 86.96, state: 'Odisha', type: 'port', pop: '45K' },
  { name: 'Paradip Port', lat: 20.26, lng: 86.67, state: 'Odisha', type: 'port', pop: '120K' },
  { name: 'Puri', lat: 19.81, lng: 85.83, state: 'Odisha', type: 'coast', pop: '200K' },
  { name: 'Gopalpur Port', lat: 19.26, lng: 84.90, state: 'Odisha', type: 'port', pop: '80K' },
  { name: 'Visakhapatnam', lat: 17.68, lng: 83.21, state: 'Andhra Pradesh', type: 'port', pop: '2.1M' },
  { name: 'Kakinada', lat: 16.98, lng: 82.24, state: 'Andhra Pradesh', type: 'port', pop: '440K' },
  { name: 'Machilipatnam', lat: 16.18, lng: 81.13, state: 'Andhra Pradesh', type: 'port', pop: '170K' },
  { name: 'Chennai Port', lat: 13.08, lng: 80.29, state: 'Tamil Nadu', type: 'port', pop: '10.9M' },
  { name: 'Puducherry', lat: 11.94, lng: 79.80, state: 'Puducherry', type: 'port', pop: '650K' },
  { name: 'Nagapattinam', lat: 10.76, lng: 79.84, state: 'Tamil Nadu', type: 'port', pop: '100K' },
  { name: 'Mumbai Port', lat: 18.94, lng: 72.84, state: 'Maharashtra', type: 'port', pop: '20.4M' },
  { name: 'Veraval Port', lat: 20.90, lng: 70.36, state: 'Gujarat', type: 'port', pop: '180K' },
  { name: 'Kandla Port', lat: 23.00, lng: 70.21, state: 'Gujarat', type: 'port', pop: '160K' },
  { name: 'Cox\'s Bazar', lat: 21.42, lng: 91.97, state: 'Bangladesh', type: 'coast', pop: '350K' },
  { name: 'Chittagong Port', lat: 22.33, lng: 91.83, state: 'Bangladesh', type: 'port', pop: '5.2M' },
  { name: 'Colombo Port', lat: 6.94, lng: 79.85, state: 'Sri Lanka', type: 'port', pop: '750K' },
  { name: 'Port Blair', lat: 11.66, lng: 92.74, state: 'Andaman', type: 'port', pop: '140K' },
];

// Helper to calculate distance in km between two lat/lng points (Haversine)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const InteractiveCycloneMap: React.FC<InteractiveCycloneMapProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  height = '540px',
  showControls = true,
  onOpenFullModal,
}) => {
  // Active selected cyclone
  const activeCyclone = useMemo(() => {
    return cyclones.find((c) => c.id === selectedCycloneId) || cyclones[0] || null;
  }, [cyclones, selectedCycloneId]);

  // Map view layers
  const [showSatelliteIR, setShowSatelliteIR] = useState(true);
  const [showForecastCone, setShowForecastCone] = useState(true);
  const [showWindIsotachs, setShowWindIsotachs] = useState(true);
  const [showSurgeHazard, setShowSurgeHazard] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showLatLonGrid, setShowLatLonGrid] = useState(true);
  const [satelliteColorMode, setSatelliteColorMode] = useState<'TIR1' | 'WV' | 'VIS' | 'TCHCP'>('TIR1');
  const [animateVortex, setAnimateVortex] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState<'streets' | 'satellite'>('streets');

  // Zoom and Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Inspection / Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    title: string;
    details: string[];
  } | null>(null);

  // Waypoint animation / scrubber
  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number>(-1);
  const [isPlayingScrubber, setIsPlayingScrubber] = useState(false);
  const scrubberTimerRef = useRef<any>(null);

  // Map coordinate bounds for projection: North Indian Ocean
  // minLon: 60°E, maxLon: 98°E, minLat: 4°N, maxLat: 28°N
  const mapBounds = { minLon: 60, maxLon: 98, minLat: 4, maxLat: 28 };
  const svgWidth = 1000;
  const svgHeight = 620;

  // Geographic projection helper
  const project = (lng: number, lat: number) => {
    const x = ((lng - mapBounds.minLon) / (mapBounds.maxLon - mapBounds.minLon)) * (svgWidth - 100) + 50;
    const y = svgHeight - (((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * (svgHeight - 100) + 50);
    return { x, y };
  };

  // Nearest coastal city to active cyclone center
  const nearestCityInfo = useMemo(() => {
    if (!activeCyclone) return null;
    const cLat = activeCyclone.coordinates.lat;
    const cLng = activeCyclone.coordinates.lng;

    let minDistance = Infinity;
    let closestCity = COASTAL_POINTS[0];

    COASTAL_POINTS.forEach((pt) => {
      const d = calculateDistanceKm(cLat, cLng, pt.lat, pt.lng);
      if (d < minDistance) {
        minDistance = d;
        closestCity = pt;
      }
    });

    return { city: closestCity, distanceKm: minDistance };
  }, [activeCyclone]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Scrubber playback
  const toggleScrubber = () => {
    if (isPlayingScrubber) {
      clearInterval(scrubberTimerRef.current);
      setIsPlayingScrubber(false);
    } else {
      setIsPlayingScrubber(true);
      const points = activeCyclone?.trajectoryPoints || [];
      if (points.length === 0) return;

      scrubberTimerRef.current = setInterval(() => {
        setActiveWaypointIndex((prev) => {
          if (prev >= points.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 1200);
    }
  };

  // Trajectory points of active cyclone
  const trajectoryPoints = activeCyclone?.trajectoryPoints || [];
  const currentPointIndex =
    activeWaypointIndex >= 0 && activeWaypointIndex < trajectoryPoints.length
      ? activeWaypointIndex
      : trajectoryPoints.length - 1;
  const currentTrackPoint = trajectoryPoints[currentPointIndex] || null;

  // Active coordinates
  const currentLat = currentTrackPoint ? currentTrackPoint.lat : activeCyclone?.coordinates.lat || 19.5;
  const currentLng = currentTrackPoint ? currentTrackPoint.lng : activeCyclone?.coordinates.lng || 88.5;
  const currentPos = project(currentLng, currentLat);

  // Build SVG Path for observed track and forecast track
  const { observedPath, forecastPath, conePath } = useMemo(() => {
    if (!trajectoryPoints || trajectoryPoints.length === 0) {
      return { observedPath: '', forecastPath: '', conePath: '' };
    }

    let obsStr = '';
    let fcstStr = '';
    let lastObsPoint: { x: number; y: number } | null = null;
    const forecastNodes: { x: number; y: number; idx: number }[] = [];

    trajectoryPoints.forEach((tp, idx) => {
      const isForecast = tp.time.includes('(Fcst)') || tp.time.startsWith('+');
      const pt = project(tp.lng, tp.lat);

      if (!isForecast) {
        if (!obsStr) obsStr += `M ${pt.x} ${pt.y} `;
        else obsStr += `L ${pt.x} ${pt.y} `;
        lastObsPoint = pt;
      } else {
        if (!fcstStr) {
          if (lastObsPoint) fcstStr += `M ${lastObsPoint.x} ${lastObsPoint.y} L ${pt.x} ${pt.y} `;
          else fcstStr += `M ${pt.x} ${pt.y} `;
        } else {
          fcstStr += `L ${pt.x} ${pt.y} `;
        }
        forecastNodes.push({ x: pt.x, y: pt.y, idx });
      }
    });

    // Build cone of uncertainty around forecast points
    let cPath = '';
    if (forecastNodes.length > 0 && lastObsPoint) {
      const topPoints: string[] = [];
      const bottomPoints: string[] = [];

      forecastNodes.forEach((node, i) => {
        // Radius increases with forecast hour (+12h = 25px, +72h = 75px)
        const coneRadius = 20 + i * 16;
        topPoints.push(`${node.x - coneRadius * 0.5},${node.y - coneRadius}`);
        bottomPoints.unshift(`${node.x + coneRadius * 0.5},${node.y + coneRadius}`);
      });

      cPath = `M ${lastObsPoint.x} ${lastObsPoint.y} L ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
    }

    return { observedPath: obsStr, forecastPath: fcstStr, conePath: cPath };
  }, [trajectoryPoints]);

  return (
    <div
      id="interactive-cyclone-map-container"
      className="relative w-full rounded-2xl bg-[#060c18] border border-slate-800 shadow-xl overflow-hidden flex flex-col select-none"
      style={{ height }}
    >
      {/* Top Map Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              MOSDAC GIS &amp; INSAT-3DS Satellite Basin Map
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/60 hidden sm:inline-block">
            ISRO SCORPIO WGS84
          </span>
        </div>

        {/* Layer Toggles & Mode Selection */}
        {showControls && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Channel Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => {
                  setSatelliteColorMode('TIR1');
                  setShowSatelliteIR(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  satelliteColorMode === 'TIR1' && showSatelliteIR
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Thermal Infrared (Cloud-Top Temperature)"
              >
                IR 10.8µ
              </button>
              <button
                onClick={() => {
                  setSatelliteColorMode('WV');
                  setShowSatelliteIR(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  satelliteColorMode === 'WV' && showSatelliteIR
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Water Vapor (Moisture Channels)"
              >
                WV 6.8µ
              </button>
              <button
                onClick={() => {
                  setSatelliteColorMode('VIS');
                  setShowSatelliteIR(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  satelliteColorMode === 'VIS' && showSatelliteIR
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visible Albedo"
              >
                VIS 0.65µ
              </button>
              <button
                onClick={() => {
                  setSatelliteColorMode('TCHCP');
                  setShowSatelliteIR(true);
                }}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  satelliteColorMode === 'TCHCP' && showSatelliteIR
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tropical Cyclone Heat Potential"
              >
                TCHCP Heat
              </button>
            </div>

            {/* Basemap Switcher (Normal Map vs Satellite) */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setBasemapStyle('streets')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  basemapStyle === 'streets'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Normal Map View (OpenStreetMap)"
              >
                Normal Map
              </button>
              <button
                type="button"
                onClick={() => setBasemapStyle('satellite')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  basemapStyle === 'satellite'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Satellite Earth View"
              >
                Satellite
              </button>
            </div>

            {/* Feature Layers */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowForecastCone(!showForecastCone)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showForecastCone
                    ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Forecast Cone of Uncertainty"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowWindIsotachs(!showWindIsotachs)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showWindIsotachs
                    ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle SCAT Wind Radii (34kt / 50kt / 64kt)"
              >
                <Wind className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSurgeHazard(!showSurgeHazard)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showSurgeHazard
                    ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Coastal Storm Surge Warning Zone"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowCities(!showCities)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showCities
                    ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Ports & Coastal Cities"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen modal button */}
            {onOpenFullModal && (
              <button
                onClick={onOpenFullModal}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
                title="Open Expanded GIS Workspace"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Interactive Map Surface */}
      <div
        className="relative flex-1 w-full bg-[#050b17] overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full block"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Ocean depth gradients */}
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0a162b" />
              <stop offset="60%" stopColor="#060f1e" />
              <stop offset="100%" stopColor="#040914" />
            </radialGradient>

            {/* Satellite Infrared Cloud Spiral Gradient (TIR1) */}
            <radialGradient id="cycloneVortexIR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" /> {/* Eye wall bright */}
              <stop offset="15%" stopColor="#ec4899" stopOpacity="0.85" /> {/* Extremely cold -75C */}
              <stop offset="35%" stopColor="#dc2626" stopOpacity="0.75" /> {/* Deep convection */}
              <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.65" /> {/* Moderate convection */}
              <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.45" /> {/* Outer rainbands */}
              <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Water Vapor (WV) Gradient */}
            <radialGradient id="cycloneVortexWV" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0369a1" stopOpacity="0.5" />
              <stop offset="85%" stopColor="#075985" stopOpacity="0.25" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Visible (VIS) Gradient */}
            <radialGradient id="cycloneVortexVIS" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Tropical Cyclone Heat Potential (TCHCP) */}
            <radialGradient id="tchcpOceanHeat" cx="55%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.55" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#eab308" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Surge Inundation Coastal Glow */}
            <filter id="surgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Base Ocean Canvas */}
          <rect width={svgWidth} height={svgHeight} fill={basemapStyle === 'satellite' ? '#040d1a' : '#aad3df'} />

          {/* 2. Real Geographic Map Tiles in Background (Normal Map / Satellite) */}
          <g id="real-geographic-map-tiles" opacity={basemapStyle === 'satellite' ? 0.95 : 1.0}>
            {[
              { x: 21, y: 12 }, { x: 22, y: 12 }, { x: 23, y: 12 }, { x: 24, y: 12 },
              { x: 21, y: 13 }, { x: 22, y: 13 }, { x: 23, y: 13 }, { x: 24, y: 13 },
              { x: 21, y: 14 }, { x: 22, y: 14 }, { x: 23, y: 14 }, { x: 24, y: 14 },
              { x: 21, y: 15 }, { x: 22, y: 15 }, { x: 23, y: 15 }, { x: 24, y: 15 },
            ].map((t) => {
              const lon1 = (t.x / 32) * 360 - 180;
              const n1 = Math.PI - (2 * Math.PI * t.y) / 32;
              const lat1 = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n1) - Math.exp(-n1)));

              const lon2 = ((t.x + 1) / 32) * 360 - 180;
              const n2 = Math.PI - (2 * Math.PI * (t.y + 1)) / 32;
              const lat2 = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)));

              const pTopLeft = project(lon1, lat1);
              const pBottomRight = project(lon2, lat2);

              const tileUrl = basemapStyle === 'satellite'
                ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/${t.y}/${t.x}`
                : `https://tile.openstreetmap.org/5/${t.x}/${t.y}.png`;

              return (
                <image
                  key={`tile-${basemapStyle}-${t.x}-${t.y}`}
                  href={tileUrl}
                  x={pTopLeft.x}
                  y={pTopLeft.y}
                  width={pBottomRight.x - pTopLeft.x}
                  height={pBottomRight.y - pTopLeft.y}
                  preserveAspectRatio="none"
                />
              );
            })}
          </g>

          {/* 3. Lat / Lon Grid Lines & Coordinates */}
          {showLatLonGrid && (
            <g className="opacity-50 select-none">
              {/* Latitude lines (every 5 degrees from 5N to 25N) */}
              {[5, 10, 15, 20, 25].map((lat) => {
                const { y } = project(mapBounds.minLon, lat);
                return (
                  <g key={`lat-${lat}`}>
                    <line x1="45" y1={y} x2={svgWidth - 45} y2={y} stroke={basemapStyle === 'satellite' ? '#475569' : '#64748b'} strokeDasharray="3 4" strokeWidth="1" />
                    <text x="18" y={y + 4} fill={basemapStyle === 'satellite' ? '#94a3b8' : '#334155'} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {lat}°N
                    </text>
                  </g>
                );
              })}

              {/* Longitude lines (every 5 degrees from 65E to 95E) */}
              {[65, 70, 75, 80, 85, 90, 95].map((lng) => {
                const { x } = project(lng, mapBounds.minLat);
                return (
                  <g key={`lng-${lng}`}>
                    <line x1={x} y1="35" x2={x} y2={svgHeight - 40} stroke={basemapStyle === 'satellite' ? '#475569' : '#64748b'} strokeDasharray="3 4" strokeWidth="1" />
                    <text x={x - 10} y={svgHeight - 20} fill={basemapStyle === 'satellite' ? '#94a3b8' : '#334155'} fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {lng}°E
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 4. Ocean Thermal Heat Layer (TCHCP) if active */}
          {satelliteColorMode === 'TCHCP' && showSatelliteIR && (
            <circle cx={svgWidth * 0.65} cy={svgHeight * 0.45} r={280} fill="url(#tchcpOceanHeat)" />
          )}

          {/* 5. Storm Surge Coastal Hazard Overlay along Threatened Coastline */}
          {showSurgeHazard && (
            <g id="surge-hazard-ribbon">
              {/* Glowing hazard line along Dhamra - Balasore - Digha - Sundarbans */}
              <path
                d="M 610,195 Q 645,175 690,165 T 735,175"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.8"
                filter="url(#surgeGlow)"
              />
              <path
                d="M 610,195 Q 645,175 690,165 T 735,175"
                fill="none"
                stroke="#fecdd3"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              {/* Surge Warning Tag */}
              <rect x="635" y="140" width="135" height="22" rx="4" fill="#881337" stroke="#fda4af" strokeWidth="1" />
              <text x="642" y="155" fill="#ffffff" fontSize="10" fontWeight="bold">
                Storm Surge 2.5m - 4.0m
              </text>
            </g>
          )}

          {/* 6. Forecast Cone of Uncertainty */}
          {showForecastCone && conePath && (
            <path
              d={conePath}
              fill="#3b82f6"
              fillOpacity="0.18"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* 7. Trajectory Path: Observed & Forecast */}
          {observedPath && (
            <path
              d={observedPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 8. Trajectory Waypoint Nodes */}
          {trajectoryPoints.map((tp, idx) => {
            const pt = project(tp.lng, tp.lat);
            const isForecast = tp.time.includes('(Fcst)') || tp.time.startsWith('+');
            const isCurrent = idx === currentPointIndex;

            return (
              <g
                key={`wp-${idx}`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setActiveWaypointIndex(idx)}
                onMouseEnter={() =>
                  setHoveredPoint({
                    x: pt.x,
                    y: pt.y,
                    title: `${activeCyclone?.name} • Waypoint ${idx + 1}`,
                    details: [
                      `Time: ${tp.time}`,
                      `Coords: ${tp.lat.toFixed(2)}°N, ${tp.lng.toFixed(2)}°E`,
                      `Intensity: ${tp.windSpeedKmh} km/h (${Math.round(tp.windSpeedKmh / 1.852)} kt)`,
                      `Classification: ${isForecast ? 'MOSDAC Forecast Step' : 'Official IMD Observation'}`,
                    ],
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCurrent ? 7 : isForecast ? 4.5 : 5}
                  fill={isCurrent ? '#ffffff' : isForecast ? '#f59e0b' : '#ef4444'}
                  stroke={isCurrent ? '#3b82f6' : '#0f172a'}
                  strokeWidth={isCurrent ? 3 : 1.5}
                />
                {/* Date/hour label on selected nodes */}
                {(idx === 0 || idx === trajectoryPoints.length - 1 || idx % 3 === 0 || isCurrent) && (
                  <text
                    x={pt.x + 9}
                    y={pt.y + 3}
                    fill={isCurrent ? '#ffffff' : '#cbd5e1'}
                    fontSize="9.5"
                    fontFamily="sans-serif"
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                    className="select-none drop-shadow"
                  >
                    {tp.time.replace(' (Fcst)', '')}
                  </text>
                )}
              </g>
            );
          })}

          {/* 9. SCAT Wind Isotachs (Wind Radii Envelopes around Storm Center) */}
          {showWindIsotachs && (
            <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
              {/* 34 kt (Gale) Radius: approx 180-220 km */}
              <circle
                cx="0"
                cy="0"
                r="72"
                fill="#f59e0b"
                fillOpacity="0.08"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text x="52" y="-52" fill="#fbbf24" fontSize="8.5" fontFamily="monospace">
                34 kt (Gale)
              </text>

              {/* 50 kt (Storm) Radius: approx 110-140 km */}
              <circle
                cx="0"
                cy="0"
                r="45"
                fill="#f97316"
                fillOpacity="0.12"
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <text x="32" y="-32" fill="#fdba74" fontSize="8.5" fontFamily="monospace">
                50 kt
              </text>

              {/* 64 kt (Hurricane) Radius: approx 60-80 km */}
              <circle
                cx="0"
                cy="0"
                r="26"
                fill="#ef4444"
                fillOpacity="0.2"
                stroke="#ef4444"
                strokeWidth="1.5"
              />
              <text x="18" y="-18" fill="#fca5a5" fontSize="8" fontFamily="monospace">
                64 kt
              </text>
            </g>
          )}

          {/* 10. Multi-Spectral INSAT-3DS Satellite Cloud Spiral Vortex */}
          {showSatelliteIR && (
            <g
              transform={`translate(${currentPos.x}, ${currentPos.y})`}
              className={animateVortex ? 'animate-[spin_40s_linear_infinite]' : ''}
              style={{ transformOrigin: `${currentPos.x}px ${currentPos.y}px` }}
            >
              {/* Outer feeder cloud bands */}
              <path
                d="M 0,0 Q -90,-40 -120,-10 C -140,20 -90,90 -20,110 Q 50,120 100,70 Q 140,30 110,-40 Q 80,-100 -20,-110"
                fill={
                  satelliteColorMode === 'WV'
                    ? 'url(#cycloneVortexWV)'
                    : satelliteColorMode === 'VIS'
                    ? 'url(#cycloneVortexVIS)'
                    : 'url(#cycloneVortexIR)'
                }
                opacity="0.85"
              />

              {/* Central Dense Overcast (CDO) Core */}
              <circle
                cx="0"
                cy="0"
                r="50"
                fill={
                  satelliteColorMode === 'WV'
                    ? 'url(#cycloneVortexWV)'
                    : satelliteColorMode === 'VIS'
                    ? 'url(#cycloneVortexVIS)'
                    : 'url(#cycloneVortexIR)'
                }
                opacity="0.95"
              />

              {/* Eye of the storm */}
              <circle cx="0" cy="0" r="7" fill="#040914" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* 11. Storm Center Label & Vital Telemetry */}
          <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
            {/* Pulsing center radar beacon */}
            <circle cx="0" cy="0" r="14" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.7">
              <animate attributeName="r" values="7;24;7" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.5s" repeatCount="indefinite" />
            </circle>

            {/* Label Card */}
            <g transform="translate(18, -32)">
              <rect width="136" height="48" rx="6" fill="#0a1324" stroke="#3b82f6" strokeWidth="1.5" opacity="0.92" />
              <text x="8" y="16" fill="#ffffff" fontWeight="bold" fontSize="12" fontFamily="sans-serif">
                {activeCyclone?.name || 'Cyclone Vortex'}
              </text>
              <text x="8" y="30" fill="#60a5fa" fontSize="10" fontFamily="sans-serif">
                {activeCyclone?.category || 'Cyclonic Storm'}
              </text>
              <text x="8" y="42" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {activeCyclone?.maxWindKmh || 95} km/h • {activeCyclone?.pressureHpa || 985} hPa
              </text>
            </g>
          </g>

          {/* 12. Coastal Cities, Ports & Landfall Anchors */}
          {showCities && (
            <g id="coastal-ports-cities">
              {COASTAL_POINTS.map((city) => {
                const pt = project(city.lng, city.lat);
                const isPort = city.type === 'port';
                return (
                  <g
                    key={city.name}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      const dist = calculateDistanceKm(
                        currentLat,
                        currentLng,
                        city.lat,
                        city.lng
                      );
                      setHoveredPoint({
                        x: pt.x,
                        y: pt.y,
                        title: `${city.name} (${city.state})`,
                        details: [
                          `Type: ${isPort ? 'Major Port & Harbour' : 'Coastal District'}`,
                          `Population: ${city.pop}`,
                          `Distance to Storm Eye: ${dist} km`,
                          `Coords: ${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E`,
                        ],
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isPort ? 3.5 : 2.5}
                      fill={isPort ? '#38bdf8' : '#94a3b8'}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x + 6}
                      y={pt.y + 3}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontFamily="sans-serif"
                      className="drop-shadow pointer-events-none"
                    >
                      {city.name.replace(' Port', '')}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Inspection Card / Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-3 text-xs text-white max-w-xs backdrop-blur-md"
            style={{
              left: Math.min(window.innerWidth > 640 ? 550 : 250, hoveredPoint.x + 15),
              top: Math.max(10, hoveredPoint.y - 20),
            }}
          >
            <div className="font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{hoveredPoint.title}</span>
            </div>
            <div className="space-y-1 text-slate-200">
              {hoveredPoint.details.map((d, i) => (
                <div key={i} className="text-[11px] leading-tight">
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Map Navigation & Zoom Widget */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Distance to Coast & Landfall ETA Alert Bar */}
        {nearestCityInfo && (
          <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 shadow-lg text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-400 rotate-45" />
              <div>
                <span className="text-slate-400 block text-[10px]">Nearest Coastline / Port</span>
                <span className="font-semibold text-white">
                  {nearestCityInfo.distanceKm} km from {nearestCityInfo.city.name}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">Forward Speed</span>
              <span className="font-semibold text-cyan-300">
                {activeCyclone?.movement.direction || 'NNW'} at {activeCyclone?.movement.speedKmh || 15} km/h
              </span>
            </div>
          </div>
        )}

        {/* Bottom Trajectory Time Scrubber & Legend Panel */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
          {/* Play / Pause Time Scrubber */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleScrubber}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
              title={isPlayingScrubber ? 'Pause Track Playback' : 'Play Historical & Forecast Track'}
            >
              {isPlayingScrubber ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingScrubber ? 'Pause' : 'Track Play'}</span>
            </button>

            {trajectoryPoints.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-300 font-mono">
                  {currentTrackPoint?.time || 'Current Position'}
                </span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, trajectoryPoints.length - 1)}
                  value={currentPointIndex}
                  onChange={(e) => setActiveWaypointIndex(parseInt(e.target.value, 10))}
                  className="w-24 sm:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
          </div>

          {/* Meteorological Color Legend */}
          <div className="flex items-center gap-3 overflow-x-auto text-[10px] text-slate-300">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Observed Track</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Forecast Track</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400/40 border border-blue-400 inline-block" />
              <span>Cone (+72h)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span>Surge Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
