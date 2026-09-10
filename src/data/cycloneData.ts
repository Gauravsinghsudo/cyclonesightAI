import { CycloneData, ImpactArea, AlertNotification, DataSourceItem } from '../types';
import localMosdacDb from './mosdacRecords.json';
import { convertMosdacTrackToCycloneData } from '../services/mosdacService';

// Built from authentic MOSDAC SCORPIO records (https://mosdac.gov.in/scorpio/)
export const DANA_CYCLONE: CycloneData = {
  ...convertMosdacTrackToCycloneData('DANA', (localMosdacDb.tracks as Record<string, any>)['DANA']),
  // Dana is an archived 2024 track, not a live storm.
  isActive: false,
};

export const REMAL_CYCLONE = convertMosdacTrackToCycloneData(
  'REMAL',
  (localMosdacDb.tracks as Record<string, any>)['REMAL']
);

export const BIPARJOY_CYCLONE = convertMosdacTrackToCycloneData(
  'BIPARJOY',
  (localMosdacDb.tracks as Record<string, any>)['BIPARJOY']
);

export const INITIAL_CYCLONES: CycloneData[] = [
  DANA_CYCLONE,
  REMAL_CYCLONE,
  BIPARJOY_CYCLONE,
];

// Archived MOSDAC trajectories used only as local training examples for the
// personalized cyclogenesis outlook; they are not shown as live storms.
export const HISTORICAL_MODEL_RECORDS: CycloneData[] = Object.entries(localMosdacDb.tracks as Record<string, any>)
  .map(([name, track]) => ({ ...convertMosdacTrackToCycloneData(name, track), isActive: false }));

export const IMPACT_AREAS: ImpactArea[] = [
  {
    id: 'odisha',
    name: 'Odisha Coastal Belt (Dhamra - Puri)',
    riskLevel: 'High',
    populationAtRisk: '3.8M residents',
    alertType: 'Red Warning (Severe Gale Winds & Inundation)',
  },
  {
    id: 'west-bengal',
    name: 'West Bengal / Sundarbans',
    riskLevel: 'High',
    populationAtRisk: '4.2M residents',
    alertType: 'Red Warning (Extremely Heavy Rainfall & Surge)',
  },
  {
    id: 'andhra',
    name: 'North Coastal Andhra Pradesh',
    riskLevel: 'Moderate',
    populationAtRisk: '1.9M residents',
    alertType: 'Orange Warning (Squally Winds 55-65 km/h)',
  },
  {
    id: 'gujarat',
    name: 'Saurashtra & Kutch (Arabian Sea)',
    riskLevel: 'Moderate',
    populationAtRisk: '2.5M residents',
    alertType: 'Yellow Advisory (High Swell & Rough Seas)',
  },
  {
    id: 'andaman',
    name: 'Andaman & Nicobar Islands',
    riskLevel: 'Low',
    populationAtRisk: '380K residents',
    alertType: 'Fishermen Sea Advisory',
  },
];

export const DATA_SOURCES: DataSourceItem[] = [
  { id: '1', name: 'MOSDAC SCORPIO', type: 'Satellite', status: 'online', latency: 'Live feed', provider: 'ISRO SAC (mosdac.gov.in)', updateFrequency: 'Real-time & 15-min' },
  { id: '2', name: 'INSAT-3DS 4km TIR1/WV/VIS', type: 'Satellite', status: 'online', latency: '2m ago', provider: 'ISRO MOSDAC THREDDS', updateFrequency: 'Every 15 min' },
  { id: '3', name: 'INSAT-3DR Rapid Scan', type: 'Satellite', status: 'online', latency: '4m ago', provider: 'ISRO SAC', updateFrequency: 'Every 15 min' },
  { id: '4', name: 'EOS-06 (SCAT) Ocean Winds', type: 'Satellite', status: 'online', latency: 'Synced', provider: 'ISRO MOSDAC WMS', updateFrequency: 'Per orbital pass' },
  { id: '5', name: 'MOSDAC TCHCP Heat Anomaly', type: 'Ocean Profiling', status: 'online', latency: 'Synced', provider: 'MOSDAC GeoServer 2', updateFrequency: 'Daily 00/06/12/18 UTC' },
  { id: '6', name: 'GFS 0.5° Wind Vectors', type: 'Global Model', status: 'online', latency: 'Synced', provider: 'MOSDAC Live GRIB', updateFrequency: '6-hourly' },
  { id: '7', name: 'IMD Coastal Radars (DWR)', type: 'Marine Buoy', status: 'online', latency: '1m ago', provider: 'IMD / MoES India', updateFrequency: 'Every 10 min' },
  { id: '8', name: 'INCOIS Ocean Buoy Network', type: 'Marine Buoy', status: 'online', latency: '3m ago', provider: 'MoES INCOIS', updateFrequency: 'Continuous' },
  { id: '9', name: 'ERA5 ECMWF Reanalysis', type: 'Reanalysis', status: 'online', latency: 'Synced', provider: 'ECMWF Copernicus', updateFrequency: 'Hourly' },
];

export const ALERT_EXPIRY_MS = 7 * 60 * 60 * 1000; // 7 hours auto-delete window

export function getAlertRemainingTime(createdAt?: number): string {
  if (!createdAt) return 'Expires in <7h';
  const remaining = ALERT_EXPIRY_MS - (Date.now() - createdAt);
  if (remaining <= 0) return 'Expiring now';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  }
  return `Expires in ${Math.max(1, minutes)}m`;
}

export const NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'alert-1',
    title: 'Official MOSDAC SCORPIO Active Alert',
    description: 'Real-time telemetry stream from https://mosdac.gov.in/scorpio/. Current Status: No Active Cyclone in Indian Ocean basin. Cyclogenesis monitoring center at 89.00°E, 20.50°N.',
    severity: 'info',
    timestamp: 'Today, Live Synced',
    cycloneId: 'MOSDAC-DANA',
    isRead: false,
    createdAt: Date.now() - 35 * 60 * 1000,
  },
  {
    id: 'alert-2',
    title: 'INSAT-3DS High-Resolution Imagery Feed Active',
    description: 'Multi-spectral WMS imagery accessible for all historical tracks (DANA, REMAL, BIPARJOY, AMPHAN, MICHAUNG) from ISRO MOSDAC THREDDS repository.',
    severity: 'info',
    timestamp: 'Today, 15m Cadence',
    cycloneId: 'MOSDAC-DANA',
    isRead: false,
    createdAt: Date.now() - 110 * 60 * 1000,
  },
  {
    id: 'alert-3',
    title: 'Cyclone DANA Record: Peak 65 kt (120 km/h)',
    description: 'Official MOSDAC observation & forecast track: 10 coordinate points traversing Bay of Bengal towards Odisha coast with central pressure ~955 hPa.',
    severity: 'warning',
    timestamp: 'Archive Record',
    cycloneId: 'MOSDAC-DANA',
    isRead: false,
    createdAt: Date.now() - 210 * 60 * 1000,
  },
];
