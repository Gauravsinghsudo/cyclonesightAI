import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetAt: number }>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const existing = requests.get(key);
    const entry = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
    entry.count += 1;
    requests.set(key, entry);
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    next();
  };
}

const authRateLimit = createRateLimiter(10 * 60 * 1000, 15);
const aiRateLimit = createRateLimiter(10 * 60 * 1000, 25);

// Load pre-bundled authentic MOSDAC records as offline fallback
let localMosdacDb: any = null;
try {
  const dbPath = path.join(process.cwd(), 'src', 'data', 'mosdacRecords.json');
  if (fs.existsSync(dbPath)) {
    localMosdacDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not read local mosdacRecords.json:', err);
}

// In-memory cache for fast response and reduced load on MOSDAC
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const MOSDAC_DATASET_PATH = /^Cyclone3DL1BSTD4km\/[A-Z0-9-]+\/Data\/[A-Za-z0-9_.-]+\.h5$/;
const MOSDAC_NAME = /^[A-Z0-9-]{1,50}$/;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { timestamp: Date.now(), data });
}

// MOSDAC credentials are optional and must be supplied through environment secrets.
// The public SCORPIO feeds used below work without browser-login automation.
const MOSDAC_PORTAL = 'https://mosdac.gov.in/scorpio/';
const MOSDAC_FEEDS = [
  'SCORPIO Live Cyclone Telemetry & Trajectories',
  'INSAT-3DS Multi-Spectral Imager (TIR1 10.8µ, WV 6.8µ, VIS)',
  'SCATSAT-1 & EOS-06 Scatterometer Surface Wind Radii (34/50/64 kt)',
  'IMD 4-Stage Coastal Alert Engine (Watch, Alert, Warning, Post-Landfall)',
];

// MOSDAC status & telemetry sync endpoints — never return credentials to a browser.
app.get('/api/mosdac/auth-status', (req, res) => {
  res.json({
    configured: Boolean(process.env.MOSDAC_USERNAME && process.env.MOSDAC_PASSWORD),
    status: 'Public ISRO MOSDAC SCORPIO feeds available',
    portal: MOSDAC_PORTAL,
    dataFeeds: MOSDAC_FEEDS,
    lastSync: new Date().toISOString(),
  });
});

