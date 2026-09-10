import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Eye,
  Shield,
  Wind,
  Anchor,
  Database,
  ExternalLink,
  RotateCcw,
  Navigation,
  ChevronDown,
  SlidersHorizontal,
  X,
  Info,
} from 'lucide-react';
import { CycloneData, TrajectoryPoint } from '../../types';
import { getMosdacCycloneCatalog } from '../../services/mosdacService';

// Fix standard Leaflet default marker icons if loaded via bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletCycloneMapProps {
  cyclones: CycloneData[];
  selectedCycloneId?: string | null;
  onSelectCyclone?: (id: string) => void;
  height?: string;
  showControls?: boolean;
  emptyStateMessage?: string;
}

// Major strategic coastal ports & meteorological Doppler radar stations in North Indian Ocean (Real Map of India)
const COASTAL_LANDMARKS = [
  // Odisha Coast
  { name: 'Paradip Port', lat: 20.26, lng: 86.67, state: 'Odisha', signal: 'Port Signal No. 10 (Great Danger)', type: 'Major Port' },
  { name: 'Dhamra Port', lat: 20.81, lng: 86.97, state: 'Odisha', signal: 'Port Signal No. 10 (Great Danger)', type: 'Deep Water Port' },
  { name: 'Gopalpur Port', lat: 19.31, lng: 84.97, state: 'Odisha', signal: 'Port Signal No. 8 (Danger Signal)', type: 'Port / Radar' },
  { name: 'Puri / Chandipur', lat: 19.81, lng: 85.83, state: 'Odisha', signal: 'Storm Warning Zone', type: 'Coastal Surveillance' },

  // West Bengal Coast
  { name: 'Kolkata (DWR)', lat: 22.57, lng: 88.36, state: 'West Bengal', signal: 'Port Signal No. 8', type: 'Doppler Weather Radar' },
  { name: 'Haldia Port', lat: 22.03, lng: 88.08, state: 'West Bengal', signal: 'Port Signal No. 9 (Great Danger)', type: 'Major Port' },
  { name: 'Digha / Sagar Island', lat: 21.62, lng: 87.52, state: 'West Bengal', signal: 'Severe Surge Alert', type: 'Tide Gauge Station' },

  // Andhra Pradesh Coast
  { name: 'Visakhapatnam (DWR)', lat: 17.68, lng: 83.21, state: 'Andhra Pradesh', signal: 'Port Signal No. 4', type: 'Doppler Weather Radar & Naval Hub' },
  { name: 'Machilipatnam (DWR)', lat: 16.18, lng: 81.13, state: 'Andhra Pradesh', signal: 'Port Signal No. 3', type: 'Doppler Weather Radar' },
  { name: 'Kakinada Deep Water', lat: 16.98, lng: 82.28, state: 'Andhra Pradesh', signal: 'Port Signal No. 3', type: 'Major Port' },
  { name: 'Sriharikota (SDSC)', lat: 13.72, lng: 80.23, state: 'Andhra Pradesh', signal: 'ISRO Spaceport Watch', type: 'Space & Met Centre' },

  // Tamil Nadu Coast
  { name: 'Chennai (DWR)', lat: 13.08, lng: 80.29, state: 'Tamil Nadu', signal: 'Port Signal No. 3', type: 'Doppler Weather Radar & Major Port' },
  { name: 'Nagapattinam Port', lat: 10.76, lng: 79.84, state: 'Tamil Nadu', signal: 'Port Signal No. 3', type: 'Port' },
  { name: 'Pamban / Rameswaram', lat: 9.28, lng: 79.31, state: 'Tamil Nadu', signal: 'Marine Alert', type: 'Strait Watch' },
  { name: 'Kanyakumari', lat: 8.08, lng: 77.55, state: 'Tamil Nadu', signal: 'Southern Maritime Junction', type: 'Cape Station' },

  // Kerala & Arabian Sea Coast
  { name: 'Kochi (DWR)', lat: 9.93, lng: 76.26, state: 'Kerala', signal: 'Arabian Sea Fleet Watch', type: 'Doppler Weather Radar & Naval Base' },
  { name: 'Thiruvananthapuram', lat: 8.52, lng: 76.93, state: 'Kerala', signal: 'Met Station', type: 'Coastal Watch' },

  // Karnataka & Goa
  { name: 'New Mangalore Port', lat: 12.92, lng: 74.82, state: 'Karnataka', signal: 'Port Caution No. 2', type: 'Major Port' },
  { name: 'Mormugao Port', lat: 15.41, lng: 73.80, state: 'Goa', signal: 'Port Caution No. 2', type: 'Major Port' },

  // Maharashtra
  { name: 'Mumbai (DWR & JNPT)', lat: 18.95, lng: 72.95, state: 'Maharashtra', signal: 'Doppler Radar Monitoring', type: 'Doppler Radar & Mega Port' },
  { name: 'Ratnagiri Coast', lat: 16.99, lng: 73.30, state: 'Maharashtra', signal: 'Coastal Watch', type: 'Met Station' },

  // Gujarat Coast
  { name: 'Kandla / Deendayal Port', lat: 23.01, lng: 70.22, state: 'Gujarat', signal: 'Gulf of Kutch Hub', type: 'Major Port' },
  { name: 'Porbandar Coast', lat: 21.64, lng: 69.60, state: 'Gujarat', signal: 'Arabian Sea Watch', type: 'Port & Coast Guard' },
  { name: 'Dwarka / Okha', lat: 22.24, lng: 68.96, state: 'Gujarat', signal: 'Cyclone Caution', type: 'Tide & Lighthouse' },
  { name: 'Veraval Port', lat: 20.90, lng: 70.37, state: 'Gujarat', signal: 'Saurashtra Hub', type: 'Fishing & Cargo Port' },

  // Island Territories
  { name: 'Port Blair (DWR)', lat: 11.66, lng: 92.74, state: 'Andaman & Nicobar', signal: 'Genesis Watch Hub', type: 'Doppler Weather Radar' },
  { name: 'Car Nicobar', lat: 9.17, lng: 92.78, state: 'Andaman & Nicobar', signal: 'Early Alert Outpost', type: 'Island Station' },
  { name: 'Agatti / Kavaratti', lat: 10.85, lng: 72.19, state: 'Lakshadweep', signal: 'Arabian Sea Outpost', type: 'Island Met Centre' },

  // Neighboring Basin Outposts
  { name: 'Chittagong Port', lat: 22.33, lng: 91.83, state: 'Bangladesh', signal: 'Danger Signal 9', type: 'Port' },
  { name: 'Cox\'s Bazar', lat: 21.42, lng: 91.97, state: 'Bangladesh', signal: 'Danger Signal 8', type: 'Radar Station' },
];

