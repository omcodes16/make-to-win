<div align="center">
  <img src="public/logo_new.jpg" alt="WeatherGPT Logo" width="120" />
  <h1>WeatherGPT — SIH 2026</h1>
  <p><strong>Advanced AI-Powered Weather & Disaster Management Platform</strong></p>
</div>

<hr/>

## 1. Title & Tagline
**WeatherGPT: Hyper-localized, Context-Aware AI Weather & Disaster Advisory System**  
**Problem Statement ID:** [VERIFY: Add SIH 2026 Problem Statement ID/Title here]

## 2. Proposed Solution

**The Problem:** Traditional weather applications only provide raw meteorological numbers (like "35°C, 80% humidity") which lack actionable context for specific demographics. A farmer, a pilot, and a local disaster management authority all require vastly different insights from the exact same weather data. Furthermore, warnings are often generic and fail to reach rural populations in their native languages.

**The Solution:** WeatherGPT bridges the gap between complex meteorological data and end-users through an **Agentic AI architecture**. By utilizing a conversational LLM interface coupled with real-time weather function calling, it translates raw data into structured, easy-to-understand advice.

**What Makes It Innovative:**
- **Contextual Advisory Layer:** The AI behavior radically shifts based on the selected user profile (Farmer, Fisherman, Aviation, General, Urban Planner), changing its terminology and reasoning.
- **Multilingual Support & Voice:** Supports native languages (Hindi, Bengali, Assamese) with Google Text-to-Speech (TTS) integration, making it accessible to non-English speakers and illiterate users.
- **Structured AI Responses:** The AI does not just output a block of text; it returns a strict JSON containing specific severities, advisories, relevant statistics, and predictive follow-up questions.
- **Authority Manager Portal:** Allows local disaster managers to securely bypass the standard feed and push targeted alerts to specific districts or geographic radiuses.

## 3. Technical Approach

### Tech Stack
- **Frontend:** React (v18), Vite, Tailwind CSS, React-Leaflet (for Radar Maps), Recharts.
- **Backend:** Node.js, Express proxy.
- **AI/LLM Integrations:** Groq API (Qwen 3.8-27b for function calling) as primary, Google Gemini API as fallback.
- **External Data APIs:** Open-Meteo (aggregating GFS, ECMWF, ICON models), Nominatim (OpenStreetMap geocoding), NDMA Sachet (CAP feeds), Google News RSS, Google TTS API.

### Architecture Diagram

```mermaid
flowchart TD
    User([User]) --> |Interacts with PWA| Frontend(Frontend - React, Vite, Tailwind)
    Frontend --> |Sends Chat/Profile/Location| Backend(Backend - Express Proxy)
    Backend --> |Prompts + Tools| LLM{AI Engine: Groq / Gemini}
    
    LLM -.-> |Function Calls| Tools(Tool Executor in server.js)
    Tools --> |Fetch Data| OpenMeteo(Open-Meteo: GFS, ECMWF, ICON)
    Tools --> |Geocode| Nominatim(Nominatim/OSM)
    Tools -.-> |Returns JSON| LLM
    
    LLM --> |Generates Structured Response| Backend
    Backend --> |Calculates Confidence Score| Frontend
    
    Manager([Disaster Manager]) --> |Issues Alerts| AuthPortal(Backend Alert Manager)
    AuthPortal --> |Syncs Active Alerts| Frontend
```

### The "Ask WeatherGPT" Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant AI as LLM (Groq/Gemini)
    participant API as External Weather APIs

    U->>F: "Will it rain tomorrow?" + Profile (Farmer)
    F->>B: POST /api/chat (Message, Profile, Language, Current Location)
    B->>AI: Inject System Prompt (Geography/Profile) + Chat History
    AI->>B: Tool Call: get_forecast(location)
    B->>API: Fetch Open-Meteo Forecast
    API-->>B: Return Weather JSON
    B-->>AI: Tool Result (Rain probability, temp)
    AI-->>B: Final JSON (answer, advisory, severity, followUps)
    B->>B: Calculate Confidence Score (GFS vs ICON vs ECMWF)
    B-->>F: Return Final JSON
    F-->>U: Render Chat Bubble + Severe Alert Banner