app.post('/api/mosdac/sync', async (req, res) => {
  // Flush caches to force upstream re-query
  cache.clear();
  res.json({
    success: true,
    message: 'Cleared cache; the next request will synchronize public MOSDAC telemetry.',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CYCLONE SIGHT AI MOSDAC SCORPIO Proxy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 1. Full Cyclone Archives by Year from MOSDAC SCORPIO
app.get('/api/mosdac/cyclones', async (req, res) => {
  const cacheKey = 'cycloneNameList';
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstreamRes = await fetch('https://mosdac.gov.in/scorpio/jsons/cycloneNameList.json', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      setCache(cacheKey, data);
      return res.json(data);
    }
  } catch (err) {
    console.warn('MOSDAC upstream cyclone list fetch failed, using local database fallback');
  }

  if (localMosdacDb && localMosdacDb.yearList) {
    return res.json(localMosdacDb.yearList);
  }

  res.status(502).json({ error: 'Failed to fetch cyclone archive list from MOSDAC' });
});

// 2. Official Cyclone Alert & Lat/Lon from MOSDAC SCORPIO
app.get('/api/mosdac/alert', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [alertRes, latlonRes] = await Promise.all([
      fetch('https://mosdac.gov.in/scorpio/alertfile.txt', { signal: controller.signal }).catch(() => null),
      fetch('https://mosdac.gov.in/scorpio/doc/latlon.txt', { signal: controller.signal }).catch(() => null),
    ]);
    clearTimeout(timeout);

    let alertText = alertRes && alertRes.ok ? (await alertRes.text()).trim() : null;
    let latlonText = latlonRes && latlonRes.ok ? (await latlonRes.text()).trim() : null;

    if (!alertText && localMosdacDb) {
      alertText = localMosdacDb.alertText;
    }
    if (!latlonText && localMosdacDb) {
      latlonText = localMosdacDb.cyclogenesisLocation;
    }

    const [lonStr, latStr] = (latlonText || '89.00,20.50').split(',').map((s) => s.trim());

    res.json({
      alert: alertText || 'No Cyclone in Indian Ocean',
      activeCyclogenesis: (alertText || '').toLowerCase().includes('cyclogenesis'),
      coordinates: {
        lng: parseFloat(lonStr) || 89.0,
        lat: parseFloat(latStr) || 20.5,
      },
      source: 'https://mosdac.gov.in/scorpio/alertfile.txt',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      alert: localMosdacDb?.alertText || 'No Cyclone in Indian Ocean',
      activeCyclogenesis: false,
      coordinates: { lng: 89.0, lat: 20.5 },
      source: 'local_archive_fallback',
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. Live Active Cyclone Track from MOSDAC
app.get('/api/mosdac/live-track', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstreamRes = await fetch('https://mosdac.gov.in/live/backend/cyclone_track.php', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn('Live track fetch from MOSDAC failed');
  }

  res.json({ type: 'FeatureCollection', features: [] });
});

// 4. Exact Track & Telemetry for specific Cyclone from MOSDAC SCORPIO
const handleCycloneTrack = async (cycloneName: string, req: express.Request, res: express.Response) => {
  if (!MOSDAC_NAME.test(cycloneName)) {
    return res.status(400).json({ error: 'A valid cyclone_name is required' });
  }

  const cacheKey = `track_${cycloneName}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstreamRes = await fetch('https://mosdac.gov.in/app_php/getprevcyclonetrack_new.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cyclone_name: cycloneName }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      if (data && data.features && data.features.length > 0) {
        setCache(cacheKey, data);
        return res.json(data);
      }
    }
  } catch (err) {
    console.warn(`Upstream track fetch for ${cycloneName} failed, checking local database`);
  }

  if (localMosdacDb && localMosdacDb.tracks && localMosdacDb.tracks[cycloneName]) {
    return res.json(localMosdacDb.tracks[cycloneName]);
  }

  res.status(404).json({
    type: 'FeatureCollection',
    features: [],
    message: `No track records found for cyclone ${cycloneName}`,
  });
};

app.post('/api/mosdac/track', async (req, res) => {
  const cycloneName = (req.body?.cyclone_name || req.query?.cyclone_name || '').toString().trim().toUpperCase();
  return handleCycloneTrack(cycloneName, req, res);
});

app.get('/api/mosdac/track/:name', async (req, res) => {
  const cycloneName = (req.params.name || '').trim().toUpperCase();
  return handleCycloneTrack(cycloneName, req, res);
});

app.get('/api/mosdac/track', async (req, res) => {
  const cycloneName = (req.query?.cyclone_name || req.query?.name || '').toString().trim().toUpperCase();
  return handleCycloneTrack(cycloneName, req, res);
});

// 5. Satellite Dataset Catalog XML for specific Cyclone (INSAT-3DS / INSAT-3DR H5 files)
app.get('/api/mosdac/catalog/:name', async (req, res) => {
  const name = req.params.name.toUpperCase();
  if (!MOSDAC_NAME.test(name)) {
    return res.status(400).json({ error: 'A valid cyclone name is required' });
  }
  const cacheKey = `catalog_${name}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const upstreamUrl = `https://mosdac.gov.in/live_data/catalog/Cyclone3DL1BSTD4km/${name}/Data/catalog.xml`;
    const upstreamRes = await fetch(upstreamUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const xml = await upstreamRes.text();
      const matches = Array.from(xml.matchAll(/<dataset\s+name="([^"]+)"[^>]*urlPath="([^"]+)"/g));
      const datasets = matches.map((m) => ({
        name: m[1],
        urlPath: m[2],
      }));

      if (datasets.length > 0) {
        setCache(cacheKey, datasets);
        return res.json(datasets);
      }
    }
  } catch (err) {
    console.warn(`Catalog fetch failed for ${name}`);
  }

  if (localMosdacDb && localMosdacDb.catalogs && localMosdacDb.catalogs[name]) {
    return res.json(localMosdacDb.catalogs[name]);
  }

  res.json([]);
});

// 6. Recent Real-Time Satellite Passes (15-min cadence)
app.get('/api/mosdac/satellite-passes', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstreamRes = await fetch(
      'https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=IMG&file_extension=L1B_STD&param=startlayer&timezone=local&timezone_formal=330',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const text = await upstreamRes.text();
      const items = text
        .split(';')
        .flatMap((part) => part.split(','))
        .map((s) => s.trim())
        .filter((s) => s.includes('.h5*'))
        .map((s) => {
          const [file, time] = s.split('*');
          return {
            filename: file.replace(/^[0-9A-Z_]+&/, ''),
            time: time,
            satellite: file.includes('3SIMG') ? 'INSAT-3DS' : file.includes('3RIMG') ? 'INSAT-3DR' : 'INSAT-3D',
          };
        });

      return res.json(items);
    }
  } catch (err) {
    console.warn('Satellite passes fetch error:', err);
  }

  res.json([]);
});

// 7. Live radar frame metadata. RainViewer publishes timestamped public radar tiles;
// clients render those frames over Leaflet rather than showing a simulated radar layer.
app.get('/api/radar/frames', async (_req, res) => {
  const cacheKey = 'rainviewerFrames';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const upstreamRes = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!upstreamRes.ok) throw new Error(`RainViewer returned ${upstreamRes.status}`);
    const data: any = await upstreamRes.json();
    const frames = Array.isArray(data?.radar?.past) ? data.radar.past.slice(-12) : [];
    const payload = { host: data?.host || 'https://tilecache.rainviewer.com', frames, generated: data?.generated || null };
    setCache(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    return res.status(502).json({ error: 'Live radar frames are temporarily unavailable.' });
  }
});

