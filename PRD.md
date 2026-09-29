# 📋 Product Requirements Document (PRD)
# WeatherGPT — SIH 2026 | Problem Statement PS-26068

---

## 1. Document Information

| Field | Details |
|---|---|
| **Product Name** | WeatherGPT |
| **Version** | 1.0.0 |
| **Competition** | Smart India Hackathon (SIH) 2026 |
| **Problem Statement** | PS-26068 |
| **Document Date** | September 30, 2026 |
| **Status** | Active Development |

---

## 2. Executive Summary

**WeatherGPT** is an AI-powered, multilingual hyperlocal weather intelligence platform designed for India. It delivers profession-specific, actionable weather insights to diverse user groups — farmers, fishermen, aviation personnel, urban planners, and general citizens — through a conversational AI interface backed by real-time meteorological data, multi-model NWP analysis, and satellite-derived climate indices.

The platform integrates **Google Gemini AI**, **Bhashini (MeitY) NMT translation**, **Open-Meteo APIs**, **NDMA Sachet disaster alerts**, and a **multimodal crop diagnostic engine (Mausam-Drishti)** into a single progressive web app (PWA) accessible on both mobile and desktop devices, with full offline capabilities.

---

## 3. Problem Statement

India's diverse workforce — 58% engaged in agriculture, millions of fisherfolk, aviation workers, and urban dwellers — critically depends on weather information but faces systemic barriers:

- **Language barrier**: Most meteorological data is in English; 900 million+ Indians speak regional languages.
- **Generic forecasts**: IMD bulletins are not actionable at the village/field level.
- **Lack of sector-specific advisory**: A farmer needs spray windows; a fisherman needs wave heights; a pilot needs METAR-style briefings — all from the same raw weather data.
- **Disaster communication gaps**: Alerts from NDMA/Sachet do not reach rural communities in time.
- **No AI-powered crop diagnostics**: Farmers cannot correlate plant disease symptoms with actual microclimate data.

---

## 4. Goals & Objectives

### 4.1 Primary Goals
1. Deliver **hyperlocal, real-time weather intelligence** in **17+ Indian languages**.
2. Provide **profession-specific advisories** tailored to farmers, fishermen, aviation, and urban planners.
3. Enable **AI-powered crop leaf disease diagnosis** correlated with physical microclimate data.
4. Broadcast **NDMA disaster alerts** via real-time WebSocket push notifications and SMS.
5. Ensure **offline-first accessibility** via PWA caching and service workers.

### 4.2 Secondary Goals
- Expose **long-term climate research** tools using ERA5 reanalysis data (1990–present).
- Enable **community crowd-sourced weather reports** and feedback loops.
- Provide an **Authority Manager Dashboard** for government/emergency agencies.
- Support **SOS emergency triggers** with QR-code-based identity verification.

---

## 5. Target Users & Personas

| Persona | Description | Key Need |
|---|---|---|
| **Farmer (Kisan)** | Smallholder farmer in rural India | Crop spray windows, disease diagnosis, flood/hail insurance advice |
| **Fisherman (Matsya)** | Coastal/inland fisherfolk | Wave height, wind advisory, safe sailing windows |
| **Aviation Personnel** | Pilots, ATC, ground crew | METAR-style briefings, visibility, wind shear alerts |
| **Urban Planner** | City administrators, engineers | Heat island data, flood risk, infrastructure weather impact |
| **General Citizen** | Students, commuters, travelers | Daily weather, rain alerts, air quality |
| **Authority Manager** | NDMA, SDMA, district officials | Broadcast alerts, SOS management, bulletin publishing |

---

## 6. Feature Requirements

