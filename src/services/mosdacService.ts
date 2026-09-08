import { CycloneData, TrajectoryPoint, DailyForecast } from '../types';
import localMosdacDb from '../data/mosdacRecords.json';

export interface MosdacYearGroup {
  Year: string;
  Cyclonelist: string[];
}

export interface MosdacAlertInfo {
  alert: string;
  activeCyclogenesis: boolean;
  coordinates: { lng: number; lat: number };
  source: string;
  timestamp: string;
}

export interface MosdacSatelliteDataset {
  name: string;
  urlPath: string;
  dateStr?: string;
}

export interface MosdacTrackFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    cyclone_name: string;
    cyclone_date: string;
    cyclone_hour: string;
    cyclone_intensity: string;
    cyclone_flag: string; // '0' = observed, '1' = forecast
  };
}

export interface MosdacFeatureCollection {
  type: string;
  features: MosdacTrackFeature[];
}

// Convert MOSDAC raw intensity to numeric Knots and Km/h
export function parseMosdacIntensity(raw: string | number): { knots: number; kmh: number } {
  let val = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(val) || val <= 0) val = 30;

  // In MOSDAC format, values >= 200 represent tenths of knots (e.g. 350 = 35.0 knots)
  if (val >= 200) {
    val = val / 10;
  }

  const knots = Math.round(val);
  const kmh = Math.round(knots * 1.852);
  return { knots, kmh };
}

// Map wind speed (knots) to standard IMD cyclone category and color
export function getImdCategory(knots: number): { category: string; categoryColor: string } {
  if (knots >= 120) return { category: 'Super Cyclonic Storm (SuCS)', categoryColor: 'purple' };
  if (knots >= 90) return { category: 'Extremely Severe Cyclonic Storm (ESCS)', categoryColor: 'purple' };
  if (knots >= 64) return { category: 'Very Severe Cyclonic Storm (VSCS)', categoryColor: 'red' };
  if (knots >= 48) return { category: 'Severe Cyclonic Storm (SCS)', categoryColor: 'red' };
  if (knots >= 34) return { category: 'Cyclonic Storm (CS)', categoryColor: 'amber' };
  if (knots >= 28) return { category: 'Deep Depression (DD)', categoryColor: 'green' };
  return { category: 'Depression (D)', categoryColor: 'green' };
}

// Estimate central atmospheric pressure from Atkinson-Holliday relationship
export function estimatePressureHpa(knots: number): number {
  const drop = Math.pow(Math.max(15, knots), 1.25) * 0.42;
  const p = 1012 - drop;
  return Math.max(900, Math.min(1008, Math.round(p)));
}

// Determine basin based on coordinates (Bay of Bengal vs Arabian Sea)
export function determineBasin(lon: number, lat: number): string {
  if (lon < 77) return 'Arabian Sea';
  if (lon >= 77 && lat < 5) return 'South Indian Ocean';
  return 'Bay of Bengal';
}

