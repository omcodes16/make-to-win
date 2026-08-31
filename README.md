# 🌤️ WeatherGPT – SIH 2026

> **Smart India Hackathon 2026 | Problem Statement PS-26068**
> *India's First AI-Powered, Profession-Aware, Multilingual Hyperlocal Weather Intelligence Platform*

---

## 🏆 Why WeatherGPT Wins

WeatherGPT is **not** just another weather app. It is the first platform in India that combines:
- **Real-time NWP multi-model forecasts** (GFS + ICON + ECMWF) with transparent confidence scoring
- **Groq-powered AI** that calls live APIs on demand and answers in the user's own language
- **Profession-specific intelligence** for Farmers, Fishermen, Aviators, and Urban Planners
- **Integrated Emergency SOS** with GPS, photo upload, and disaster authority dispatch
- **4 Indian Languages** (English, Hindi, Assamese, Bengali) – covering UI, alerts, and AI chat

| Capability | Other Apps | WeatherGPT |
|---|---|---|
| Indian language UI | ❌ | ✅ EN, HI, AS, BN |
| AI chat with live data | ❌ | ✅ Groq + Tool Calling |
| Profession-specific advice | ❌ | ✅ 4 professions |
| 3-model NWP comparison | ❌ | ✅ GFS + ICON + ECMWF |
| Emergency SOS dispatch | ❌ | ✅ GPS + Photo + Server |
| Self-verifying accuracy | ❌ | ✅ Automated daily check |
| Disaster authority portal | ❌ | ✅ Full /manager dashboard |

---

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph CLIENT["📱 React PWA (Frontend)"]
        CHAT[WeatherGPT AI Chat]
        DASH[Weather Dashboard]
        ALERTS[Live Alerts Screen]
        STAGE[Weather Stage / Radar]
        HIST[Historical Analytics]
        PROF[Profession Hub Modal]
        SOS[SOS Emergency Button]
        MGR[Manager Dashboard]
    end

    subgraph SERVER["⚙️ Express.js Backend (Node.js)"]
        GROQ_EP["/api/chat Groq AI Orchestrator"]
        SOS_EP["/api/sos Emergency Dispatcher"]
        NEWS_EP["/api/news Google News"]
        TTS_EP["/api/tts Voice Synthesis"]
        SNAP_EP["/api/accuracy Forecast Verifier"]
        ALERT_EP["/api/alerts Disaster Authority"]
        TOOLS[AI Tool Functions]
    end

    subgraph BRAIN["🧠 AI Layer"]
        GEMINI[Google Gemini 3.6 Flash Primary Orchestrator]
    end

    subgraph EXTERNAL["🌐 External APIs"]
        OM_CORE[Open-Meteo Forecast]
        OM_HIST[Open-Meteo Archive]
        OM_NWP[GFS + ICON + ECMWF]
        NOMINATIM[Nominatim OSM Geocoding]
        GNEWS[Google News RSS]
        NDMA[NDMA Sachet CAP XML]
        GTTS[Google TTS]
    end

    subgraph DB["💾 Storage"]
        MONGO[(MongoDB Atlas)]
        JSON[(Local JSON Fallback)]
    end

    CLIENT --> SERVER
    SERVER --> BRAIN
    TOOLS --> OM_CORE & OM_HIST
    SERVER --> GNEWS & NDMA & GTTS & NOMINATIM
    SERVER --> MONGO
    MONGO -.->|offline fallback| JSON
    DASH --> OM_CORE & OM_NWP
```

---

## 🤖 AI Engine Deep Dive

### Chat Request Flow
```mermaid
sequenceDiagram
    participant U as 👤 User
    participant FE as 📱 React App
    participant BE as ⚙️ Express Server
    participant AI as 🧠 Google Gemini
    participant WX as ☁️ Open-Meteo

    U->>FE: Types question (any language)
    FE->>BE: POST /api/chat {message, location, lang}
    BE->>BE: Add Context & Tools
    BE->>AI: System prompt + user message + tool schemas
    AI->>BE: Tool call: get_current_weather
    BE->>WX: Fetch live weather data
    WX-->>BE: Weather JSON
    BE->>AI: Tool result returned
    AI->>BE: Final structured JSON response
    BE->>FE: {answer, advisory, severity, confidence, followUp}
