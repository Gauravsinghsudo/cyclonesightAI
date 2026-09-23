import { CycloneData, TrajectoryPoint } from '../types';

export type ForecastProfile = 'cautious' | 'balanced' | 'early-warning';

export interface PersonalizedForecast {
  profile: ForecastProfile;
  trainingSamples: number;
  forecastHours: number;
  windKmh: number;
  pressureHpa: number;
  latitude: number;
  longitude: number;
  confidence: number;
  uncertaintyKm: number;
}

export interface CyclogenesisOutlook {
  probability: number;
  confidence: number;
  level: 'Low' | 'Elevated' | 'High';
  historicalSamples: number;
  currentSignal: string;
  historicalSignal: string;
}

/**
 * Local, explainable cyclogenesis screening model. It combines recent focused
 * storm intensity with the distribution of bundled historical trajectories.
 * It is deliberately conservative and is not an official weather forecast.
 */
export function buildCyclogenesisOutlook(
  currentCyclone: CycloneData | null | undefined,
  historicalCyclones: CycloneData[],
  profile: ForecastProfile,
): CyclogenesisOutlook {
  const samples = historicalCyclones.filter((cyclone) => cyclone.trajectoryPoints.length >= 2);
  const averagePeakWind = samples.length
    ? samples.reduce((sum, cyclone) => sum + cyclone.maxWindKmh, 0) / samples.length
    : 0;
  const strongTrackShare = samples.length
    ? samples.filter((cyclone) => cyclone.maxWindKmh >= 65).length / samples.length
    : 0;
  // Archive selections are useful for the historical baseline, but must never
  // be used as present-day telemetry. A selected record such as DANA (2024)
  // would otherwise falsely inflate a future-formation signal.
  const activeCurrentCyclone = currentCyclone?.isActive === true ? currentCyclone : null;
  const currentWind = activeCurrentCyclone?.maxWindKmh || 0;
  const currentTrackPoints = activeCurrentCyclone?.trajectoryPoints.length || 0;
  const profileOffset = profile === 'early-warning' ? 8 : profile === 'cautious' ? -7 : 0;
  const probability = Math.round(Math.max(5, Math.min(75,
    12 + Math.min(18, samples.length * 0.6) + strongTrackShare * 24 + (averagePeakWind - 55) * 0.16 +
    Math.min(16, currentWind * 0.12) + Math.min(6, currentTrackPoints * 0.5) + profileOffset,
  )));
  const confidence = Math.round(Math.max(25, Math.min(72, 24 + samples.length * 1.4 + (currentTrackPoints >= 4 ? 7 : 0))));
  const level = probability >= 55 ? 'High' : probability >= 30 ? 'Elevated' : 'Low';

  return {
    probability,
    confidence,
    level,
    historicalSamples: samples.length,
    currentSignal: activeCurrentCyclone
      ? `${activeCurrentCyclone.name.replace('Cyclone ', '')}: ${currentWind} km/h peak across ${currentTrackPoints} track points`
      : 'No focused storm telemetry available',
    historicalSignal: `${Math.round(strongTrackShare * 100)}% of ${samples.length} archived tracks reached cyclonic-storm strength`,
  };
}

function linearTrend(values: number[]): { slope: number; intercept: number } {
  const count = values.length;
  if (count < 2) return { slope: 0, intercept: values[0] || 0 };
  const meanX = (count - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / count;
  const numerator = values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0);
  const denominator = values.reduce((sum, _, index) => sum + (index - meanX) ** 2, 0);
  return { slope: denominator ? numerator / denominator : 0, intercept: meanY - (denominator ? numerator / denominator : 0) * meanX };
}

/**
 * A compact, local linear-regression forecaster. It learns only from the
 * selected record's recent observed points; it is not a replacement for IMD
 * forecasts or a numerical weather prediction model.
 */
export function buildPersonalizedForecast(
  cyclone: CycloneData | null | undefined,
  profile: ForecastProfile,
  forecastHours = 24,
): PersonalizedForecast | null {
  if (!cyclone) return null;

  const observed = cyclone.trajectoryPoints.filter((point) => !point.time.includes('(Fcst)') && !point.time.startsWith('+'));
  const samples: TrajectoryPoint[] = (observed.length >= 2 ? observed : cyclone.trajectoryPoints).slice(-6);
  if (samples.length < 2) return null;

  // MOSDAC track epochs are normally six-hourly. The horizon is explicit so
  // callers never present a 24-hour calculation as a 6- or 12-hour forecast.
  const stepsAhead = Math.max(1, Math.round(forecastHours / 6));
  const latestIndex = samples.length - 1;
  const windTrend = linearTrend(samples.map((point) => point.windSpeedKmh));
  const latTrend = linearTrend(samples.map((point) => point.lat));
  const lngTrend = linearTrend(samples.map((point) => point.lng));
  const latestWind = samples[latestIndex].windSpeedKmh;
  const rawWind = windTrend.intercept + windTrend.slope * (latestIndex + stepsAhead);
  const profileFactor = profile === 'cautious' ? 0.94 : profile === 'early-warning' ? 1.1 : 1;
  const windKmh = Math.round(Math.max(20, Math.min(280, rawWind * profileFactor)));
  const pressureHpa = Math.round(Math.max(880, Math.min(1020, cyclone.pressureHpa - (windKmh - latestWind) * 0.42)));
  const confidence = Math.round(Math.min(78, 38 + samples.length * 6 + (profile === 'balanced' ? 4 : 0)));

  return {
    profile,
    trainingSamples: samples.length,
    forecastHours: stepsAhead * 6,
    windKmh,
    pressureHpa,
    latitude: Number((latTrend.intercept + latTrend.slope * (latestIndex + stepsAhead)).toFixed(2)),
    longitude: Number((lngTrend.intercept + lngTrend.slope * (latestIndex + stepsAhead)).toFixed(2)),
    confidence,
    uncertaintyKm: profile === 'early-warning' ? 105 : profile === 'cautious' ? 85 : 70,
  };
}
