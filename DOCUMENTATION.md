# CycloneSight AI — System Architecture & Technical Documentation

> **AI-Powered Cyclone Tracking, Rapid Intensification Early Warning, and Disaster Management Platform**

---

## 1. Executive Overview

**CycloneSight AI** is a full-stack, enterprise-grade disaster management and tropical cyclone intelligence platform specifically engineered for the North Indian Ocean basin (Bay of Bengal and Arabian Sea). 

The platform bridges real-time satellite telemetry from ISRO's **MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre)**, India Meteorological Department (**IMD**) warnings, and generative AI models (**Gemini 2.5 Flash**) to provide actionable early warnings, storm trajectory modeling, rapid intensification (RI) risk assessments, and role-tailored emergency response guidance.

### Key Objectives:
- **Early Disaster Warning:** Provide up to 72 hours of advance warning for tropical cyclogenesis and rapid storm intensification.
- **Multilingual Public & Operational Safety:** Deliver plain-language safety recommendations in regional languages (Hindi, Gujarati, Tamil, Bengali, Odia, Telugu, English).
- **Offline Resilience:** Function uninterrupted in low-connectivity coastal emergency zones via Progressive Web App (PWA) architecture and pre-bundled offline telemetry fallbacks.
- **Role-Based Disaster Response:** Tailor AI insights for meteorologists, disaster managers, coastal port officials, researchers, and the general public.

---

## 2. Technical Stack & Dependencies

