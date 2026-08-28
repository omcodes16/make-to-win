<div align="center">
  <img src="public/logo_new.jpg" alt="WeatherGPT Logo" width="120" />
  <h1>WeatherGPT — SIH 2026</h1>
  <p><strong>Advanced AI-Powered Weather & Disaster Management Platform for Northeast India</strong></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![GROQ](https://img.shields.io/badge/GROQ_AI-F55036?style=for-the-badge&logo=ai&logoColor=white)](https://groq.com/)
</div>

<hr/>

## 🏆 Overview & Problem Statement (PS)

**WeatherGPT** is a hyper-localized, AI-driven weather and disaster management platform built specifically to address the complex meteorological challenges of **Northeast India (NER)**. 

### The Problem
Traditional weather apps provide generic data (temperature, humidity) that lacks actionable context for specific demographics. Farmers, fishermen, and aviation personnel in regions with erratic weather patterns need **role-specific, multilingual advisories** rather than just raw numbers. Furthermore, local disaster management authorities lack a streamlined way to push localized alerts directly to vulnerable populations.

### Our Proposed Solution
WeatherGPT bridges the gap between raw meteorological data (from IMD, Open-Meteo, ECMWF) and end-users using an **Agentic AI architecture**. The platform translates complex weather parameters into actionable insights tailored to specific professions, delivered in native languages (Hindi, Bengali, Assamese, English), alongside a robust dashboard for disaster management authorities.

---

## 🏗️ Technical Approach & Architecture

### 1. Agentic AI Layer (GROQ Qwen 3.8-27b + Tool Calling)
Instead of relying on static rule-based systems, WeatherGPT uses a cutting-edge **Large Language Model (LLM)** equipped with function-calling capabilities.
- When a user asks a question in their native language (e.g., "Will it rain in Guwahati tomorrow?"), the AI autonomously calls the `get_forecast` API tool.
- The AI interprets the raw JSON response (precipitation probability, WMO weather codes, UV index) and formulates an answer specific to the user's selected **Profession Profile** (e.g., advising a farmer on crop spraying vs. advising a pilot on wind shear).

### 2. Multi-Model Weather Consensus
We aggregate data from leading Numerical Weather Prediction (NWP) models to ensure the highest accuracy:
- **GFS (Global Forecast System)**
- **ECMWF (European Centre)**
- **ICON (German model)**
- **IMD Data** (via local integrations)

### 3. Progressive Web App (PWA) & Multi-Platform
Built with React and Vite, the platform is fully responsive and behaves like a native app on mobile devices.
- **Offline Resilience:** Aggressive local caching using a custom versioned `localStorage` system ensures the app never crashes during data structure changes and provides cached alerts when users lose internet connectivity during disasters.
- **Accessible Design:** Features high-contrast modes, large text toggles, and integrated Google Text-to-Speech (TTS) for illiterate users.

---

## 🌟 Key Features That Set Us Apart

1. **🧑‍🌾 Profession-Aware Contextual AI**  
   The same weather data generates completely different insights depending on the active profile:
   - *Farmer:* Soil moisture retention, pesticide spraying windows.
   - *Fisherman:* Wind gust warnings, wave height approximations, safe sea times.
   - *Aviation/Urban:* Fog visibility, severe storm cell tracking.

2. **🌍 Native Multilingual Support**  
   Full interface and AI translation for **English, Hindi, Bengali, and Assamese**. The AI understands Romanized native text (e.g., "aaj barish hogi kya") and responds accurately.

3. **🛡️ Authority Dashboard (Disaster Management)**  
   A secure, passcode-protected portal (`ManagerDashboard`) for state authorities to instantly broadcast custom severe weather alerts (NDMA standard) to users in specific districts.

4. **⚡ Real-Time WMO Code Alert Engine**  
   Our alert engine doesn't just look at rainfall amounts. It parses real-time WMO (World Meteorological Organization) weather codes. If a severe thunderstorm (Code 95/96) is detected, alerts are triggered instantly even if millimeter rainfall predictions are low.

5. **📡 Live GPS & Geocoding**  
   One-tap "Live Location" automatically reverse-geocodes the user's coordinates and queries the AI for an immediate, hyper-local situational report.

---

## ⚙️ Tech Stack

- **Frontend:** React.js, TailwindCSS, Vite
- **Backend:** Node.js, Express.js
- **AI/LLM Provider:** GROQ (Qwen3.8-27b) with Gemini as an automated fallback
- **Weather APIs:** Open-Meteo, OpenStreetMap (Geocoding)
- **Deployment:** Ready for Vercel (Frontend) & Render/Heroku (Backend)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- GROQ API Key (for the AI Agent)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omcodes16/weather-gpt-sih-2026.git
   cd weather-gpt-sih-2026
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Application:**
   Start both the backend Express server and the Vite frontend simultaneously:
   ```bash
   # Terminal 1: Start AI Backend
   node server.js

   # Terminal 2: Start Frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🎯 How We Win Across Platforms
- **Scalability:** The decoupled architecture allows the Express backend to serve mobile apps (Flutter/React Native) in the future using the exact same `/api/chat` endpoints.
- **Cost Efficiency:** Using GROQ provides ultra-fast inference at a fraction of the cost of GPT-4, combined with free-tier weather APIs, making state-wide deployment economically viable.
- **Human-Centric:** By focusing on *what the weather means* rather than *what the weather is*, WeatherGPT directly impacts livelihoods and saves lives.

<div align="center">
  <i>Built with ❤️ for Smart India Hackathon 2026</i>
</div>