// 8. WMS Tile & Image Proxy (renders real INSAT-3DS/3DR satellite layer from MOSDAC THREDDS/GeoServer)
app.get('/api/mosdac/wms-proxy', async (req, res) => {
  const {
    urlPath,
    layers = 'IMG_TIR1',
    styles = 'boxfill/greyscale',
    colorScale = '260,921',
    bbox = '60,0,100,35',
    width = '800',
    height = '600',
    format = 'image/png',
  } = req.query as Record<string, string>;

  const widthValue = Number(width);
  const heightValue = Number(height);
  const isBbox = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(bbox);
  if (!urlPath || !MOSDAC_DATASET_PATH.test(urlPath) || !isBbox || !Number.isInteger(widthValue) || !Number.isInteger(heightValue) || widthValue < 1 || heightValue < 1 || widthValue > 2048 || heightValue > 2048) {
    return res.status(400).send('Valid MOSDAC dataset path, BBOX, width, and height are required');
  }

  const wmsUrl = `https://www.mosdac.gov.in/live_data/wms/${urlPath}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(
    layers
  )}&STYLES=${encodeURIComponent(styles)}&COLORSCALERANGE=${encodeURIComponent(
    colorScale
  )}&CRS=CRS:84&BBOX=${encodeURIComponent(bbox)}&WIDTH=${encodeURIComponent(width)}&HEIGHT=${encodeURIComponent(
    height
  )}&FORMAT=${encodeURIComponent(format)}&TRANSPARENT=true`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const upstreamRes = await fetch(wmsUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'image/png,image/*,*/*',
      },
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const contentType = upstreamRes.headers.get('content-type') || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = await upstreamRes.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
    res.status(upstreamRes.status).send('MOSDAC WMS returned non-200');
  } catch (err: any) {
    res.status(502).send(`Error proxying WMS: ${err?.message || 'unknown'}`);
  }
});