```

---

## 🚨 Emergency SOS Flow

```mermaid
flowchart TD
    A["🆘 SOS Button Tapped"] --> B[Haptic vibration & Siren]
    B --> C[Open SOS Form]
    C --> D[Select help category]
    D --> E[Capture GPS coordinates]
    E --> F{GPS OK?}
    F -->|Yes| G["POST /api/sos {lat, lng, type}"]
    G --> H{Server OK?}
    H -->|✅ Yes| I["Help is Coming! Dispatched to authorities"]
    H -->|❌ No| J["Transmission Failed. Call 112!"]
    F -->|No| J
    I --> K[Authority sees SOS in /manager dashboard]
    K --> L[Officer dispatches rescue]
```

---

## 🛡️ NWP Model Confidence Flow

```mermaid
flowchart LR
    G[GFS Global NOAA USA] --> C
    I[ICON Global DWD Germany] --> C
    E[ECMWF IFS025 ECMWF UK] --> C
    C{Compare Models}
    C -->|High Agreement| HC["🟢 HIGH CONFIDENCE"]
    C -->|Moderate Divergence| MC["🟠 MEDIUM CONFIDENCE"]
    C -->|Large Divergence| LC["🔴 LOW CONFIDENCE"]
    HC & MC & LC --> SHOW[Display blended best-match forecast to user]
```

---

## 📈 Forecast Accuracy Pipeline

```mermaid
flowchart LR
    A[User Asks Chatbot] --> B[Log Prediction to DB]
    B --> C[Next Day Verification Job]
    C --> D[Fetch Actual Historical Weather]
    D --> E{Compare Predicted vs Actual}
    E -->|Exact Match| F["🟢 ACCURATE"]
    E -->|Slight Deviation| G["🟠 CLOSE"]
    E -->|Wrong| H["🔴 OFF"]
    F & G & H --> I[Update 🛡️ Trust & Accuracy Portal]
```

---

## 🌾 Profession Advisory System

```mermaid
flowchart TD
    A[User selects profession in Onboarding] --> B{Which profession?}
    B -->|Farmer| C[farmerAdvisory.js]
    B -->|Fisherman| D[fishermanAdvisory.js]
    B -->|Aviation| E[aviationAdvisory.js]
    B -->|Urban Planner| F[urbanPlanningAdvisory.js]

    C --> G[Checks: WMO code, rain, UV, wind, soil]
    D --> H[Checks: wave height, wind, storm code]
    E --> I[Checks: CAPE, cloud ceiling, visibility]
    F --> J[Checks: AQI, rain accumulation, temp]

    G & H & I & J --> K[Returns: icon + title + advice + type in user's language]
    K --> L[Advisory Card Displayed]
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React 18 & Vite** | Lightning-fast frontend UI |
| **Tailwind CSS** | Responsive styling |
| **Node.js & Express** | REST API Backend |
| **Google Gemini 3.6 Flash** | Primary AI Engine for Function Calling & Orchestration |
| **Nominatim (OSM)** | Hyperlocal Indian Village & Panchayat Geocoding |
| **MongoDB Atlas** | Persistent storage for SOS & Accuracy |
| **Open-Meteo** | Live weather & marine & agro data |
| **NDMA Sachet** | Official Govt Disaster Alerts |
| **WebSockets** | Real-time Alert Broadcasting |

---

## 🚀 Setup & Installation

### Environment Variables (`.env`)
```env
GROQ_API_KEY=your_groq_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here
VITE_API_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your_gemini_key
```

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start frontend + backend together
npm run dev:all

# Frontend available at: http://localhost:5173
# Backend available at:  http://localhost:3001
```

*Built to win SIH 2026 – Making weather intelligence accessible to every Indian, in their own language.*
