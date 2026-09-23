export type SatelliteMode = 'IR' | 'VIS' | 'WV' | 'Multi';
export type ForecastMetricTab = 'Intensity' | 'Pressure' | 'Wind Speed' | 'Rainfall';

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  time: string;
  windSpeedKmh: number;
}

export interface DailyForecast {
  dayLabel: string;
  intensityKt: number;
  pressureHpa: number;
  windSpeedKmh: number;
  rainfallMm: number;
}

export interface CycloneData {
  id: string;
  name: string;
  category: string;
  categoryColor: string; // 'red' | 'green' | 'amber' | 'purple'
  basin: string;
  coordinates: {
    lat: number;
    lng: number;
    latStr: string;
    lngStr: string;
  };
  maxWindKmh: number;
  maxWindKnots: number;
  pressureHpa: number;
  movement: {
    direction: string;
    speedKmh: number;
  };
  trajectoryPoints: TrajectoryPoint[];
  forecast5Days: DailyForecast[];
  riIndex: number;
  riProbability24h: number;
  statusDescription: string;
  /** True only for storms currently being monitored on the live dashboard. */
  isActive?: boolean;
}

export interface ImpactArea {
  id: string;
  name: string;
  riskLevel: 'High' | 'Moderate' | 'Low';
  populationAtRisk?: string;
  alertType?: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  description: string;
  severity: 'urgent' | 'warning' | 'info';
  timestamp: string;
  cycloneId?: string;
  isRead: boolean;
  createdAt?: number;
}

export interface DataSourceItem {
  id: string;
  name: string;
  type: 'Satellite' | 'Reanalysis' | 'Global Model' | 'Marine Buoy' | 'Ocean Profiling' | 'Altimetry';
  status: 'online' | 'degraded' | 'offline';
  latency: string;
  provider: string;
  updateFrequency: string;
}

export interface IMDPortSignal {
  portName: string;
  signalNo: number;
  signalName: string;
  advisory: string;
}

export interface IMDBulletin {
  id: string;
  bulletinNo: string;
  issuedAt: string;
  systemName: string;
  category: string;
  basin: string;
  warningStage: 'Stage 1 (Pre-Cyclone Watch)' | 'Stage 2 (Cyclone Alert - Yellow)' | 'Stage 3 (Cyclone Warning - Orange)' | 'Stage 4 (Post-Landfall Outlook - Red)';
  location: {
    lat: number;
    lng: number;
    description: string;
  };
  movement: {
    direction: string;
    speedKmh: number;
  };
  intensity: {
    maxWindKmh: number;
    maxWindKnots: number;
    gustKmh: number;
    centralPressureHpa: number;
  };
  landfall: {
    expectedArea: string;
    expectedTimeWindow: string;
    peakLandfallWindKmh: number;
    stormSurgeMeters: string;
  };
  affectedDistricts: {
    state: string;
    districts: string[];
    rainfallAlert: 'Extremely Heavy' | 'Heavy to Very Heavy' | 'Moderate';
  }[];
  portSignals: IMDPortSignal[];
  fishermenWarning: string;
  actionSuggested: string[];
  rawText: string;
}