export const LeafletCycloneMap: React.FC<LeafletCycloneMapProps> = ({
  cyclones,
  selectedCycloneId,
  onSelectCyclone,
  height = '540px',
  showControls = true,
  emptyStateMessage,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const wmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const lastFocusedCycloneRef = useRef<string | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Map settings state
  const [baseMap, setBaseMap] = useState<'dark' | 'satellite' | 'streets'>('streets');
  const [showPorts, setShowPorts] = useState(true);
  const [showWindRadii, setShowWindRadii] = useState(true);
  const [showCone, setShowCone] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [showSatelliteWMS, setShowSatelliteWMS] = useState(false);
  const [radarFrames, setRadarFrames] = useState<Array<{ time: number; path: string }>>([]);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [radarFrameIndex, setRadarFrameIndex] = useState(-1);
  const [wmsPath, setWmsPath] = useState<string | null>(null);
  const [layerStatus, setLayerStatus] = useState('Live layers ready');
  const [activeWaypoint, setActiveWaypoint] = useState<TrajectoryPoint | null>(null);

  // Map tools dropdown & empty-state message states
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isEmptyStateDismissed, setIsEmptyStateDismissed] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    }
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen]);

  const activeCyclone = useMemo(() => {
    return selectedCycloneId ? cyclones.find((c) => c.id === selectedCycloneId) || null : null;
  }, [cyclones, selectedCycloneId]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on North Indian Ocean basin (lat: 16.5, lng: 84.5)
    const map = L.map(mapContainerRef.current, {
      center: [16.5, 84.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap is a public, API-key-free basemap. Keep its required attribution visible.
    const tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    const featureGroup = L.featureGroup().addTo(map);
    featureGroupRef.current = featureGroup;

    mapInstanceRef.current = map;

    // Leaflet calculates its dimensions while a PWA route can still be hidden.
    // Observe layout changes so navigating between tabs never leaves a stale map.
    resizeObserverRef.current = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let options: L.TileLayerOptions = {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

    if (baseMap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      options = { maxZoom: 18, attribution: 'Tiles &copy; Esri' };
    } else if (baseMap === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' };
    }

    const newTileLayer = L.tileLayer(url, options).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [baseMap]);

  // Get real, timestamped radar frames only when the overlay is requested.
  useEffect(() => {
    if (!showRadar || radarFrames.length > 0) return;
    fetch('/api/radar/frames')
      .then((res) => {
        if (!res.ok) throw new Error('Radar source unavailable');
        return res.json();
      })
      .then((data) => {
        const frames = Array.isArray(data.frames) ? data.frames : [];
        setRadarFrames(frames);
        setRadarHost(data.host || 'https://tilecache.rainviewer.com');
        setRadarFrameIndex(frames.length - 1);
        setLayerStatus(frames.length ? `Radar frame: ${new Date(frames[frames.length - 1].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Radar coverage unavailable');
      })
      .catch(() => setLayerStatus('Live radar is temporarily unavailable'));
  }, [showRadar, radarFrames.length]);

  // Render the selected raw RainViewer radar tile frame as a Leaflet overlay.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    radarLayerRef.current?.remove();
    radarLayerRef.current = null;
    const frame = radarFrames[radarFrameIndex];
    if (showRadar && frame) {
      radarLayerRef.current = L.tileLayer(`${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
        opacity: 0.72,
        zIndex: 240,
        attribution: '© RainViewer',
      }).addTo(map);
    }
  }, [showRadar, radarFrames, radarFrameIndex, radarHost]);

  // Load the newest official MOSDAC satellite dataset for the selected storm.
  useEffect(() => {
    if (!showSatelliteWMS || !activeCyclone) return;
    getMosdacCycloneCatalog(activeCyclone.name.replace(/^Cyclone\s+/i, ''))
      .then((datasets) => {
        const latest = datasets[datasets.length - 1];
        if (!latest) throw new Error('No WMS dataset');
        setWmsPath(latest.urlPath);
        setLayerStatus(`Raw MOSDAC WMS: ${latest.name}`);
      })
      .catch(() => {
        setWmsPath(null);
        setLayerStatus('Raw MOSDAC WMS is unavailable for this storm');
      });
  }, [showSatelliteWMS, activeCyclone?.id]);

  // Raw WMS tiles use the map BBOX/zoom supplied by Leaflet — not a stretched image.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    wmsLayerRef.current?.remove();
    wmsLayerRef.current = null;
    if (showSatelliteWMS && wmsPath) {
      wmsLayerRef.current = L.tileLayer.wms(`/api/mosdac/wms-tile?urlPath=${encodeURIComponent(wmsPath)}`, {
        layers: 'IMG_TIR1', styles: 'boxfill/greyscale', format: 'image/png', transparent: true,
        version: '1.3.0', crs: L.CRS.EPSG3857, opacity: 0.62, zIndex: 230,
        attribution: '© ISRO MOSDAC',
      }).addTo(map);
    }
  }, [showSatelliteWMS, wmsPath]);

  // 3. Render Accurate MOSDAC Cyclone Track & Telemetry Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = featureGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Render Coastal Ports & Radars if enabled
    if (showPorts) {
      COASTAL_LANDMARKS.forEach((port) => {
        const portIcon = L.divIcon({
          className: 'custom-port-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900 shadow-md"></div>
              <div class="absolute left-4 whitespace-nowrap text-[10px] font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                ${port.name}
              </div>
            </div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([port.lat, port.lng], { icon: portIcon });
        marker.bindPopup(`
          <div class="p-2 text-xs font-sans text-slate-900">
            <div class="font-bold text-sm text-cyan-700">${port.name}</div>
            <div class="text-slate-600">${port.state} • Coastal Sector</div>
            <div class="mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded text-[11px]">
              ${port.signal}
            </div>
            <div class="mt-1 text-[10px] text-slate-500">Coordinates: ${port.lat.toFixed(2)}°N, ${port.lng.toFixed(2)}°E</div>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // Render All Cyclones
    cyclones.forEach((cyclone) => {
      const isSelected = cyclone.id === selectedCycloneId || cyclone === activeCyclone;
      const points = cyclone.trajectoryPoints || [];
      const isSevere = cyclone.maxWindKnots >= 64;
      const strokeColor = isSevere ? '#ef4444' : cyclone.maxWindKnots >= 48 ? '#f97316' : '#3b82f6';

      // 3A. Draw Trajectory Line from MOSDAC coordinates
      if (points.length > 0) {
        const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);

        // Main track polyline
        const polyline = L.polyline(latLngs, {
          color: strokeColor,
          weight: isSelected ? 3.5 : 2.5,
          opacity: isSelected ? 0.95 : 0.7,
          dashArray: '5, 5',
        });
        group.addLayer(polyline);

        // 3B. Waypoint Markers along the accurate track
        points.forEach((pt, index) => {
          const isLatest = index === points.length - 1;
          const isForecast = pt.time.toLowerCase().includes('fcst');
          const circleColor = isForecast ? '#38bdf8' : strokeColor;

          const circleMarker = L.circleMarker([pt.lat, pt.lng], {
            radius: isLatest ? 6 : isForecast ? 4 : 4.5,
            fillColor: circleColor,
            fillOpacity: 0.9,
            color: '#ffffff',
            weight: isLatest ? 2 : 1,
          });

          circleMarker.bindTooltip(
            `<b>${cyclone.name}</b><br/>${pt.time}<br/>Wind: ${pt.windSpeedKmh} km/h (${Math.round(pt.windSpeedKmh / 1.852)} kt)`,
            { direction: 'top', offset: [0, -5], className: 'map-tooltip' }
          );

          circleMarker.on('click', () => {
            setActiveWaypoint(pt);
            if (onSelectCyclone) onSelectCyclone(cyclone.id);
          });

          group.addLayer(circleMarker);
        });

        // 3C. 120-hour Cone of Uncertainty if selected and enabled
        if (isSelected && showCone && points.length >= 2) {
          const lastPoint = points[points.length - 1];
          const coneRadiusKm = Math.min(300, 75 + points.length * 15);

          const coneCircle = L.circle([lastPoint.lat, lastPoint.lng], {
            radius: coneRadiusKm * 1000,
            color: strokeColor,
            fillColor: strokeColor,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4',
          });
          group.addLayer(coneCircle);
        }
      }

      // 3D. Active Storm Eye Center Vortex
      const eyeLat = cyclone.coordinates.lat;
      const eyeLng = cyclone.coordinates.lng;

      // 64-kt (Hurricane force) and 34-kt (Gale force) wind radii
      if (isSelected && showWindRadii) {
        // Gale wind radius (~180 km)
        const galeCircle = L.circle([eyeLat, eyeLng], {
          radius: 180000,
          color: '#eab308',
          fillColor: '#eab308',
          fillOpacity: 0.08,
          weight: 1,
        });
        group.addLayer(galeCircle);

        // Destructive core wind radius (~70 km)
        const coreCircle = L.circle([eyeLat, eyeLng], {
          radius: 70000,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 1.5,
        });
        group.addLayer(coreCircle);
      }

      // Vortex Marker Icon with Animated Pulsing CSS
      const vortexIcon = L.divIcon({
        className: 'cyclone-vortex-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-12 h-12 rounded-full ${isSevere ? 'bg-rose-500/30 border-rose-500' : 'bg-blue-500/30 border-blue-500'} border animate-ping"></div>
            <div class="w-8 h-8 rounded-full ${isSevere ? 'bg-rose-600' : 'bg-blue-600'} border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black">
              🌀
            </div>
            <div class="absolute top-9 whitespace-nowrap bg-slate-950/90 text-white font-bold px-2 py-0.5 rounded-md border border-slate-700 text-xs shadow-lg">
              ${cyclone.name} (${cyclone.maxWindKmh} km/h)
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const eyeMarker = L.marker([eyeLat, eyeLng], { icon: vortexIcon });

      eyeMarker.bindPopup(`
        <div class="p-3 text-xs font-sans text-slate-900 min-w-[220px]">
          <div class="flex items-center justify-between border-b pb-1.5 mb-2">
            <span class="font-extrabold text-sm text-slate-900">${cyclone.name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isSevere ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}">
              ${cyclone.category}
            </span>
          </div>
          <div class="space-y-1 text-slate-700">
            <div><b>Basin:</b> ${cyclone.basin}</div>
            <div><b>Current Position:</b> ${cyclone.coordinates.latStr}, ${cyclone.coordinates.lngStr}</div>
            <div><b>Max Sustained Wind:</b> <span class="font-bold text-rose-600">${cyclone.maxWindKmh} km/h</span> (${cyclone.maxWindKnots} kt)</div>
            <div><b>Central Pressure:</b> <span class="font-bold text-blue-600">${cyclone.pressureHpa} hPa</span></div>
            <div><b>Movement:</b> ${cyclone.movement.direction} at ${cyclone.movement.speedKmh} km/h</div>
            <div><b>Rapid Intensification Index:</b> ${cyclone.riIndex} / 100 (${cyclone.riProbability24h}% prob)</div>
          </div>
          <div class="mt-2.5 pt-2 border-t text-[10px] text-slate-500 flex items-center justify-between">
            <span>ISRO MOSDAC Verified</span>
            <a href="https://mosdac.gov.in/scorpio/" target="_blank" class="text-blue-600 font-semibold underline">MOSDAC SCORPIO</a>
          </div>
        </div>
      `);

      eyeMarker.on('click', () => {
        if (onSelectCyclone) onSelectCyclone(cyclone.id);
      });

      group.addLayer(eyeMarker);
    });

    // Focus only when a different storm is selected. Previously this ran on every
    // layer/state render, which made navigation and manual panning snap back.
    if (activeCyclone && lastFocusedCycloneRef.current !== activeCyclone.id) {
      lastFocusedCycloneRef.current = activeCyclone.id;
      map.flyTo([activeCyclone.coordinates.lat, activeCyclone.coordinates.lng], 6, { animate: true, duration: 0.7 });
    }
  }, [cyclones, selectedCycloneId, activeCyclone, showPorts, showWindRadii, showCone, onSelectCyclone]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([17.5, 82.5], 5);
    }
  };

  const handleZoomRegion = (region: 'india' | 'bob' | 'arabian' | 'storm') => {
    if (!mapInstanceRef.current) return;
    if (region === 'india') {
      mapInstanceRef.current.fitBounds([
        [7.0, 68.0],
        [35.5, 97.0],
      ]);
    } else if (region === 'bob') {
      mapInstanceRef.current.fitBounds([
        [6.0, 79.0],
        [23.5, 96.0],
      ]);
    } else if (region === 'arabian') {
      mapInstanceRef.current.fitBounds([
        [8.0, 62.0],
        [25.0, 77.5],
      ]);
    } else if (region === 'storm' && activeCyclone) {
      mapInstanceRef.current.flyTo(
        [activeCyclone.coordinates.lat, activeCyclone.coordinates.lng],
        7,
        { duration: 1.2 }
      );
    }
  };

  const handleFocusCyclone = (lat: number, lng: number) => {
    mapInstanceRef.current?.flyTo([lat, lng], 7, { duration: 1.2 });
  };

  return (
    <div id="leaflet-cyclone-map-container" className="relative z-0 isolate w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#060b16]" style={{ height }}>
      {/* Top Map Header & Region Bar */}
      <div
        className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-1.5 max-w-[calc(100%-24px)] overflow-x-auto scrollbar-none pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Left: Basin Title & Source badge + Region Quick Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/90 text-xs shadow-lg shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white whitespace-nowrap">India &amp; NIO GIS Radar</span>
          <span className="text-slate-500">|</span>
          <a
            href="https://mosdac.gov.in/scorpio/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
          >
            <Database className="w-3 h-3" />
            <span>MOSDAC</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Region Jump Buttons */}
        <div className="flex items-center rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 p-0.5 text-[11px] shadow-lg shrink-0">
          <button
            type="button"
            onClick={() => handleZoomRegion('india')}
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition cursor-pointer whitespace-nowrap"
            title="Fit to Real Map of India Subcontinent"
          >
            🇮🇳 India
          </button>
          <button
            type="button"
            onClick={() => handleZoomRegion('bob')}
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition cursor-pointer whitespace-nowrap"
            title="Zoom to Bay of Bengal"
          >
            🌊 Bay of Bengal
          </button>
          <button
            type="button"
            onClick={() => handleZoomRegion('arabian')}
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition cursor-pointer whitespace-nowrap"
            title="Zoom to Arabian Sea"
          >
            ⛵ Arabian Sea
          </button>
          {activeCyclone && (
            <button
              type="button"
              onClick={() => handleZoomRegion('storm')}
              className="px-2 py-1 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/60 font-medium transition cursor-pointer whitespace-nowrap"
              title={`Focus on ${activeCyclone.name}`}
            >
              🎯 {activeCyclone.name}
            </button>
          )}
        </div>
      </div>

      {/* Floating Extreme Left Toolbar: Map Tools (below top options) + Cyclone Selector */}
      <div
        className="absolute top-12 left-3 z-[1000] flex flex-col items-start gap-2 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Map Tools Dropdown */}
        <div ref={toolsRef} className="relative">
          <button
            type="button"
            onClick={() => setIsToolsOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-lg transition backdrop-blur-md cursor-pointer ${
              isToolsOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/20'
                : 'bg-slate-950/90 hover:bg-slate-900 text-slate-200 border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Map Tools</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {(showPorts ? 1 : 0) + (showWindRadii ? 1 : 0) + (showCone ? 1 : 0) + (showRadar ? 1 : 0) + (showSatelliteWMS ? 1 : 0)}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isToolsOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 shadow-2xl p-3 z-[1100] flex flex-col gap-3 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Basemap section */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-400" />
                  <span>Basemap Style</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBaseMap('dark')}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] text-center transition cursor-pointer ${
                      baseMap === 'dark' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseMap('satellite')}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] text-center transition cursor-pointer ${
                      baseMap === 'satellite' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseMap('streets')}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] text-center transition cursor-pointer ${
                      baseMap === 'streets' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Terrain
                  </button>
                </div>
              </div>

              {/* Feature / Layer Toggles */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Layers &amp; Overlays
                </div>
                <div className="flex flex-col gap-1.5">
                  {/* Ports */}
                  <button
                    type="button"
                    onClick={() => setShowPorts((p) => !p)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      showPorts
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Coastal Ports &amp; Doppler</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showPorts ? 'bg-cyan-900/70 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>
                      {showPorts ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Wind Radii */}
                  <button
                    type="button"
                    onClick={() => setShowWindRadii((p) => !p)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      showWindRadii
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-amber-400" />
                      <span>Wind Radii Isotachs</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showWindRadii ? 'bg-amber-900/70 text-amber-200' : 'bg-slate-800 text-slate-500'}`}>
                      {showWindRadii ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Forecast Cone */}
                  <button
                    type="button"
                    onClick={() => setShowCone((p) => !p)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      showCone
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>120h Forecast Cone</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showCone ? 'bg-rose-900/70 text-rose-200' : 'bg-slate-800 text-slate-500'}`}>
                      {showCone ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Live Radar */}
                  <button
                    type="button"
                    onClick={() => setShowRadar((p) => !p)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      showRadar
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Rain Radar</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showRadar ? 'bg-emerald-900/70 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}>
                      {showRadar ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Raw WMS */}
                  <button
                    type="button"
                    onClick={() => setShowSatelliteWMS((p) => !p)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      showSatelliteWMS
                        ? 'bg-violet-950/80 text-violet-300 border-violet-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span>Raw INSAT WMS</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showSatelliteWMS ? 'bg-violet-900/70 text-violet-200' : 'bg-slate-800 text-slate-500'}`}>
                      {showSatelliteWMS ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cyclone Selector Buttons (only if multiple cyclones present) */}
        {cyclones.length > 1 && (
          <div className="flex flex-col gap-1.5 max-w-[170px]">
            {cyclones.map((c) => {
              const isSelected = c.id === selectedCycloneId || c === activeCyclone;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (onSelectCyclone) onSelectCyclone(c.id);
                    handleFocusCyclone(c.coordinates.lat, c.coordinates.lng);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-left text-xs transition shadow-lg cursor-pointer flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 font-bold'
                      : 'bg-slate-950/85 hover:bg-slate-800 text-slate-300 border-slate-800 backdrop-blur-md'
                  }`}
                >
                  <div className="truncate">
                    <div className="leading-tight">{c.name}</div>
                    <div className="text-[10px] opacity-80">{c.maxWindKmh} km/h • {c.pressureHpa} hPa</div>
                  </div>
                  <Navigation className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Right Map Zoom & Reset Tool Controls */}
      {showControls && (
        <div
          className="absolute bottom-6 right-3 z-[1000] flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Basin View (Bay of Bengal & Arabian Sea)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {showRadar && radarFrames.length > 1 && (
        <div
          className="absolute bottom-20 right-3 z-[1000] flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-1.5 text-[10px] shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button onClick={() => setRadarFrameIndex((i) => Math.max(0, i - 1))} className="px-1.5 py-1 text-slate-300 hover:text-white" title="Previous radar frame">‹</button>
          <span className="text-emerald-300 whitespace-nowrap">{radarFrameIndex + 1}/{radarFrames.length}</span>
          <button onClick={() => setRadarFrameIndex((i) => Math.min(radarFrames.length - 1, i + 1))} className="px-1.5 py-1 text-slate-300 hover:text-white" title="Next radar frame">›</button>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      {activeCyclone && (
        <div
          className="absolute bottom-3 left-3 right-16 z-[1000] bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/90 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Selected Focus:</span>
              <span className="font-bold text-white">{activeCyclone.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                {activeCyclone.category}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-slate-300">
              <span>Fix: <b>{activeCyclone.coordinates.latStr}, {activeCyclone.coordinates.lngStr}</b></span>
              <span>•</span>
              <span>Wind: <b className="text-rose-400">{activeCyclone.maxWindKmh} km/h</b> ({activeCyclone.maxWindKnots} kt)</span>
              <span>•</span>
              <span>Pressure: <b className="text-blue-400">{activeCyclone.pressureHpa} hPa</b></span>
              <span>•</span>
              <span>Heading: <b>{activeCyclone.movement.direction} ({activeCyclone.movement.speedKmh} km/h)</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Points: {activeCyclone.trajectoryPoints?.length || 0} track fixes</span>
            <span className="text-emerald-400 font-semibold">• {layerStatus}</span>
          </div>
        </div>
      )}

      {/* Center empty state card with Dismiss button */}
      {!activeCyclone && emptyStateMessage && !isEmptyStateDismissed && (
        <div className="absolute inset-0 z-[950] flex items-center justify-center pointer-events-none px-6">
          <div
            className="relative max-w-md rounded-2xl border border-slate-700 bg-slate-950/95 backdrop-blur-md px-6 py-5 text-center shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Close X button */}
            <button
              type="button"
              onClick={() => setIsEmptyStateDismissed(true)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-white pr-6">No active cyclone in the North Indian Ocean</div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{emptyStateMessage}</p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsEmptyStateDismissed(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-md"
              >
                Dismiss &amp; Explore Map
              </button>
            </div>
            <p className="mt-2.5 text-[10px] font-medium text-emerald-400">MOSDAC SCORPIO live-status feed</p>
          </div>
        </div>
      )}

      {/* Discrete bottom pill if user dismissed the empty state message */}
      {!activeCyclone && emptyStateMessage && isEmptyStateDismissed && (
        <button
          type="button"
          onClick={() => setIsEmptyStateDismissed(false)}
          className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs shadow-lg backdrop-blur-md transition cursor-pointer pointer-events-auto"
          title="Click to re-open notification"
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>No active storm in live feed</span>
        </button>
      )}

      {/* Actual Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