```

### Key Technical Decisions
- **Express Proxy Backend:** Prevents exposing sensitive AI API keys (Groq, Gemini) to the client side. It also acts as the central orchestrator for function calling.
- **Groq over Standard OpenAI:** Chosen for its ultra-low latency inference, which is crucial for a real-time conversational weather interface.
- **Server-Side Confidence Calculation:** We fetch data from three major models (GFS, ECMWF, ICON). The backend calculates the variance between these models. High variance equals a "Low Confidence" flag shown to the user, ensuring algorithmic transparency.

## 4. Feasibility & Viability

### Feasibility (What is implemented)
- Fully functioning conversational AI engine with tool-calling capabilities (`get_current_weather`, `get_forecast`, `get_historical_trend`, `get_seasonal_comparison`, `get_active_alerts`).
- Multi-profile persona switching (Farmer, Fisherman, Aviation).
- Manager dashboard for issuing custom radius/district disaster alerts.
- Live fetching of NDMA Sachet CAP feeds and Google News RSS.

### Challenges & Mitigation Strategies
1. **API Rate Limits / AI Hallucination:** 
   *Mitigation:* We have a built-in fallback strategy. If Groq hits a rate limit, the Express backend automatically degrades gracefully to the Gemini API. To prevent hallucinations, the LLM is restricted via the System Prompt to only answer weather/agriculture/travel questions and is heavily grounded by the real-time JSON tool data.
2. **Offline/Low Connectivity in Rural Areas:**
   *Mitigation:* The frontend caches critical alerts and recent weather stages in memory. Once an alert is downloaded, it persists even if the connection drops.
3. **NDMA Feed Reliability:**
   *Mitigation:* The backend wraps the Sachet feed fetch with a 5-second abort controller. If the feed is down (404), it gracefully falls back to showing only internal manager alerts instead of breaking the app.

### Scalability Path
- Transitioning to premium tiers for Open-Meteo/weather providers for higher TPM.
- Integrating official IMD automated weather station (AWS) APIs for deeper localized accuracy.
- Implementing a persistent database (PostgreSQL/MongoDB) to scale the Manager Alerts system beyond the current local JSON storage.

## 5. Impact & Benefits

**Social & Economic Impact:** Early warnings drastically reduce crop damage, protect marine livelihoods, and save lives during severe weather events. By delivering these insights in native languages with Voice TTS, WeatherGPT breaks the digital literacy barrier, reaching the most vulnerable populations in rural India.

| User Persona | Feature Used | Benefit / Outcome |
|--------------|--------------|-------------------|
| **Farmer** | Profession Profile + `get_forecast` | Avoids pesticide washout by knowing optimal spraying windows based on rainfall and humidity context. |
| **Fisherman** | Profession Profile + `get_active_alerts` | Prevents venturing into the sea during high wind gusts and severe WMO code conditions, protecting lives. |
| **Aviation** | Profession Profile + Model Consensus | Improves pre-flight planning and awareness of wind shear or low visibility fog risks. |
| **Authority** | Manager Dashboard + Custom Alerts | Instantly broadcasts localized alerts by radius or district to vulnerable populations without relying solely on state-level feeds. |

## 6. Research & References

**Data Sources & APIs Utilized:**
- **Open-Meteo:** An open-source weather API providing access to high-resolution NWP models including GFS (Global Forecast System), ECMWF (European Centre), and ICON.
- **Nominatim / OpenStreetMap:** Open-source geocoding used to map village/city names to exact latitude/longitude coordinates.
- **NDMA Sachet:** Integrated endpoints designed to read official Common Alerting Protocol (CAP) disaster feeds.
- **Google News RSS:** Fetches real-time, keyword-filtered disaster news for situational awareness.

**References:**
- [VERIFY: Add specific IMD/government reports, disaster management papers, or academic references relevant to your SIH 2026 problem statement here.]

## 7. Standard Project Sections

### Folder Structure
```text
📦 SIH-2026-WEATHER-GPT
 ┣ 📂 public/              # Static assets, icons, logos
 ┣ 📂 src/
 ┃ ┣ 📂 components/        # React components (ChatScreen, AlertsScreen, WeatherDashboard, etc.)
 ┃ ┣ 📂 context/           # React Global State context
 ┃ ┣ 📂 services/          # API wrapper functions
 ┃ ┣ 📂 utils/             # Helper functions (theme logic, WMO weather codes)
 ┃ ┣ 📜 App.jsx            # Main Frontend Router/Wrapper
 ┃ ┗ 📜 main.jsx           # React DOM Entry point
 ┣ 📂 server/
 ┃ ┗ 📜 tools.js           # Backend OpenAI/Groq Tool Definitions & API executors
 ┣ 📜 server.js            # Express Backend Server & AI Orchestrator
 ┣ 📜 package.json         # Project Dependencies
 ┣ 📜 tailwind.config.js   # Tailwind Styling Configuration
 ┗ 📜 README.md