### 6.1 Core — AI Weather Chat (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Natural language conversational interface powered by Gemini AI | P0 |
| F-02 | Function-calling tool suite: `get_current_weather`, `get_forecast` (7-day), `get_historical_trend`, `get_seasonal_comparison`, `get_active_alerts`, `get_marine_weather`, `get_climate_indices` | P0 |
| F-03 | Profession-aware system prompts adapting AI persona per user role | P0 |
| F-04 | Multilingual input: auto-detect Indian script via Unicode block matching (0ms latency) | P0 |
| F-05 | Bhashini NMT translation (Dhruva API) with Gemini Flash fallback for all 17 supported languages | P0 |
| F-06 | Voice input (Web Speech API) and voice output (TTS) in regional languages | P1 |
| F-07 | Saved chat sessions with session persistence via localStorage | P1 |
| F-08 | Chat accuracy self-evaluation and user feedback modal | P2 |

### 6.2 Weather Dashboard & Visualization (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-09 | Real-time weather stage with dynamic animated backgrounds per condition (clear, rain, storm, snow, fog, etc.) | P0 |
| F-10 | Weather data: temperature, feels-like, humidity, wind speed, UV index, AQI, precipitation | P0 |
| F-11 | 7-day forecast cards with daily high/low, precipitation probability, weather codes | P0 |
| F-12 | Hourly charts (Recharts) — temperature, precipitation, humidity over 24h | P1 |
| F-13 | Radar map (Leaflet + OpenStreetMap) showing precipitation radar overlay | P1 |
| F-14 | Historical analytics — 7/30/90-day trend graphs for temperature and rainfall | P1 |
| F-15 | Seasonal comparison widget vs 5-year historical baseline | P1 |
| F-16 | NWP divergence visualizer — multi-model spread confidence display | P2 |
| F-17 | Cyclone tracker modal with storm track visualization | P2 |
| F-18 | Sky Band animated sky gradient reflecting real-time time-of-day and cloud cover | P2 |

### 6.3 Profession-Specific Advisories (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-19 | **Farmer Advisory**: Spray window safety (wind < 12 km/h, rain = 0%), sowing window, irrigation advisory | P0 |
| F-20 | **Fisherman Advisory**: Wave height, period, direction (Marine API), safe/unsafe sailing verdict | P0 |
| F-21 | **Aviation Advisory**: METAR-style briefing, wind, ceiling, visibility, QNH/QFE pressure | P0 |
| F-22 | **Urban Planning Advisory**: Heat index, flood risk score, infrastructure impact summary | P1 |
| F-23 | PMFBY crop insurance claim guidance for weather-induced crop damage | P1 |

### 6.4 Mausam-Drishti — Crop Diagnostic Engine (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-24 | Upload crop leaf photo → Gemini 3.6 Flash multimodal vision diagnosis | P0 |
| F-25 | Correlate diagnosis with 7-day microclimate history (humidity, temperature, rain, sporulation risk) | P0 |
| F-26 | 48-hour safe spray window calculation with hourly status (safe/caution/danger) | P0 |
| F-27 | Chemical + organic treatment prescription with precise dosage | P0 |
| F-28 | PMFBY insurance claim guidance for abiotic weather damage (hail, cyclone, flooding) | P1 |
| F-29 | Audio bulletin script generation for rural voice readout in regional languages | P1 |
| F-30 | Offline demo samples for 6 crop types (rice, tomato, wheat/hail, cotton, mustard, potato) | P2 |

### 6.5 Alerts & Disaster Management (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-31 | Real-time WebSocket (`ws`) connection for live NDMA Sachet disaster alert feed | P0 |
| F-32 | Severe alert banner (SevereAlertBanner) with color-coded severity (Red/Orange/Yellow) | P0 |
| F-33 | Push notifications (Web Push API + VAPID) for new alerts and SOS updates | P0 |
| F-34 | NDMA alert poller as background Node.js service | P1 |
| F-35 | Official Bulletin modal with structured emergency bulletin display | P1 |
| F-36 | Authority QR scanner modal for identity verification of responders | P2 |

### 6.6 SOS Emergency System (P1)

| ID | Requirement | Priority |
|---|---|---|
| F-37 | Floating SOS button with haptic feedback — triggers distress signal | P1 |
| F-38 | SOS queue with offline hold-and-send via localStorage | P1 |
| F-39 | SOS QR modal for geolocation-stamped QR code generation (jsQR + qrcode) | P1 |
| F-40 | Authority dashboard integration for SOS acknowledgement and response | P2 |

