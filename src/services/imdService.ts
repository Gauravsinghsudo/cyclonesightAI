import { IMDBulletin } from '../types';

export const FALLBACK_IMD_BULLETINS: IMDBulletin[] = [
  {
    id: 'imd-bulletin-dana-18',
    bulletinNo: 'Bulletin No. 18 (BOB/06/2024)',
    issuedAt: '24 Oct 2024, 14:30 hrs IST',
    systemName: 'Severe Cyclonic Storm DANA',
    category: 'Severe Cyclonic Storm',
    basin: 'Bay of Bengal',
    warningStage: 'Stage 3 (Cyclone Warning - Orange)',
    location: {
      lat: 19.8,
      lng: 88.2,
      description: 'Central Bay of Bengal, about 210 km southeast of Paradip (Odisha) and 240 km south-southeast of Dhamra.',
    },
    movement: {
      direction: 'North-Northwestwards',
      speedKmh: 15,
    },
    intensity: {
      maxWindKmh: 120,
      maxWindKnots: 65,
      gustKmh: 135,
      centralPressureHpa: 980,
    },
    landfall: {
      expectedArea: 'Odisha & West Bengal coasts between Puri and Sagar Island, close to Dhamra',
      expectedTimeWindow: 'Midnight of 24th Oct to Early Morning of 25th Oct 2024',
      peakLandfallWindKmh: 120,
      stormSurgeMeters: '1.0 to 2.0 meters above astronomical tide',
    },
    affectedDistricts: [
      {
        state: 'Odisha',
        districts: ['Kendrapara', 'Bhadrak', 'Balasore', 'Jagatsinghpur', 'Puri', 'Cuttack'],
        rainfallAlert: 'Extremely Heavy',
      },
      {
        state: 'West Bengal',
        districts: ['Purba Medinipur', 'Paschim Medinipur', 'South 24 Parganas', 'North 24 Parganas'],
        rainfallAlert: 'Heavy to Very Heavy',
      },
    ],
    portSignals: [
      { portName: 'Dhamra Port', signalNo: 10, signalName: 'Great Danger Signal No. X', advisory: 'Great danger expected; port to suspend all harbour operations.' },
      { portName: 'Paradip Port', signalNo: 10, signalName: 'Great Danger Signal No. X', advisory: 'Great danger from cyclone passing near or over port.' },
      { portName: 'Haldia / Kolkata', signalNo: 9, signalName: 'Great Danger Signal No. IX', advisory: 'Severe cyclonic storm expected to cross coast keeping port to right.' },
      { portName: 'Visakhapatnam', signalNo: 3, signalName: 'Local Cautionary Signal No. III', advisory: 'Port threatened by squally weather; vessel movement advised with caution.' },
    ],
    fishermenWarning: 'Total suspension of fishing operations over North Bay of Bengal and along & off Odisha-West Bengal coasts until 26th October morning. Fishermen at sea advised to return to coast immediately.',
    actionSuggested: [
      'Total evacuation from low-lying areas in Bhadrak, Kendrapara, and Balasore districts.',
      'Suspension of train and flight services in affected coastal sectors during landfall window.',
      'Deployment of 20 NDRF teams and 51 ODRAF units across vulnerable blocks.',
      'Pre-positioning of diesel generators, de-watering pumps, and emergency communication handsets at district headquarters.',
    ],
    rawText: `INDIA METEOROLOGICAL DEPARTMENT
BULLETIN NO. 18 (BOB/06/2024)
TIME OF ISSUE: 1430 HOURS IST DATED 24.10.2024

FROM: INDIA METEOROLOGICAL DEPARTMENT (FAX NO. 24643965/24699216/24623220)
TO: CONTROL ROOM, MINISTRY OF HOME AFFAIRS, NEW DELHI

SUBJECT: SEVERE CYCLONIC STORM "DANA" OVER NORTHWEST BAY OF BENGAL: CYCLONE WARNING FOR ODISHA AND WEST BENGAL COASTS (ORANGE MESSAGE).

The Severe Cyclonic Storm "DANA" (pronounced as DAY-NA) over Eastcentral & adjoining Westcentral Bay of Bengal moved north-northwestwards with a speed of 15 kmph during past 6 hours and lay centered at 1130 hrs IST of today, the 24th October 2024 over Northwest & adjoining Eastcentral Bay of Bengal near latitude 19.8°N and longitude 88.2°E, about 210 km southeast of Paradip (Odisha), 240 km south-southeast of Dhamra (Odisha) and 310 km south-southwest of Sagar Island (West Bengal).

It is very likely to move north-northwestwards and cross north Odisha and West Bengal coasts between Puri and Sagar Island close to Dhamra during midnight of 24th to morning of 25th October 2024 as a Severe Cyclonic Storm with a wind speed of 100-110 kmph gusting to 120 kmph.

WIND WARNING:
Gale wind speed reaching 100-110 kmph gusting to 120 kmph is prevailing over Northwest Bay of Bengal and along & off Odisha-West Bengal coasts.

STORM SURGE WARNING:
Storm surge of about 1.0 to 2.0 m height above astronomical tide is likely to inundate low lying areas of Kendrapara, Bhadrak and Balasore districts of Odisha at the time of landfall.`,
  },
  {
    id: 'imd-bulletin-remal-22',
    bulletinNo: 'Bulletin No. 22 (BOB/02/2024)',
    issuedAt: '26 May 2024, 20:30 hrs IST',
    systemName: 'Severe Cyclonic Storm REMAL',
    category: 'Severe Cyclonic Storm',
    basin: 'Bay of Bengal',
    warningStage: 'Stage 4 (Post-Landfall Outlook - Red)',
    location: {
      lat: 21.3,
      lng: 89.2,
      description: 'North Bay of Bengal, near Khepupara (Bangladesh) and Sagar Island (West Bengal).',
    },
    movement: {
      direction: 'Northwards',
      speedKmh: 16,
    },
    intensity: {
      maxWindKmh: 135,
      maxWindKnots: 72,
      gustKmh: 150,
      centralPressureHpa: 974,
    },
    landfall: {
      expectedArea: 'Coasts of West Bengal and adjoining Bangladesh near Mongla / Khepupara',
      expectedTimeWindow: 'Night of 26th May 2024',
      peakLandfallWindKmh: 135,
      stormSurgeMeters: '1.5 to 3.0 meters',
    },
    affectedDistricts: [
      {
        state: 'West Bengal',
        districts: ['South 24 Parganas', 'North 24 Parganas', 'Kolkata', 'Howrah', 'Hooghly'],
        rainfallAlert: 'Extremely Heavy',
      },
    ],
    portSignals: [
      { portName: 'Kolkata / Haldia', signalNo: 10, signalName: 'Great Danger Signal No. X', advisory: 'Severe cyclone crossing close to port.' },
    ],
    fishermenWarning: 'Complete ban on sea travel in North Bay of Bengal.',
    actionSuggested: [
      'Immediate evacuation of Sundarbans delta coastal populations.',
      'Kolkata Port and airport operations suspended for 21 hours.',
    ],
    rawText: `INDIA METEOROLOGICAL DEPARTMENT
BULLETIN NO. 22 (BOB/02/2024)
SUBJECT: SEVERE CYCLONIC STORM "REMAL" LANDFALL PROCESS COMMENCED NEAR SAGAR ISLAND & KHEPUPARA.
WIND SPEED AT LANDFALL: 110-120 KMPH GUSTING TO 135 KMPH.`,
  },
  {
    id: 'imd-bulletin-cyclogenesis-active',
    bulletinNo: 'Special Bulletin No. 01 (NIO/2025/WATCH)',
    issuedAt: 'Live Synced / Official Outlook',
    systemName: 'Bay of Bengal Low Pressure Watch',
    category: 'Depression / Cyclogenesis Watch',
    basin: 'Bay of Bengal',
    warningStage: 'Stage 1 (Pre-Cyclone Watch)',
    location: {
      lat: 14.5,
      lng: 87.8,
      description: 'Southeast Bay of Bengal and adjoining Andaman Sea',
    },
    movement: {
      direction: 'North-Westwards',
      speedKmh: 12,
    },
    intensity: {
      maxWindKmh: 45,
      maxWindKnots: 25,
      gustKmh: 55,
      centralPressureHpa: 1002,
    },
    landfall: {
      expectedArea: 'Under continuous satellite surveillance by ISRO INSAT-3DS and IMD RSMC New Delhi',
      expectedTimeWindow: '48 to 72 hours cyclogenesis window',
      peakLandfallWindKmh: 65,
      stormSurgeMeters: 'Normal coastal tide',
    },
    affectedDistricts: [
      {
        state: 'Andaman & Nicobar',
        districts: ['South Andaman', 'Nicobar Islands'],
        rainfallAlert: 'Heavy to Very Heavy',
      },
    ],
    portSignals: [
      { portName: 'Port Blair', signalNo: 1, signalName: 'Distant Cautionary Signal No. I', advisory: 'System of low pressure forming in deep ocean.' },
    ],
    fishermenWarning: 'Fishermen are advised not to venture into deep sea areas of Southeast Bay of Bengal.',
    actionSuggested: [
      'Maintain continuous monitoring of satellite imagery and scatterometer wind vectors.',
      'State disaster management authorities alerted for Pre-Cyclone Watch.',
    ],
    rawText: `INDIA METEOROLOGICAL DEPARTMENT
SPECIAL TROPICAL CYCLONE OUTLOOK
SUBJECT: PRE-CYCLONE WATCH FOR BAY OF BENGAL BASIN (STAGE 1 ADVISORY).
A LOW PRESSURE AREA HAS FORMED OVER SOUTHEAST BAY OF BENGAL. IT IS LIKELY TO CONSOLIDATE INTO A DEPRESSION OVER THE NEXT 48 HOURS.`,
  }
];

export async function fetchIMDBulletins(forceRefresh: boolean = false): Promise<IMDBulletin[]> {
  try {
    const url = forceRefresh ? '/api/imd/bulletins?refresh=true' : '/api/imd/bulletins';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend fetch for IMD bulletins failed, returning fallback bulletins:', err);
  }
  return FALLBACK_IMD_BULLETINS;
}

export async function parseRawIMDBulletinWithAI(rawText: string, language: string = 'en'): Promise<IMDBulletin | null> {
  try {
    const res = await fetch('/api/imd/parse-bulletin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, language }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.bulletinNo) {
        return data as IMDBulletin;
      }
    }
  } catch (err) {
    console.warn('AI Bulletin Parsing endpoint failed:', err);
  }
  return null;
}