```

### Installation & Setup

**Prerequisites:** Node.js (v18+)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omcodes16/sih-2026.git
   cd sih-2026
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   MANAGER_PASSCODE=weather2026
   MANAGER_SECRET=super-secret-key-123
   ```

4. **Run the Application:**
   You can run both the frontend and backend concurrently:
   ```bash
   npm run dev:all
   ```
   *(Alternatively, run `node server.js` and `npm run dev` in separate terminals).*  
   Open `http://localhost:5173` in your browser.

## 📊 Problem Statement Coverage & Roadmap

9 of 10 core requirements from the Problem Statement are fully implemented, 1 is partially implemented, and a few architectural enhancements remain for the final submission.

| PS Requirement | Status | Implementation Detail |
| --- | --- | --- |
| Real-time weather information retrieval | ✅ Fully Implemented | Fetching live data via `get_current_weather` tool mapped to Open-Meteo API. |
| Natural language querying for weather forecasts | ✅ Fully Implemented | Groq/Gemini-powered chat engine processing complex conversational queries. |
| Integration with NWP models (GFS/WRF) | ✅ Fully Implemented | Multi-model consensus approach pulling GFS, ECMWF, and ICON via Open-Meteo. |
| Extreme weather alerts and early warning | ✅ Fully Implemented | Combines WMO code triggers, NDMA Sachet CAP feeds, and a custom Manager Alert portal. |
| Location-based forecasting and advisory | ✅ Fully Implemented | Geocoding (Nominatim) combined with Profile-aware (Farmer, Aviation) AI reasoning. |
| Multilingual support for Indian languages | ✅ Fully Implemented | Natively supports English, Hindi, Bengali, and Assamese via LLM processing. |
| Climate trend and historical weather analysis | ✅ Fully Implemented | Features `get_historical_trend`, seasonal comparison, and historical forecast accuracy tracking. |
| Voice-enabled interaction for rural accessibility | ✅ Fully Implemented | Google Text-to-Speech (TTS) integrated directly into the chat response flow. |
| Mobile-based conversational AI platform | ✅ Fully Implemented | Built as a fully responsive Progressive Web App (PWA) mimicking native mobile behavior. |
| Scalable architecture supporting real-time ingestion | 🟡 Partially Implemented | Express backend is stateless and scalable, but manager alerts currently use local JSON files instead of a persistent DB. |

### 🚀 Future Upgrades & Roadmap

| Upgrade | Why It Strengthens the Solution | Priority |
| --- | --- | --- |
| Migrate local JSON data to PostgreSQL / MongoDB | Moves the Authority Manager portal from local file storage (`manager_alerts.json`) to a production-ready persistent database, fulfilling the suggested tech stack. | High |
| Real-time WIS 2.0 / MQTT Integration | Replaces REST polling with real-time push events for disaster alerts, directly matching the MoES expected tech stack. | High |
| Dockerization & Kubernetes Helm Charts | Ensures the Express backend and React frontend can be seamlessly deployed and orchestrated at scale on government cloud infrastructure. | High |
| SMS / IVR Fallback Alerts | Allows disaster warnings to reach rural users without smartphones or internet access. | Medium |
| Direct IMD API / Satellite Imagery Integration | Replaces generalized Open-Meteo aggregation with official Indian Meteorological Department (IMD) radar and satellite endpoints for greater local authority. | Medium |
| Aggressive Redis Caching Layer | Caches geocoding and weather responses to dramatically reduce third-party API costs and improve response latency during traffic spikes. | Low |