### 6.7 Authority Manager Dashboard (P1)

| ID | Requirement | Priority |
|---|---|---|
| F-41 | Protected manager view (separate route, authority-only access) | P1 |
| F-42 | Broadcast custom alerts to all PWA subscribers via Web Push | P1 |
| F-43 | SMS registry panel — register phone numbers for SMS-based alerts | P1 |
| F-44 | SMS simulator modal for testing alert broadcasts | P2 |
| F-45 | Official bulletin composer and publisher | P1 |

### 6.8 Climate Research Panel (P2)

| ID | Requirement | Priority |
|---|---|---|
| F-46 | ERA5 Reanalysis data (1990–present) via Open-Meteo Archive API | P2 |
| F-47 | Climate indices: Linear OLS trend, Z-score anomaly, CDD, CWD, Heatwave Days, Extreme Rain Days, GDD | P2 |
| F-48 | Yearly data table with sortable statistics | P2 |
| F-49 | CSV export of climate research results | P2 |
| F-50 | 24-hour server-side cache for expensive archive queries | P2 |

### 6.9 Localization & Accessibility (P0)

| ID | Requirement | Priority |
|---|---|---|
| F-51 | 17 Indian languages: English, Hindi, Assamese, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, Sanskrit, Maithili, Nepali, Konkani | P0 |
| F-52 | Onboarding language picker with native-script labels | P0 |
| F-53 | Profession selector during onboarding (general, farmer, fisherman, aviation, urbanPlanning) | P0 |
| F-54 | Dynamic UI background images per profession + per weather condition | P1 |
| F-55 | AMOLED dark theme support with profession-aware color accents | P1 |
| F-56 | Live compass widget for navigation | P2 |

### 6.10 PWA & Offline (P1)

| ID | Requirement | Priority |
|---|---|---|
| F-57 | Service worker (`sw.js`) with cache-first strategy for static assets | P1 |
| F-58 | Web App Manifest for installable PWA (Android/iOS/Desktop) | P1 |
| F-59 | Offline banner (OfflineBanner) with graceful degradation messaging | P1 |
| F-60 | Background sync for queued SOS signals | P2 |

### 6.11 Community & Feedback (P2)

| ID | Requirement | Priority |
|---|---|---|
| F-61 | Community weather reports — crowd-sourced local condition updates | P2 |
| F-62 | Reviews screen — user rating of advisory accuracy | P2 |
| F-63 | AI response accuracy tracker with thumbs-up/thumbs-down + modal feedback | P2 |
| F-64 | Sidebar accuracy widget showing rolling accuracy score | P2 |

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 |
| **Backend** | Node.js + Express 4 |
| **AI Engine** | Google Gemini 2.5 Flash / Gemini 3.6 Flash (Multimodal) |
| **Translation** | Bhashini Dhruva NMT API + Gemini Flash fallback |
| **Weather Data** | Open-Meteo Forecast API + Archive API (ERA5) + Marine API |
| **Disaster Alerts** | NDMA Sachet CAP Alert Feed |
| **Maps** | Leaflet + React-Leaflet + OpenStreetMap |
| **Charts** | Recharts |
| **Database** | MongoDB (Mongoose) — user settings, alerts, SOS, reviews |
| **Push Notifications** | Web Push (VAPID) via `web-push` |
| **Real-time** | WebSocket (`ws`) — live alert streaming |
| **QR Code** | `qrcode` (generation) + `jsQR` (scanning) |
| **Screen Capture** | Puppeteer (server-side bulletin PDF/screenshot) |
| **XML Parsing** | fast-xml-parser (NDMA CAP XML feed) |
| **TTS** | google-tts-api + Web Speech API (browser-native) |
| **State Management** | React Context API + useReducer |