### Frontend Architecture
- **Framework:** React 19 (`react`, `react-dom`) with TypeScript (`~5.8.2`)
- **Build System:** Vite 6 (`vite`, `@vitejs/plugin-react`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`)
- **Animations:** Motion (`motion` / Framer Motion ecosystem)
- **Icons:** Lucide React (`lucide-react`)
- **GIS & Mapping:** Leaflet 1.9 (`leaflet`, `@types/leaflet`) with Web-Mercator WMS tile overlays
- **Offline Support:** `vite-plugin-pwa` for PWA caching and offline service worker registration

### Backend & Middleware Architecture
- **Runtime Environment:** Node.js with `tsx` development runner and `esbuild` bundling
- **Server Framework:** Express 5 (`express`) with rate-limiting, custom caching, and WMS proxying
- **Deployment Strategy:** Express server bundled with `esbuild` for Render Web Service deployment

### Database & Security Layer
- **Primary Database:** PostgreSQL (`pg` pool connection)
- **Fallback Store:** Local JSON file store (`data/users_db.json`) for zero-config offline desktop runs
- **Authentication:** PBKDF2-SHA512 salted password hashing (210,000 iterations) with HTTP-only session cookies
- **Security Protections:** Rate-limiters on auth and AI endpoints, input validation, CORS control, `x-powered-by` header disabling

### AI & Data Engine
- **Primary AI Client:** `@google/genai` (Gemini 2.5 Flash)
- **Domain Intelligence Fallback:** Deterministic offline rule engine for storm queries when API keys are absent
- **Telemetry Sources:** ISRO MOSDAC SCORPIO Live Feeds, INSAT-3DS / INSAT-3DR Satellite WMS, RainViewer Weather Radar API

---

## 3. Core System Capabilities & Features

```
+-----------------------------------------------------------------------------------+
|                                 CYCLONESIGHT AI                                  |
+-----------------------------------------------------------------------------------+
|  1. Live Satellite Overview | 2. GIS Trajectory Tracker | 3. Rapid Intensification  |
|  4. Impact & Risk Heatmap   | 5. IMD 4-Stage Alerts   | 6. AI Meteorological Bot  |
+-----------------------------------------------------------------------------------+
```

### 3.1 Live GIS Cyclone Tracking & Trajectory Mapping
- Renders historical and live cyclone paths on interactive Leaflet maps.
- Displays key observations: storm center coordinates ($\text{Lat}/\text{Lng}$), atmospheric pressure ($\text{hPa}$), sustained wind speed ($\text{km/h}$ and $\text{knots}$), and translation direction/speed.
- Multi-channel satellite overlays: TIR1 (Thermal IR 10.8 $\mu\text{m}$ for cloud top temperature), Water Vapor (WV 6.8 $\mu\text{m}$), and Visible spectrum.
- RainViewer real-time radar layer integration.

### 3.2 Rapid Intensification (RI) Early Warning Engine
- Evaluates storm risk based on:
  - **Sea Surface Temperature (SST):** $> 28^\circ\text{C}$
  - **Tropical Cyclone Heat Potential (TCHP):** $> 80\text{ kJ/cm}^2$
  - **Vertical Wind Shear:** Low shear environment ($< 15\text{ knots}$)
  - **Upper Tropospheric Outflow & Moisture Plumes**
- Computes an RI probability percentage (e.g., 78% 24h RI risk) to warn authorities of sudden category upgrades.

### 3.3 Impact & Vulnerability Risk Heatmaps
- Overlays population risk zones (e.g., Balasore, Kendrapara, Bhadrak, Purba Medinipur).
- Categorizes threat levels: High Risk, Moderate Risk, Low Risk.
- Highlights infrastructure vulnerabilities (ports, power grids, evacuation shelters, low-lying coastal belts).

### 3.4 IMD 4-Stage Warning Protocol Dispatch
Integrates official India Meteorological Department warning protocol stages:
1. **Stage 1 (Pre-Cyclone Watch):** Issued 72 hours prior to expected storm development.
2. **Stage 2 (Cyclone Alert - Yellow):** Issued 48 hours prior to coastal threat.
3. **Stage 3 (Cyclone Warning - Orange):** Issued 24 hours prior to landfall.
4. **Stage 4 (Post-Landfall Outlook - Red):** Issued 12 hours prior to landfall and post-impact.

### 3.5 CycloBot — AI Meteorological & Disaster Response Copilot
- Powered by Gemini 2.5 Flash (`@google/genai`).
- Persona-tailored responses for 5 user roles:
  - `public`: Immediate plain-language safety advice.
  - `disaster_manager`: Operational priority, shelter management, inter-agency coordination checks.
  - `coastal_official`: Port warning signals (Signals 1–11), marine safety, fishing restrictions.
  - `meteorologist`: Synoptic diagnostics, satellite pattern evaluation, forecast uncertainty.
  - `researcher`: Data limitations, dataset provenance, timestamp accuracy.
- Multi-language generation supporting Hindi, Gujarati, Tamil, Bengali, Odia, Telugu, and English.
- Always appends a standardized **"Quick summary:"** paragraph for urgent UI visibility.

---

## 4. Data Architecture & External Integrations

```
                          +-------------------------+
                          |   ISRO MOSDAC SCORPIO   |
                          | (Live Track & Catalogs) |
                          +------------+------------+
                                       |
                                       v
+------------------------+    +------------------+    +-----------------------+
|  INSAT-3DS / 3DR WMS   |--->|  Express Backend |<---|  RainViewer Radar API |
| (Satellite Imager H5)  |    | (Proxy & Cache)  |    |   (Live Radar Tiles)  |
+------------------------+    +--------+---------+    +-----------------------+
                                       |
                                       v
                              +------------------+
                              | React Client PWA |
                              +------------------+
```

### 4.1 ISRO MOSDAC Telemetry
- **Alert File:** `https://mosdac.gov.in/scorpio/alertfile.txt` (Live cyclogenesis alerts)
- **Lat/Lon Coordinates:** `https://mosdac.gov.in/scorpio/doc/latlon.txt`
- **Cyclone Archives:** `https://mosdac.gov.in/scorpio/jsons/cycloneNameList.json` (Tracks for storms such as DANA, REMAL, BIPARJOY, AMPHAN, MOCHA, MICHAUNG)
- **Live Track API:** `https://mosdac.gov.in/live/backend/cyclone_track.php`
- **WMS Proxy:** Internal server proxy at `/api/mosdac/wms-proxy` and `/api/mosdac/wms-tile` fetching geospatial tiles from MOSDAC THREDDS/GeoServer.

---

## 5. Database Schema & Persistence

### PostgreSQL Schema (`cyclone_sight_ai_database.sql`)

```sql
-- Core Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'public',
    organization VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Active User Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Saved Cyclones per User
CREATE TABLE IF NOT EXISTS saved_cyclones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cyclone_name VARCHAR(100) NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cyclone_name)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    wind_unit VARCHAR(10) DEFAULT 'kmh',
    pressure_unit VARCHAR(10) DEFAULT 'hpa',
    default_channel VARCHAR(20) DEFAULT 'TIR1'
);
```

---

## 6. API Reference

### Health & System Status
- `GET /api/health` — Checks server operational status and uptime.
- `GET /api/mosdac/auth-status` — Returns MOSDAC data feed synchronization status.

### MOSDAC Data Telemetry
- `GET /api/mosdac/cyclones` — Fetches complete cyclone archives by year.
- `GET /api/mosdac/alert` — Fetches official active cyclone alert and cyclogenesis position.
- `GET /api/mosdac/live-track` — Fetches active storm track GeoJSON.
- `POST /api/mosdac/track` — Fetches specific storm trajectory telemetry (e.g. `cyclone_name: "DANA"`).
- `GET /api/mosdac/catalog/:name` — Obtains INSAT-3DS/3DR HDF5 dataset catalog XML.
- `GET /api/mosdac/satellite-passes` — Returns real-time 15-minute satellite pass listings.
- `GET /api/mosdac/wms-tile` — Web-Mercator satellite tile proxy for Leaflet maps.

### AI Copilot Endpoint
- `POST /api/gemini/chat` — Submits user query, cyclone context, user role, and language code to Gemini 2.5 Flash (or domain fallback engine). Rate-limited to 25 requests per 10 minutes.

### Authentication & User Profile
- `POST /api/auth/signup` — Registers a new account.
- `POST /api/auth/login` — Authenticates email/password and returns a session cookie.
- `GET /api/auth/me` — Fetches current authenticated profile.
- `POST /api/auth/logout` — Destroys current user session.
- `POST /api/user/saved-cyclones` — Toggles saved storm bookmarks for signed-in accounts.

---

## 7. Project Folder Structure

```
Cyclon_desaster_management/
├── server.ts                    # Full-stack Express 5 server & API routes
├── render.yaml                  # Render Blueprint deployment config
├── vite.config.ts               # Vite configuration with PWA & Tailwind
├── package.json                 # Dependency definitions & scripts
├── cyclone_sight_ai_database.sql# PostgreSQL database schema script
├── data/
│   └── users_db.json            # Local JSON database fallback
├── server/
│   └── db.ts                    # Dual-mode PostgreSQL & JSON database driver
└── src/
    ├── App.tsx                  # Main application orchestrator
    ├── types.ts                 # TypeScript interfaces & types
    ├── i18n.tsx                 # Multilingual localization provider
    ├── data/
    │   ├── cycloneData.ts       # Initial storm records & constants
    │   └── mosdacRecords.json   # Offline MOSDAC database fallback
    ├── services/
    │   ├── authService.ts       # Authentication API client
    │   └── mosdacService.ts     # MOSDAC telemetry API client
    └── components/
        ├── Header.tsx           # Navigation header & user status
        ├── Sidebar.tsx          # Main navigation menu
        ├── SubHeader.tsx        # Active storm ticker & alerts
        ├── MetricCards.tsx       # Key metrics overview
        ├── LiveSatelliteOverview.tsx # Satellite imager container
        ├── ActiveCyclonesCard.tsx
        ├── RapidIntensificationCard.tsx
        ├── ForecastSummaryCard.tsx
        ├── ImpactOverviewCard.tsx
        ├── CyclogenesisOutlookCard.tsx
        ├── OfflineIndicator.tsx # PWA network status indicator
        ├── views/               # Full view components for each nav item
        │   ├── AICopilotView.tsx
        │   ├── AlertsNotificationsView.tsx
        │   ├── AnalyticsReportsView.tsx
        │   ├── AuthView.tsx
        │   ├── CycloneTrackerView.tsx
        │   ├── FeedbackView.tsx
        │   ├── ForecastModelsView.tsx
        │   ├── HistoricalCyclonesView.tsx
        │   ├── ImpactRiskMapView.tsx
        │   ├── LiveMonitoringView.tsx
        │   ├── RapidIntensificationView.tsx
        │   └── SettingsView.tsx
        └── modals/              # Interactive dialog overlays
            ├── AlertsModal.tsx
            ├── AuthModal.tsx
            ├── CycloneDetailModal.tsx
            ├── DataSourcesModal.tsx
            ├── FullMapModal.tsx
            └── HelpModal.tsx
```

---

## 8. Development & Installation Guide

### Prerequisites
- Node.js (v18.x or later)
- npm or bun
- PostgreSQL database (Optional for local development; system defaults to local JSON storage if omitted)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gauravsinghsudo/CYCLONESIGHTAI.git
   cd Cyclon_desaster_management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # API Keys
   GEMINI_API_KEY="your_gemini_api_key_here"

   # Database (Optional for desktop dev)
   DATABASE_URL="postgresql://username:password@localhost:5432/cyclone_sight_ai"
   DATABASE_SSL="false"

   # Optional MOSDAC Credentials
   MOSDAC_USERNAME=""
   MOSDAC_PASSWORD=""
   ```

4. **Run in Development Mode:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 9. Verification & Maintenance

To verify TypeScript types and build compliance:
```bash
npm run lint
npm run build
```

---

*Documentation maintained for CycloneSight AI.*
