
const fs = require("fs");
let content = fs.readFileSync("README.md", "utf8");

const newFlowchart = `## 3. Data Flow Diagrams

### 3.0 - End-to-End Prototype Working Flowchart

\`\`\`mermaid
graph TD
    %% Core Users
    User([👨‍🌾 Citizen / Farmer / Official]) -->|Opens Web App| UI[📱 React.js Frontend]

    %% Frontend interactions
    UI -->|1. Searches Location / Grants GPS| Loc[Geocoding & Location State]
    UI -->|2. Asks Weather Question| Chat[💬 WeatherGPT AI Interface]
    UI -->|3. Navigates Dashboard| Dash[📊 Weather & Alert Dashboards]

    %% Backend Services
    Loc -->|Fetch coordinates| BE[⚙️ Node.js Express Backend]
    Chat -->|Natural Language Prompt| BE
    Dash -->|Live Data Request| BE

    %% AI & External Processing
    subgraph Intelligence & Processing Layer
        BE -->|Sends Context & Tools| Groq[🧠 Groq / LLaMA 70B AI]
        BE -->|Fetch Forecasts| OM[🌤️ Open-Meteo API]
        BE -->|Fetch Disaster Feeds| GDACS[🚨 GDACS / NDMA Feeds]
        BE -->|Fetch News| News[📰 Google News RSS]
        BE -->|Synthesize Voice| TTS[🗣️ Google TTS API]
    end

    %% Returns
    Groq -->|Parsed Intent & Action| BE
    OM -->|NWP Models GFS/ECMWF| BE
    GDACS -->|Active Alerts| BE

    %% Display to User
    BE -->|Aggregated JSON Data| UI
    UI -->|Renders Real-time Cards & Maps| Dash
    UI -->|Speaks Response| Audio[🔊 Audio Output]
    UI -->|Updates Profession Hub| Prof[💼 Sector Advisories]
\`\`\`

`;

content = content.replace(/## 3\. Data Flow Diagrams\s*/, newFlowchart);

fs.writeFileSync("README.md", content, "utf8");
console.log("Successfully inserted flowchart via regex.");