### 7.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React PWA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Chat    │ │ Weather  │ │ Alerts   │ │  Research    │  │
│  │ Screen   │ │Dashboard │ │ Screen   │ │  Panel       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       └────────────┴────────────┴───────────────┘          │
│                     App Context / State                     │
│                  WebSocket (useAlertSocket)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS + WSS
┌─────────────────────────▼───────────────────────────────────┐
│                  SERVER (Node.js / Express)                  │
│  ┌────────────┐ ┌─────────────┐ ┌───────────────────────┐  │
│  │ /api/chat  │ │ /api/crop-  │ │ /api/marine-safety    │  │
│  │ (Gemini   │ │ diagnostic  │ │ /api/alerts            │  │
│  │  + Tools) │ │ (Mausam-   │ │ /api/push-subscribe    │  │
│  └─────┬──────┘ │  Drishti)   │ └───────────────────────┘  │
│        │        └──────┬──────┘                             │
│  ┌─────▼────────────────▼──────────────────────────────┐   │
│  │           Tool Executor + Geocode Cache              │   │
│  └──────────────────────────────────────────────────────┘   │
│        │ Bhashini NMT      │ NDMA Poller (ndmaPoller.js)   │
└────────┼───────────────────┼────────────────────────────────┘
         │                   │
┌────────▼────┐  ┌───────────▼────────────┐  ┌─────────────┐
│  Gemini AI  │  │ Open-Meteo APIs        │  │  NDMA CAP   │
│  (Google)   │  │ Forecast / Archive /   │  │  Sachet Feed│
└─────────────┘  │ Marine                 │  └─────────────┘
                 └────────────────────────┘
```

### 7.3 Data Flow — AI Chat

```
User Input (Any Language)
       ↓
Script Detection (Unicode, 0ms)
       ↓
[Non-English?] → Bhashini / Gemini Translate → English
       ↓
Gemini AI Chat (Function Calling)
       ↓ (tool calls)
Weather Tool Executor (get_current_weather / get_forecast / etc.)
       ↓
Open-Meteo API
       ↓
AI synthesizes response in English
       ↓
[Non-English?] → Bhashini / Gemini Translate → Target Language
       ↓