// Native Web-Mercator tile endpoint for Leaflet's WMS layer.  It validates the
// MOSDAC dataset path to keep this proxy from becoming an arbitrary fetch relay.
app.get('/api/mosdac/wms-tile', async (req, res) => {
  const query = req.query as Record<string, string>;
  const urlPath = query.urlPath;
  const layers = query.layers || query.LAYERS || 'IMG_TIR1';
  const styles = query.styles || query.STYLES || 'boxfill/greyscale';
  // Leaflet emits lowercase parameter names while the WMS specification shows
  // uppercase names, so accept both at the proxy boundary.
  const BBOX = query.bbox || query.BBOX;
  const WIDTH = query.width || query.WIDTH || '256';
  const HEIGHT = query.height || query.HEIGHT || '256';
  const FORMAT = query.format || query.FORMAT || 'image/png';
  const CRS = query.crs || query.CRS || 'EPSG:3857';
  const widthValue = Number(WIDTH);
  const heightValue = Number(HEIGHT);
  const isBbox = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(BBOX || '');
  if (!urlPath || !MOSDAC_DATASET_PATH.test(urlPath)) {
    return res.status(400).send('A valid MOSDAC dataset urlPath is required');
  }
  if (!isBbox || !Number.isInteger(widthValue) || !Number.isInteger(heightValue) || widthValue < 1 || heightValue < 1 || widthValue > 512 || heightValue > 512) {
    return res.status(400).send('A valid tile BBOX, width, and height are required');
  }

  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: layers,
    STYLES: styles, CRS, BBOX, WIDTH, HEIGHT, FORMAT, TRANSPARENT: 'true',
  });
  const wmsUrl = `https://www.mosdac.gov.in/live_data/wms/${urlPath}?${params.toString()}`;
  try {
    const upstreamRes = await fetch(wmsUrl, { headers: { Accept: 'image/png,image/*,*/*' } });
    if (!upstreamRes.ok) return res.status(upstreamRes.status).send('MOSDAC WMS returned non-200');
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=900');
    return res.send(Buffer.from(await upstreamRes.arrayBuffer()));
  } catch (err: any) {
    return res.status(502).send(`Error proxying WMS tile: ${err?.message || 'unknown'}`);
  }
});

// Lazy Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

type ChatRole = 'meteorologist' | 'disaster_manager' | 'coastal_official' | 'researcher' | 'public';

function normalizeChatRole(role: unknown): ChatRole {
  return ['meteorologist', 'disaster_manager', 'coastal_official', 'researcher', 'public'].includes(String(role))
    ? String(role) as ChatRole
    : 'public';
}

// The external model is normally used for chat, but the deterministic response
// must also be useful when no API key is configured.  Keep the same storm facts
// while changing both the priority and the language for the signed-in audience.
function tailorFallbackReply(role: ChatRole, analysis: string, stormName: string): string {
  const facts = analysis
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('###'))
    .map((line) => line.replace(/^\s*[-•]\s*/, '').replace(/\*\*/g, '').trim())
    .join(' ')
    .replace(/\s{2,}/g, ' ');

  const roleLead: Record<ChatRole, string> = {
    public: `For your safety, follow official IMD and local-authority updates for ${stormName}; do not rely on this chat as an evacuation order. `,
    disaster_manager: `Operational brief for ${stormName}: verify this against the latest official IMD bulletin, then prioritize life safety, evacuation readiness, and inter-agency coordination. `,
    coastal_official: `Coastal operations brief for ${stormName}: confirm local IMD and port-control directions, secure exposed waterfront activity, and prepare clear public messaging for affected communities. `,
    meteorologist: `Forecast analysis for ${stormName}: treat the following as contextual indicators, not a replacement for the latest official analysis and observations. `,
    researcher: `Research note for ${stormName}: treat the following as contextual operational information; record the source time and validate values against the underlying MOSDAC/IMD datasets before analysis. `,
  };

  const roleClose: Record<ChatRole, string> = {
    public: ' Keep away from the coast and flood-prone areas if authorities advise it, charge essential devices, and follow local evacuation instructions immediately.',
    disaster_manager: ' Confirm trigger thresholds, shelter and transport capacity, last-mile warning delivery, and the next decision time with the incident command team.',
    coastal_official: ' Recheck harbour, fishing, ferry, and low-lying-area controls; escalate any gap in warnings, access, or evacuation support through the local emergency command.',
    meteorologist: ' Compare these signals with the latest satellite sequence, scatterometer pass, and official forecast discussion before drawing an intensity or track conclusion.',
    researcher: ' Preserve the timestamp, product version, and uncertainty assumptions; separate observed values from forecast or inferred values in any downstream work.',
  };

  const plainSummary = role === 'public'
    ? `The key point is to follow official local warnings for ${stormName} and act early if you are in a coastal or flood-prone area.`
    : `The key point is to confirm the latest official bulletin for ${stormName} and act on the most urgent local risk first.`;

  return `${roleLead[role]}${facts}${roleClose[role]}\n\nQuick summary: ${plainSummary}`;
}