## 🚀 What's Built & The Vision Ahead

WeatherGPT already ships a fully functional AI-powered weather advisory platform covering agriculture, aviation, flood, and marine use-cases — built and working end-to-end, not just mocked UI.

### ✅ What's Complete

| Feature | Description | Tech Behind It |
|---------|-------------|----------------|
| **Conversational AI Weather Chat** | Users can ask natural language questions ("Will it rain tomorrow?") and get hyper-local, accurate answers. | Groq/Gemini LLMs + Open-Meteo API function calling. |
| **Context-Aware Profiles** | Advisory responses radically adapt depending on if the user is a Farmer, Fisherman, Pilot, or General user. | Prompt engineering with dynamic persona injection. |
| **Severe Weather & Authority Alerts** | Real-time warnings for extreme WMO conditions and a portal for authorities to push custom alerts. | WMO code triggers + NDMA Sachet fetcher + Manager JSON API. |
| **Multilingual Voice Support** | Natively understands and speaks English, Hindi, Bengali, and Assamese. | Google Text-to-Speech (TTS) + LLM translation logic. |
| **Live Radar & Weather Dashboard** | Interactive map for precipitation tracking and dynamic charts for daily forecasts. | React-Leaflet, OpenStreetMap, Recharts. |
| **Historical Climate Tracking** | Analyzes past weather data trends and provides accuracy tracking for previous forecasts. | Open-Meteo Archive API + Backend Accuracy Tracker. |

### 🇮🇳 Future Vision — Scaling for India

Beyond solving the immediate problem statement, here's how we envision WeatherGPT evolving into critical national infrastructure for climate resilience in India.

| Future Upgrade | Vision & Impact for India | Feasibility Timeline |
|----------------|---------------------------|----------------------|
| **Direct IMD Data Integration** | Replaces aggregated open-source weather data with official India Meteorological Department (IMD) feeds to guarantee government-grade accuracy, legitimacy, and regulatory compliance. | Short-term (0-6mo) |
| **SMS / IVR Fallback Alerts** | Bridges the extreme digital divide by ensuring critical flood/cyclone warnings reach non-smartphone users and feature phones in the deepest rural pockets. | Mid-term (6-18mo) |
| **AI Tuned to Indian Crop Calendars** | Evolving the farmer profile by fine-tuning the LLM specifically on localized Rabi/Kharif sowing cycles and regional monsoon patterns rather than generic global models. | Mid-term (6-18mo) |
| **22 Scheduled Languages Expansion** | Expanding NLP and TTS support to cover all official Indian languages, making the platform universally accessible across every state. | Short-term (0-6mo) |
| **Village-Level Micro-Climate Sensors** | Fusing satellite data with on-the-ground IoT weather sensors to provide hyper-local (village-level) accuracy, rather than interpolating from distant city-level weather stations. | Long-term (18mo+) |
| **Kisan Call Center Integration** | Partnering with existing government agricultural helplines to provide human operators with AI-assisted weather intelligence dashboards for faster farmer response times. | Long-term (18mo+) |

This roadmap reflects our intent to build not just a hackathon prototype, but a foundation for a national-scale climate resilience platform — because weather intelligence should be accessible to every farmer, pilot, and citizen in India, regardless of language, connectivity, or device.

### Team
- **Team Name:** [VERIFY: Add your SIH Team Name here]
- **Members:** [VERIFY: Add team member names here]

### License
[VERIFY: Add license information here, e.g., MIT License. If none, leave blank or specify proprietary for SIH.]