Rendered in Chat UI
```

---

## 8. API Integrations

| API | Purpose | Endpoint |
|---|---|---|
| **Open-Meteo Forecast** | Current + 7-day forecast | `api.open-meteo.com/v1/forecast` |
| **Open-Meteo Archive** | Historical ERA5 data (1990–) | `archive-api.open-meteo.com/v1/archive` |
| **Open-Meteo Marine** | Wave height, period, direction | `marine-api.open-meteo.com/v1/marine` |
| **Open-Meteo Geocoding** | City → lat/lng | `geocoding-api.open-meteo.com` |
| **NDMA Sachet** | Official disaster alert CAP feed | `sachet.ndma.gov.in/cap_public_website/FetchAllCapAlerts` |
| **Bhashini Dhruva** | NMT translation (MeitY) | `dhruva-api.bhashini.gov.in/services/inference/pipeline` |
| **Google Gemini** | AI reasoning + multimodal vision | `generativelanguage.googleapis.com` |
| **Google TTS** | Text-to-speech audio | `google-tts-api` (npm) |

---

## 9. Supported Languages

| # | Code | Language | Native Script |
|---|---|---|---|
| 1 | `en` | English | English |
| 2 | `hi` | Hindi | हिन्दी |
| 3 | `as` | Assamese | অসমীয়া |
| 4 | `bn` | Bengali | বাংলা |
| 5 | `mr` | Marathi | मराठी |
| 6 | `ta` | Tamil | தமிழ் |
| 7 | `te` | Telugu | తెలుగు |
| 8 | `gu` | Gujarati | ગુજરાતી |
| 9 | `kn` | Kannada | ಕನ್ನಡ |
| 10 | `ml` | Malayalam | മലയാളം |
| 11 | `pa` | Punjabi | ਪੰਜਾਬੀ |
| 12 | `or` | Odia | ଓଡ଼ିଆ |
| 13 | `ur` | Urdu | اردو |
| 14 | `sa` | Sanskrit | संस्कृतम् |
| 15 | `mai` | Maithili | मैथिली |
| 16 | `ne` | Nepali | नेपाली |
| 17 | `kok` | Konkani | कोंकणी |

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | AI chat response < 5s on 4G; weather data < 2s on Wi-Fi |
| **Availability** | 99.5% uptime for production; graceful degradation on API failure |
| **Offline Support** | Core UI and last-fetched weather accessible without connectivity |
| **Scalability** | Stateless Express server — horizontally scalable; MongoDB for persistence |
| **Security** | API keys in `.env` only; no secrets in client bundle; VAPID for push |
| **Accessibility** | Voice input/output; large touch targets for mobile; high-contrast themes |
| **Device Support** | PWA installable on Android (Chrome), iOS (Safari), Windows, macOS |
| **Localization** | RTL support for Urdu; all UI strings externalized to translation maps |
| **Geocode Caching** | 30-minute server-side geocode cache to reduce API calls |
| **Climate Cache** | 24-hour server-side cache for expensive ERA5 archive queries |

---

## 11. User Journey — Farmer Persona

```
1. Opens WeatherGPT PWA on Android phone
2. Onboarding: selects "Farmer" profession + "Hindi" language
3. Enters: "क्या मैं आज गुवाहाटी में फसल पर दवा छिड़काव कर सकता हूँ?"
4. App detects Devanagari script → translates to English via Bhashini
5. Gemini calls get_current_weather(Guwahati) → checks wind < 12 km/h, rain = 0
6. AI generates spray advisory with optimal window in Hindi
7. Farmer suspects disease → opens Mausam-Drishti modal
8. Uploads leaf photo → Gemini vision diagnoses Late Blight
9. App shows 7-day microclimate correlation + spray window + Ridomil dosage
10. NDMA flood alert arrives → SevereAlertBanner pulses red
11. Farmer saves offline → uses crop advisory without internet next day
```

---

## 12. Mausam-Drishti Engine — Feature Detail

**Mausam-Drishti (मौसम दृष्टि)** is the multimodal AI agro-diagnostic engine.

### Supported Crop Diagnoses (Demo Mode)
| Crop | Disease / Damage | Type |
|---|---|---|
| Rice / Paddy | Rice Blast (Magnaporthe oryzae) | Fungal |
| Tomato | Early Blight (Alternaria solani) | Fungal |
| Wheat | Hail + Lodging Damage | Abiotic |
| Cotton | Leaf Curl Virus (Whitefly vector) | Viral |
| Mustard | White Rust (Albugo candida) | Fungal |
| Potato | Late Blight (Phytophthora infestans) | Fungal |

### Microclimate Inputs
- Avg. Relative Humidity (7-day)
- Peak RH and hours above 80% (spore incubation threshold)
- Total 7-day and 48-hour rainfall
- Mean canopy temperature
- 48-hour hourly forecast (spray safety per hour)

### Output Schema
- Crop identification + local name in user's language
- Disease / damage condition name
- Severity rating (Mild → Critical)
- Confidence score (%)
- Visual symptoms description
- Microclimatic correlation (scientific link of RH/temp to pathogen)
- Spray decision: safe/unsafe, optimal window, chemical + organic treatment
- PMFBY insurance guidance (for abiotic damage)
- Audio bulletin script for voice playback

---

## 13. Climate Research Indices

| Index | Description |
|---|---|
| **Linear OLS Trend** | Temperature and precipitation year-over-year trend (slope °C/decade) |
| **Z-Score Anomaly** | How anomalous the latest year is vs the historical mean (standard deviations) |
| **CDD** | Consecutive Dry Days — longest unbroken drought streak per year |
| **CWD** | Consecutive Wet Days — longest unbroken wet spell per year |
| **Heatwave Days** | Days where max temp exceeded baseline mean by ≥5°C for 3+ consecutive days |
| **Extreme Rain Days** | Days with precipitation sum ≥ 100mm |
| **GDD** | Growing Degree Days (base 10°C) — agricultural thermal accumulation metric |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bhashini API downtime | Users can't use regional languages | Gemini Flash translation fallback |
| Open-Meteo rate limiting | Weather data unavailable | Server-side geocode + climate cache; exponential retry |
| NDMA feed unavailable | No government alerts | Local weather-based alert generation (wind > 50 km/h, rain > 10mm) |
| Gemini API quota exhaustion | AI chat broken | Graceful error message + cached last response |
| Offline connectivity | Full feature loss | PWA caching, offline banner, local advisory generation |
| VAPID push failures | Alerts not delivered | In-app WebSocket streaming as primary; push as secondary |
| **AI Model Hallucination** | Incorrect crop disease diagnosis or wrong spray advice harms farmer | Confidence score threshold (< 80% triggers "consult local KVK" disclaimer); demo fallback samples are scientifically vetted |
| **User Data Privacy** | Location and crop data of rural farmers misused | No PII stored beyond preferences; location used in-session only; MongoDB stores no raw coordinates; `.env` secrets never client-exposed |

---

## 15. Milestones & Delivery

| Phase | Milestone | Status |
|---|---|---|
| **Phase 1** | Core chat + weather dashboard + onboarding | ✅ Complete |
| **Phase 2** | Profession advisories + multilingual support | ✅ Complete |
| **Phase 3** | Mausam-Drishti crop diagnostic engine | ✅ Complete |
| **Phase 4** | Alerts, SOS, push notifications, WebSocket | ✅ Complete |
| **Phase 5** | Climate research panel + ERA5 indices | ✅ Complete |
| **Phase 6** | Manager dashboard + authority features | ✅ Complete |
| **Phase 7** | PWA + offline + performance tuning | ✅ Complete |
| **SIH 2026** | Final presentation and submission | 🔄 In Progress |

---

## 16. API Rate Limits & Cost Analysis

> [!NOTE]
> WeatherGPT is architected to operate within **zero-cost free tiers** for the SIH demonstration phase, with a clear scaling strategy for post-hackathon production deployment.

### 16.1 API Cost Breakdown

| API | Free Tier Limit | Our Usage Pattern | Cost at Scale |
|---|---|---|---|
| **Open-Meteo Forecast** | Unlimited (non-commercial) | ~200 calls/day estimated | Free (open-source; commercial: ~\$29/mo) |
| **Open-Meteo Archive (ERA5)** | Unlimited (rate-limited) | On-demand, 24h cached | Free; cache reduces calls by ~95% |
| **Open-Meteo Marine** | Unlimited | Per fisherman query | Free |
| **Open-Meteo Geocoding** | Unlimited | 30-min server cache | Free |
| **Google Gemini Flash** | 15 RPM / 1M tokens/day free | ~50 chat sessions/day | \$0.075 per 1M input tokens (paid) |
| **Bhashini Dhruva NMT** | Government API — free for Indian projects | Per-message translate | Free (MeitY mandate) |
| **NDMA Sachet CAP Feed** | Public API — no limit | Polled every 5 min | Free (government public data) |
| **MongoDB Atlas** | 512 MB free cluster | User prefs + alerts | Free (M0 tier) |
| **Web Push (VAPID)** | Browser-native, no cost | Per alert broadcast | Free |

### 16.2 Mitigation for API Limits

| Limit | Strategy |
|---|---|
| Gemini 15 RPM rate limit | Request queue + exponential backoff; batch translate to reduce calls |
| Open-Meteo 10,000 req/day soft limit | Geocode cache (30 min), climate cache (24 hr), forecast TTL (15 min) |
| Bhashini timeout (4s) | Parallel Gemini Flash fallback with 6s timeout |
| MongoDB 512 MB | TTL indexes on alerts collection; archived old sessions purged weekly |

### 16.3 Estimated Monthly Cost — Production (1,000 Daily Active Users)

| Component | Monthly Cost |
|---|---|
| Gemini API (chat + crop vision) | ~\$8–15 |
| MongoDB Atlas (M2 tier, 2 GB) | ~\$9 |
| Node.js hosting (Railway / Render) | ~\$7 |
| Open-Meteo (non-commercial) | \$0 |
| Bhashini | \$0 (MeitY) |
| **Total** | **~\$25–30/month** |

---

## 17. Environment Variables Required

```env
# Google AI
GEMINI_API_KEY=your_gemini_key

