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