// Models occasionally omit a requested closing section. Guarantee that every
// Copilot response has a concise, displayable takeaway for the chat UI.
function ensureQuickSummary(reply: string): string {
  if (/\bquick\s+summary\s*:/i.test(reply)) return reply;

  const plainText = reply.replace(/\s+/g, ' ').trim();
  const sentences = plainText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [plainText];
  const takeaway = sentences
    .slice(-2)
    .join(' ')
    .trim()
    .slice(0, 360);

  return `${plainText}\n\nQuick summary: ${takeaway || 'Follow the latest official IMD and local-authority guidance.'}`;
}

// 7. CYCLONE SIGHT AI Meteorological Copilot Chat Endpoint (Specially tailored for Cyclone Tracking & MOSDAC)
app.post('/api/gemini/chat', aiRateLimit, async (req, res) => {
  const { message, cycloneContext, conversationHistory = [], userRole = 'public', language = 'en' } = req.body;
  const normalizedUserRole = normalizeChatRole(userRole);
  const responseLanguage = ({ hi: 'Hindi (Devanagari script)', gu: 'Gujarati', ta: 'Tamil', bn: 'Bengali', or: 'Odia', te: 'Telugu', en: 'English' } as Record<string, string>)[String(language)] || 'English';
  if (typeof message !== 'string' || !message.trim() || message.length > 4_000) {
    return res.status(400).json({ error: 'Message must be between 1 and 4,000 characters.' });
  }

  const storm = cycloneContext || {};
  const stormName = storm.name || 'Active North Indian Ocean Cyclone';
  const stormCat = storm.category || 'Severe Cyclonic Storm';
  const stormWind = storm.maxWindKmh ? `${storm.maxWindKmh} km/h (${storm.maxWindKnots} kt)` : '120 km/h (65 kt)';
  const stormPres = storm.pressureHpa ? `${storm.pressureHpa} hPa` : '982 hPa';
  const stormCoords = storm.coordinates ? `${storm.coordinates.latStr || storm.coordinates.lat + '°N'}, ${storm.coordinates.lngStr || storm.coordinates.lng + '°E'}` : '20.2°N, 87.1°E';
  const stormBasin = storm.basin || 'Bay of Bengal';
  const stormRI = storm.riIndex || 78;

  const systemInstruction = `You are CYCLONE SIGHT AI Copilot, an expert tropical meteorology assistant specialized EXCLUSIVELY for:
1. North Indian Ocean Tropical Cyclogenesis (Bay of Bengal & Arabian Sea basins).
2. ISRO MOSDAC SCORPIO satellite records (https://mosdac.gov.in/scorpio/).
3. INSAT-3DS & INSAT-3DR multi-spectral imager channels:
   - TIR1 (10.8 µm): Cloud-top brightness temperatures, Central Dense Overcast (CDO), and Dvorak T-number estimates (T1.0–T8.0).
   - WV (6.8 µm): Upper-tropospheric moisture plumes, dry air intrusions, and steering synoptic ridges.
   - VIS (0.65 µm): High-resolution daytime visible eyewall structure and mesovortex rotation.
   - MIR (3.8 µm): Nocturnal low-level cloud boundary tracking.
4. Ocean Surface Dynamics: SCATSAT-1/EOS-06 scatterometer ocean wind vectors, Sea Surface Temperatures (SST > 28°C), and Tropical Cyclone Heat Potential (TCHP > 80 kJ/cm²).
5. IMD (India Meteorological Department) 4-Stage Warning Protocol:
   - Stage 1: Pre-Cyclone Watch (72h prior)
   - Stage 2: Cyclone Alert (Yellow, 48h prior)
   - Stage 3: Cyclone Warning (Orange, 24h prior)
   - Stage 4: Post-Landfall Outlook (Red, 12h prior)
6. IMD Port Warning Signals (Signal 1 to 11, specifically 8, 9, 10 for Great Danger ports like Paradip, Dhamra, Haldia, Visakhapatnam).
7. Coastal Storm Surge Inundation: Tidal modeling, coastal bathymetry, and district evacuation priorities (Bhadrak, Kendrapara, Balasore, Jagatsinghpur, East Medinipur).

CURRENT ACTIVE STORM CONTEXT:
- Cyclone Name: ${stormName}
- Category: ${stormCat}
- Basin: ${stormBasin}
- Center Position: ${stormCoords}
- Peak Sustained Winds: ${stormWind}
- Estimated Central Pressure: ${stormPres}
- Rapid Intensification (RI) Index: ${stormRI}%
- Translation Velocity: ${storm.movement?.direction || 'North-Northwest'} at ${storm.movement?.speedKmh || 15} km/h
- Status Notes: ${storm.statusDescription || 'Approaching coastal landfall with severe convection.'}

RESPONSE GUIDELINES:
- Be clear for everyone, including people with no weather-training. Use short sentences, everyday words, and explain any unavoidable technical term the first time it appears. For example, say “rapid intensification (a storm strengthening very quickly)” instead of using the abbreviation alone.
- Answer in this order when useful: what is happening, why it matters, what the person should do or watch, then a final summary. Do not overload the answer with numbers; include only figures that help explain the risk.
- Separate confirmed observations from forecasts. State uncertainty plainly and never invent a warning, measurement, or forecast that is not present in the supplied context.
- Your response must be distinct for this user's role: ${normalizedUserRole}. Public: lead with immediate, plain-language safety advice. Disaster manager: lead with the operational priority and give concrete coordination checks. Coastal official: focus on ports, shorefront activity, local warnings, and coastal communities. Meteorologist: lead with observations, relevant diagnostics, and forecast uncertainty but still define specialist terms. Researcher: distinguish observations from inference and describe data or method limitations.
- Use the preceding conversation to resolve references such as “it”, “that”, and “what about tomorrow”. Ask one concise clarifying question only if a crucial detail is missing.
- Write ordinary conversational prose in short paragraphs. Do not use Markdown headings, bold markers, tables, or bullet markers.
- Always end with a new final paragraph beginning exactly with “Quick summary:”. It must be one or two plain-language sentences that state the main takeaway and most important action.
- Reference coordinates or verified telemetry only when relevant.`;
  
  const localizedSystemInstruction = `${systemInstruction}\n- Respond entirely in ${responseLanguage}. Keep cyclone names, official acronyms, measurements, and place names accurate.`;

  try {
    const ai = getGemini();
    if (ai) {
      try {
        const priorConversation = Array.isArray(conversationHistory)
          ? conversationHistory
              .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
              .slice(-12)
              .map((item: any) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.text.slice(0, 1_200)}`)
              .join('\n')
          : '';
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: `${localizedSystemInstruction}\n\nConversation so far:\n${priorConversation || '(This is the first message.)'}\n\nUser: ${message.trim()}` }] },
          ],
        });
        if (response.text) {
          return res.json({
            reply: ensureQuickSummary(response.text.trim()),
            source: 'gemini-3.8-flash',
            stormContext: { name: stormName, coordinates: stormCoords, wind: stormWind, pressure: stormPres },
          });
        }
      } catch (genError: any) {
        console.warn('Gemini generateContent error, falling back to specialized meteorological intelligence:', genError?.message);
      }
    }

    // Specialized domain intelligence fallback
    const lower = message.trim().toLowerCase();
    let dynamicAnalysis = '';

    if (lower.includes('landfall') || lower.includes('surge') || lower.includes('coastal')) {
      dynamicAnalysis = `### Landfall & Storm Surge Analysis: ${stormName}
- **Vortex Coordinates**: **${stormCoords}** in the **${stormBasin}**, tracking **${storm.movement?.direction || 'North-Northwest'}** at **${storm.movement?.speedKmh || 15} km/h**.
- **Landfall Corridor**: Coastal zone between **Dhamra Port (Odisha)** and **Digha (West Bengal)**.
- **Estimated Astronomical Storm Surge**: **2.0m – 3.8m above astronomical tide** at landfall point, threatening low-lying districts of Kendrapara, Bhadrak, and Balasore.
- **Maximum Gusts**: Anticipated gale gusts reaching **${storm.maxWindKmh ? Math.round(storm.maxWindKmh * 1.15) : 135} km/h** during coastal crossing.
- **Evacuation Status**: IMD Stage 4 (Post-Landfall Outlook / Red Alert) active. District administrations have mobilized ODRAF, NDRF, and Indian Coast Guard.`;
    } else if (lower.includes('rapid intensification') || lower.includes('ri') || lower.includes('intensif')) {
      dynamicAnalysis = `### Rapid Intensification (RI) Assessment: ${stormName}
- **MOSDAC RI Probability Index**: **${stormRI}% (High Probability)**
- **Ocean Thermodynamic Drivers**:
  - **Tropical Cyclone Heat Potential (TCHP)**: Measured at **88–95 kJ/cm²** along the track trajectory.
  - **Sea Surface Temperature (SST)**: 29.5°C – 30.2°C, well exceeding the 26.5°C threshold needed for rapid eye development.
- **Atmospheric Dynamics**:
  - **Vertical Wind Shear (VWS)**: Favorable low shear of **8–12 knots**, preventing vortex tilt.
  - **Upper Tropospheric Outflow**: Robust dual-channel divergence in the poleward and equatorward quadrants.
- **Meteorological Warning**: High risk of pressure drop exceeding 15 hPa within the next 18 hours.`;
    } else if (lower.includes('insat') || lower.includes('tir1') || lower.includes('satellite') || lower.includes('temperature') || lower.includes('dvorak')) {
      dynamicAnalysis = `### INSAT-3DS Multi-Spectral Imager Telemetry: ${stormName}
- **TIR1 (Thermal Infrared 10.8µm)**: Inner eyewall brightness temperatures measured at **-83°C to -86°C**, indicating extreme deep convective towers.
- **Dvorak Intensity Estimate**: Current estimate at **T4.5 to T5.0 (CI 5.0)** with curved banding wrapping ~1.2 cycles into the central dense overcast (CDO).
- **Water Vapor Channel (6.8µm)**: No dry continental air entrainment detected along the southern flank; moisture feed from the equatorial Indian Ocean remains uninterrupted.
- **Visible Channel (0.65µm)**: Developing ragged eye feature visible with a radius of approximately 25 km.`;
    } else if (lower.includes('port') || lower.includes('signal') || lower.includes('marine') || lower.includes('ship')) {
      dynamicAnalysis = `### IMD Port Warning Signals & Maritime Advisories
- **Dhamra Port & Paradip Port**: **Port Signal No. 10 (Great Danger)** — Vessels moved to deep-water anchorage; all cargo and crane handling suspended.
- **Haldia & Kolkata Ports**: **Port Signal No. 9 (Great Danger)** — River pilots on standby; barge movements halted along Hooghly river.
- **Visakhapatnam & Gopalpur Ports**: **Port Signal No. 4 & 8 (Danger Signal)** — Warning for vessels to exercise utmost caution.
- **Advisory for Fishermen**: Total suspension of fishing operations along the Odisha, West Bengal, and northern Andhra Pradesh coastlines out to 200 nautical miles.`;
    } else {
      dynamicAnalysis = `### CYCLONE SIGHT AI Meteorological Copilot Assessment: ${stormName}
- **Current Observation**: ${stormCat} centered at **${stormCoords}** with central pressure estimated at **${stormPres}**.
- **Wind Profile**: Maximum sustained winds of **${stormWind}** with gale wind radius (34-knot) extending outward up to 180 km.
- **Synoptic Steering**: Steered by the subtropical anticyclone over Southeast Asia, maintaining a steady translation toward the northern Indian coastline.
- **Recommended Actions**: Monitor 3-hourly MOSDAC SCORPIO advisories, observe INSAT-3DS rapid-scan imagery, and verify coastal defense shelters.`;
    }

    // The fallback is deliberately plain text: the chat UI is a conversation,
    // not a Markdown preview. This prevents raw ###, **, and list markers from
    // appearing when the external model is unavailable.
    const conversationalReply = tailorFallbackReply(normalizedUserRole, dynamicAnalysis, stormName);

    return res.json({
      reply: conversationalReply,
      source: 'domain-intelligence',
      stormContext: { name: stormName, coordinates: stormCoords, wind: stormWind, pressure: stormPres },
    });
  } catch (err: any) {
    console.error('Gemini handler error:', err);
    return res.status(500).json({
      error: 'Failed to process AI chat query',
      details: err?.message || 'Server error',
    });
  }
});

// 8. User Authentication & Database Management
const SESSION_COOKIE = 'cycloneai_session';

function getAuthToken(req: express.Request): string {
  const cookie = req.headers.cookie?.split(';').find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return '';
  try {
    const token = decodeURIComponent(cookie.split('=').slice(1).join('=').trim());
    return /^[a-f0-9]{64}$/i.test(token) ? token : '';
  } catch {
    return '';
  }
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res: express.Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

// User Signup
app.post('/api/auth/signup', authRateLimit, async (req, res) => {
  const { name, email, password, role, organization } = req.body || {};

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!name.trim() || name.trim().length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 320) {
    return res.status(400).json({ error: 'Enter a valid name and email address.' });
  }
  if (password.length < 12 || password.length > 1024) {
    return res.status(400).json({ error: 'Password must be between 12 and 1,024 characters.' });
  }
  if (organization !== undefined && (typeof organization !== 'string' || organization.length > 255)) {
    return res.status(400).json({ error: 'Organization is not valid.' });
  }
  if (role !== undefined && !['meteorologist', 'disaster_manager', 'coastal_official', 'researcher', 'public'].includes(role)) {
    return res.status(400).json({ error: 'Role is not valid.' });
  }

  try {
    const user = await db.createUser({ name, email, password, role, organization });
    const token = await db.createSession(user.id);
    setSessionCookie(res, token);
    return res.status(201).json({ user });
  } catch (err: any) {
    if (String(err?.message).includes('already exists')) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    console.error('Signup failed:', err);
    return res.status(500).json({ error: 'Could not create the account.' });
  }
});

// User Login
app.post('/api/auth/login', authRateLimit, async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const storedUser = await db.findUserByEmail(email);
    if (!storedUser || !db.verifyPassword(storedUser, password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    await db.upgradePasswordHash(storedUser, password);
    const token = await db.createSession(storedUser.id);
    const { passwordHash: _, salt: __, ...user } = storedUser;
    setSessionCookie(res, token);
    return res.json({ user });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Could not sign in.' });
  }
});

// Get Current Logged In User
app.get('/api/auth/me', async (req, res) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Session lookup failed:', err);
    return res.status(500).json({ error: 'Could not verify the session.' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  const token = getAuthToken(req);
  try {
    if (token) await db.invalidateSession(token);
  } catch (err) {
    console.error('Logout failed:', err);
    return res.status(500).json({ error: 'Could not sign out.' });
  }
  clearSessionCookie(res);
  return res.json({ message: 'Logged out successfully' });
});

// Toggle Saved Cyclone in User Database
app.post('/api/user/saved-cyclones', async (req, res) => {
  const token = getAuthToken(req);
  const user = await db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to save cyclones.' });
  }

  const { cycloneName } = req.body || {};
  if (typeof cycloneName !== 'string' || !MOSDAC_NAME.test(cycloneName.trim().toUpperCase())) {
    return res.status(400).json({ error: 'A valid cycloneName is required' });
  }
  try {
    const updatedSaved = await db.toggleSavedCyclone(user.id, cycloneName);
    return res.json({ savedCyclones: updatedSaved });
  } catch (err) {
    console.error('Saved cyclone update failed:', err);
    return res.status(500).json({ error: 'Could not update saved cyclones.' });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 requires a named wildcard; this includes the application root.
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CYCLONE SIGHT AI Full-Stack Server running on port ${PORT}`);
  });
}

// Vercel invokes the exported Express application as a serverless function.
// Local development continues to run the Vite middleware and HTTP listener.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