# Bhashini MeitY Translation
BHASHINI_INFERENCE_KEY=your_bhashini_key
BHASHINI_USER_ID=your_user_id

# MongoDB
MONGODB_URI=mongodb+srv://...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:team@example.com

# Server
PORT=3001
```

---

## 18. Success Metrics

| Metric | Target |
|---|---|
| AI Chat Response Accuracy | ≥ 85% (user-rated via feedback modal) |
| Language Coverage | 17 Indian languages |
| Profession Coverage | 5 user personas |
| Crop Diseases Diagnosable | 6 (real + demo) |
| Alert Delivery Latency | < 10 seconds (WebSocket) |
| PWA Install Rate | Demonstrated on Android + Desktop |
| Offline Functionality | Core weather advisory without internet |
| Climate Data Range | 1990 – Present (ERA5) |

---

## 19. UI/UX Overview

> [!NOTE]
> The UI adapts dynamically based on the user's **selected profession** and **live weather condition**, creating a deeply contextual visual experience unique to each user.

### 19.1 Screen Map

| Screen | Route | Component | Description |
|---|---|---|---|
| **Onboarding** | `/onboarding` | `Onboarding.jsx` | Language + profession selector; shown only once |
| **Chat** | `/` | `ChatScreen.jsx` | AI conversational interface — primary screen |
| **Weather Stage** | `/stage` | `WeatherDashboard.jsx` | Full dashboard: current + 7-day + hourly charts + radar |
| **Alerts** | `/alerts` | `AlertsScreen.jsx` | NDMA + local weather alerts feed |
| **Research** | `/research` | `ResearchPanel.jsx` | ERA5 climate indices explorer |
| **Reviews** | `/reviews` | `ReviewsScreen.jsx` | Community accuracy feedback |
| **Manager** | `/manager` | `ManagerDashboard.jsx` | Authority alert broadcast + SOS management |

### 19.2 Dynamic Theming System

| Trigger | Effect |
|---|---|
| Weather condition (rain, storm, snow, fog…) | Background image + gradient overlay changes in 1s transition |
| Profession: Farmer | Green farmland background tint |
| Profession: Fisherman | Deep blue marine background tint |
| Profession: Aviation | Blue-grey sky background tint |
| Profession: Urban Planning | Purple civic background tint |
| AMOLED dark mode | Pure black base (#070b14) with profession accent |

### 19.3 Key UI Components

| Component | Purpose |
|---|---|
| `SkyBand.jsx` | Animated sky gradient reflecting real-time sun angle + cloud cover |
| `WeatherScene.jsx` | Animated weather particle scene (rain drops, snowflakes, lightning) |
| `SevereAlertBanner.jsx` | Pulsing red/orange banner on severe NDMA alerts |
| `MausamDrishtiModal.jsx` | Crop photo upload + AI diagnosis result display |
| `SagarRakshakModal.jsx` | Marine safety card for fishermen |
| `SosButton.jsx` | Floating emergency SOS button — always visible on all screens |
| `LiveCompass.jsx` | Real-time device orientation compass widget |
| `BottomNav.jsx` | Mobile-first 5-tab navigation bar |
| `OfflineBanner.jsx` | Top banner when device goes offline |
| `ModelConfidence.jsx` | AI forecast model divergence confidence indicator |

### 19.4 Accessibility & UX Principles
- **Mobile-first**: Designed for rural Android users with small screens and slow networks
- **Large touch targets**: All interactive elements ≥ 44×44px
- **Voice-first**: Mic button on chat + TTS readout of AI responses
- **Progressive disclosure**: Complex data (climate indices, NWP divergence) hidden behind research tab
- **Instant tab switching**: Visited tabs stay mounted in DOM (no re-fetch on tab switch)
- **RTL support**: Urdu text renders right-to-left correctly

---

## 20. Sustainability & Future Roadmap

> [!IMPORTANT]
> WeatherGPT is designed not just as a hackathon prototype but as a production-ready platform with a clear path toward national deployment and long-term sustainability.

### 20.1 Post-SIH Roadmap

```
SIH 2026 (Now)
    │
    ▼