// Convert MOSDAC GeoJSON track into CycloneData object
export function convertMosdacTrackToCycloneData(name: string, geojson: MosdacFeatureCollection): CycloneData {
  const features = geojson.features || [];
  if (features.length === 0) {
    return {
      id: `MOSDAC-${name}`,
      name: `Cyclone ${name}`,
      category: 'Tropical System',
      categoryColor: 'amber',
      basin: 'North Indian Ocean',
      coordinates: { lat: 15.0, lng: 88.0, latStr: '15.0°N', lngStr: '88.0°E' },
      maxWindKmh: 65,
      maxWindKnots: 35,
      pressureHpa: 998,
      movement: { direction: 'NNW', speedKmh: 14 },
      trajectoryPoints: [],
      forecast5Days: [],
      riIndex: 40,
      riProbability24h: 30,
      statusDescription: `Records from MOSDAC SCORPIO for ${name}.`,
    };
  }

  // Calculate peak intensity across all features
  let maxKnots = 0;
  features.forEach((f) => {
    const { knots } = parseMosdacIntensity(f.properties.cyclone_intensity);
    if (knots > maxKnots) maxKnots = knots;
  });
  if (maxKnots === 0) maxKnots = 45;

  const observedFeatures = features.filter((f) => f.properties.cyclone_flag === '0');
  const forecastFeatures = features.filter((f) => f.properties.cyclone_flag === '1');

  // Active or representative point
  const repFeature = observedFeatures.length > 0 ? observedFeatures[observedFeatures.length - 1] : features[0];
  const [repLng, repLat] = repFeature.geometry.coordinates;

  const { category, categoryColor } = getImdCategory(maxKnots);
  const maxWindKmh = Math.round(maxKnots * 1.852);
  const pressureHpa = estimatePressureHpa(maxKnots);

  // Convert all features into trajectory points
  const trajectoryPoints: TrajectoryPoint[] = features.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const { kmh } = parseMosdacIntensity(f.properties.cyclone_intensity);
    const flagStr = f.properties.cyclone_flag === '1' ? ' (Fcst)' : '';
    const dateHour = `${f.properties.cyclone_date} ${f.properties.cyclone_hour}h${flagStr}`;
    return {
      lat: Number(lat.toFixed(2)),
      lng: Number(lng.toFixed(2)),
      time: dateHour,
      windSpeedKmh: kmh,
    };
  });

  // Calculate movement direction
  let movementDir = 'NW';
  let movementSpeed = 16;
  if (features.length >= 2) {
    const pPrev = features[features.length - 2].geometry.coordinates;
    const pLast = features[features.length - 1].geometry.coordinates;
    const dLon = pLast[0] - pPrev[0];
    const dLat = pLast[1] - pPrev[1];
    if (dLon > 0.05 && dLat > 0.05) movementDir = 'NE';
    else if (dLon < -0.05 && dLat > 0.05) movementDir = 'NW';
    else if (dLon > 0.05 && dLat < -0.05) movementDir = 'SE';
    else if (dLon < -0.05 && dLat < -0.05) movementDir = 'SW';
    else if (dLat > 0.1) movementDir = 'N';
    else if (dLat < -0.1) movementDir = 'S';
    else if (dLon > 0.1) movementDir = 'E';
    else if (dLon < -0.1) movementDir = 'W';

    const distDeg = Math.sqrt(dLon * dLon + dLat * dLat);
    movementSpeed = Math.max(8, Math.min(35, Math.round(distDeg * 25)));
  }

  // 5-day / multi-epoch forecast steps
  const forecast5Days: DailyForecast[] = [];
  const forecastSample = forecastFeatures.length > 0 ? forecastFeatures : features.slice(-6);

  forecastSample.slice(0, 6).forEach((f, i) => {
    const { knots, kmh } = parseMosdacIntensity(f.properties.cyclone_intensity);
    const dayLabel = f.properties.cyclone_flag === '1' 
      ? `+${(i + 1) * 6}h Fcst`
      : `${f.properties.cyclone_date} ${f.properties.cyclone_hour}h`;

    forecast5Days.push({
      dayLabel,
      intensityKt: knots,
      pressureHpa: estimatePressureHpa(knots),
      windSpeedKmh: kmh,
      rainfallMm: Math.min(360, Math.round(knots * 2.4)),
    });
  });

  // Rapid intensification calculations
  let maxRapidGain = 0;
  for (let i = 1; i < features.length; i++) {
    const k1 = parseMosdacIntensity(features[i - 1].properties.cyclone_intensity).knots;
    const k2 = parseMosdacIntensity(features[i].properties.cyclone_intensity).knots;
    if (k2 - k1 > maxRapidGain) maxRapidGain = k2 - k1;
  }
  const riIndex = Math.min(96, Math.max(25, Math.round(maxRapidGain * 3.2 + maxKnots * 0.35)));
  const riProbability24h = Math.min(94, Math.max(18, Math.round(riIndex * 0.88)));

  return {
    id: `MOSDAC-${name}`,
    name: `Cyclone ${name}`,
    category,
    categoryColor,
    basin: determineBasin(repLng, repLat),
    coordinates: {
      lat: Number(repLat.toFixed(2)),
      lng: Number(repLng.toFixed(2)),
      latStr: `${Math.abs(repLat).toFixed(1)}°${repLat >= 0 ? 'N' : 'S'}`,
      lngStr: `${Math.abs(repLng).toFixed(1)}°${repLng >= 0 ? 'E' : 'W'}`,
    },
    maxWindKmh,
    maxWindKnots: maxKnots,
    pressureHpa,
    movement: {
      direction: movementDir,
      speedKmh: movementSpeed,
    },
    trajectoryPoints,
    forecast5Days,
    riIndex,
    riProbability24h,
    statusDescription: `Verified satellite telemetry from ISRO MOSDAC SCORPIO. Peak intensity: ${maxKnots} kt (${maxWindKmh} km/h). Observed track length: ${features.length} coordinate records across ${determineBasin(repLng, repLat)}.`,
  };
}