Q4 2026 — Pilot Deployment
    • Partner with 2–3 Krishi Vigyan Kendras (KVKs) in Assam
    • Onboard 500 farmers in Brahmaputra flood zone for real feedback
    • Integrate with IMD (India Meteorological Department) official API
    │
    ▼
Q1 2027 — State Government Integration
    • SDMA (State Disaster Management Authority) alert broadcast
    • PMFBY insurance API integration (direct claim filing)
    • Android native app wrapper (Capacitor/TWA)
    │
    ▼
Q2 2027 — Scale & Monetization
    • 10,000+ DAU target across 5 states
    • B2G: License to state agriculture departments (SaaS model)
    • B2B: White-label API for agri-fintech, crop insurance companies
    │
    ▼
Q3–Q4 2027 — National Expansion
    • IMD data integration (official radar + district bulletins)
    • Feature parity for all 28 states + 8 UTs
    • AI model fine-tuned on Indian crop disease image dataset
```

### 20.2 Social Impact Targets

| Metric | 1-Year Target | 3-Year Target |
|---|---|---|
| Farmers reached | 10,000 | 500,000 |
| States covered | 3 | 28 |
| Languages active | 5 | 17 (all) |
| Crop losses prevented (est.) | ₹2 Cr | ₹200 Cr |
| Disaster alerts delivered | 1,000 | 1,00,000 |

### 20.3 Revenue & Sustainability Model

| Stream | Description | Timeline |
|---|---|---|
| **B2G Licensing** | State agriculture/disaster management depts pay per seat | Q2 2027 |
| **B2B API** | Weather + crop advisory API for agri-fintech startups | Q3 2027 |
| **PMFBY Integration Fee** | Revenue share from insurance companies for claim facilitation | Q4 2027 |
| **NGO / CSR Grants** | Free tier sponsored by agricultural NGOs and CSR programs | Immediate |
| **Open-Source Core** | Core weather components open-sourced; enterprise features paid | Q1 2027 |

### 20.4 Government Alignment

WeatherGPT directly supports the following national missions:
- 🇮🇳 **Digital India** — multilingual AI for rural citizens
- 🌾 **PM Kisan** — precision agri-advisory for 110 million farmers
- 🌊 **NDMA Sendai Framework** — early warning and disaster communication
- 🗣️ **Bhashini / NLTM** — promoting Indian language technology
- 🛡️ **PMFBY** — reducing crop loss and improving insurance claim rates

---

## 21. Glossary

| Term | Definition |
|---|---|
| **NWP** | Numerical Weather Prediction — computer model-based atmospheric simulation |
| **ERA5** | ECMWF Reanalysis 5th Generation — global historical climate dataset |
| **CAP** | Common Alerting Protocol — NDMA/Sachet standard for disaster alerts |
| **NDMA** | National Disaster Management Authority (India) |
| **SDMA** | State Disaster Management Authority (India) |
| **IMD** | India Meteorological Department — national weather agency |
| **PMFBY** | Pradhan Mantri Fasal Bima Yojana — Government of India crop insurance scheme |
| **KVK** | Krishi Vigyan Kendra — district-level agricultural extension center |
| **Bhashini** | National Language Translation Mission by MeitY, Government of India |
| **NMT** | Neural Machine Translation |
| **VAPID** | Voluntary Application Server Identification — Web Push authentication standard |
| **AQI** | Air Quality Index |
| **WMO Code** | World Meteorological Organization standardized weather condition code |
| **CDD / CWD** | Consecutive Dry / Wet Days — climate extreme indices |
| **GDD** | Growing Degree Days — heat accumulation metric used in agriculture |
| **METAR** | Meteorological Aerodrome Report — standard aviation weather format |
| **PWA** | Progressive Web App — installable web application |
| **DAU** | Daily Active Users |
| **B2G / B2B** | Business-to-Government / Business-to-Business |

---

*Document prepared for SIH 2026 submission — WeatherGPT Team*