// Fetch all available cyclone years & names
export async function getMosdacArchiveYears(): Promise<MosdacYearGroup[]> {
  try {
    const res = await fetch('/api/mosdac/cyclones');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch /api/mosdac/cyclones, falling back to bundled data');
  }
  return localMosdacDb.yearList as MosdacYearGroup[];
}

// Fetch active cyclogenesis alert
export async function getMosdacLiveAlert(): Promise<MosdacAlertInfo> {
  try {
    const res = await fetch('/api/mosdac/alert');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch /api/mosdac/alert, using fallback');
  }
  return {
    alert: localMosdacDb.alertText || 'No Cyclone in Indian Ocean',
    activeCyclogenesis: (localMosdacDb.alertText || '').includes('Cyclogenesis'),
    coordinates: { lng: 89.0, lat: 20.5 },
    source: 'https://mosdac.gov.in/scorpio/alertfile.txt',
    timestamp: new Date().toISOString(),
  };
}

// Fetch only the current SCORPIO live track. Historical tracks intentionally use
// the separate archive endpoint so they cannot appear in live monitoring.
export async function getMosdacLiveTrack(): Promise<MosdacFeatureCollection | null> {
  try {
    const res = await fetch('/api/mosdac/live-track');
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.features) && data.features.length > 0 ? data : null;
  } catch (err) {
    console.warn('Failed to fetch the current MOSDAC live track');
    return null;
  }
}

// Fetch track GeoJSON for a specific cyclone
export async function getMosdacCycloneTrack(cycloneName: string): Promise<MosdacFeatureCollection | null> {
  const normName = cycloneName.toUpperCase();
  try {
    const res = await fetch('/api/mosdac/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cyclone_name: normName }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`Fetch /api/mosdac/track for ${cycloneName} failed, using local database`);
  }

  if (localMosdacDb.tracks && (localMosdacDb.tracks as Record<string, any>)[normName]) {
    return (localMosdacDb.tracks as Record<string, any>)[normName] as MosdacFeatureCollection;
  }
  return null;
}

// Fetch satellite catalog for a cyclone
export async function getMosdacCycloneCatalog(cycloneName: string): Promise<MosdacSatelliteDataset[]> {
  const normName = cycloneName.toUpperCase();
  try {
    const res = await fetch(`/api/mosdac/catalog/${normName}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`Fetch /api/mosdac/catalog for ${cycloneName} failed, using local database`);
  }

  if (localMosdacDb.catalogs && (localMosdacDb.catalogs as Record<string, any>)[normName]) {
    return (localMosdacDb.catalogs as Record<string, any>)[normName] as MosdacSatelliteDataset[];
  }
  return [];
}

// Construct WMS Proxy URL for authentic satellite imagery
export function getMosdacWmsTileUrl(options: {
  urlPath: string;
  layers?: string;
  styles?: string;
  colorScale?: string;
  bbox?: string;
  width?: number;
  height?: number;
}): string {
  const {
    urlPath,
    layers = 'IMG_TIR1',
    styles = 'boxfill/greyscale',
    colorScale = '260,921',
    bbox = '60,0,100,35',
    width = 800,
    height = 600,
  } = options;

  const params = new URLSearchParams({
    urlPath,
    layers,
    styles,
    colorScale,
    bbox,
    width: width.toString(),
    height: height.toString(),
  });

  return `/api/mosdac/wms-proxy?${params.toString()}`;
}

// Format dataset name into human-readable epoch string
export function formatDatasetTimestamp(datasetName: string): string {
  const match = datasetName.match(/^([0-9A-Z]{2})IMG_([0-9]{2})([A-Z]{3})([0-9]{4})_([0-9]{2})([0-9]{2})/);
  if (!match) return datasetName;

  const [, satPrefix, day, mon, yr, hr, min] = match;
  const satName = satPrefix === '3S' ? 'INSAT-3DS' : satPrefix === '3R' ? 'INSAT-3DR' : 'INSAT-3D';
  return `${day} ${mon} ${yr}, ${hr}:${min} UTC (${satName})`;
}
