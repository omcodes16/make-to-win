# WeatherGPT — Advanced Weather Intelligence & Assistant

![WeatherGPT](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-18.x-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC) ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)

WeatherGPT is a next-generation weather dashboard and conversational assistant built for the **Smart India Hackathon (SIH) 2026**. It aims to solve real-world problems by providing hyperlocal weather data, agricultural insights, and severe weather warnings in plain, accessible language across multiple regional languages.

## 🌟 Key Features

### 1. Dynamic, Atmosphere-Driven UI
*   **Contextual Wallpapers**: The entire application background dynamically transforms based on the live weather conditions (e.g., sunny, thunderstorms, fog, heatwaves).
*   **Glassmorphism Design**: High-performance, frosted glass UI elements ensure readability while letting the atmospheric backgrounds shine through.
*   **Time-Travel Forecasting**: The 7-Day forecast cards are fully interactive. Clicking on a future day instantly transitions the entire dashboard (background, temperatures, UV index, precipitation) to reflect that specific day's forecasted conditions.

### 2. Conversational AI Assistant (Powered by Gemini)
*   **Natural Language Queries**: Instead of just reading graphs, users can ask questions like *"Is it safe to spray pesticides tomorrow?"* or *"When will the rain stop?"*
*   **Multilingual Context**: The AI automatically detects the selected language and replies natively in **English, Hindi, Assamese, or Bengali**.
*   **Actionable Insights**: The AI is prompted to provide short, conversational answers and explicitly flag severe weather conditions with plain-language advisories.

### 3. Professional Interactive Radar
*   **Seamless Fluid Animations**: Powered by a robust embed engine, the live radar supports smooth panning and zooming without broken map tiles.
*   **Timeline Scrubber**: Users can hit "Play" to watch precipitation patterns and storm systems move across their region over time.

### 4. Comprehensive Air Quality (AQI)
*   **Live Open-Meteo Integration**: Fetches real-time Air Quality Index data independent of standard weather metrics.
*   **Health Indicators**: Dynamic progress bars and conditional health advisories (Good, Moderate, Unhealthy) adapt instantly to the current AQI levels.

### 5. Accessibility First (a11y)
*   **Text-to-Speech (TTS)**: Every AI response can be read aloud with a single click, mapped to local regional accents (e.g., `hi-IN`).
*   **High Contrast & Large Text**: Built-in toggles allow visually impaired users to comfortably read critical weather data.

---

## 🔄 Core Workflows

### 1. Search & Data Ingestion
1.  **User Input**: User searches for a location (e.g., "Guwahati").
2.  **Geocoding**: The input is passed to the Open-Meteo Geocoding API to retrieve precise Latitude and Longitude coordinates.
3.  **Parallel Fetching**: The app concurrently fetches:
    *   Standard Weather Data (Temp, Wind, Humidity, Hourly/Daily arrays).
    *   Air Quality Data (Live US AQI).
4.  **State Update**: The global React Context (`AppContext`) updates, instantly triggering the UI to transition backgrounds and update metrics.

### 2. AI Chat Workflow
1.  **Query Submission**: User types a question in the Chat UI.
2.  **Context Injection**: The frontend bundles the user's query with the *current live weather data* (Temp, Wind, Conditions) and sends it to the Express backend (`server.js`).
3.  **Prompt Engineering**: The Express server injects a strict System Prompt, forcing the Gemini LLM to respond in a specific JSON format (`{ answer, followUp, advisory, severity }`).
4.  **UI Rendering**: The structured JSON is parsed by the frontend, rendering a beautiful conversational bubble, optional severe alert banners, and enabling the Text-to-Speech engine.

### 3. Time-Travel Forecast Workflow
1.  **Selection**: User clicks a future day (e.g., "Thursday") on the 7-Day forecast grid.
2.  **Local State Override**: `WeatherDashboard` sets `selectedDay = 3`.
3.  **Dynamic Derivation**: The dashboard recalculates `displayTemp`, `displayFeelsLike`, and `displayCode` by mapping to `weather.daily.maxTemp[3]`, etc.
4.  **Theme Re-evaluation**: The background image engine evaluates the future `weatherCode` and instantly swaps the CSS gradients and background images to match Thursday's forecast.

---

## 🛠️ Tech Stack

*   **Frontend Framework**: React 18 (Vite)
*   **Styling**: Tailwind CSS
*   **State Management**: React Context API + `useReducer`
*   **Weather APIs**: Open-Meteo (Weather, Geocoding, Air Quality)
*   **AI Engine**: Google Gemini (via Express.js Proxy)
*   **Radar**: Windy.com Interactive Embed

## 🚀 Running Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the Development Servers**
   This project uses `concurrently` to run both the Vite frontend and the Express backend simultaneously.
   ```bash
   npm start
   ```
   * Frontend: `http://localhost:5173`
   * Backend: `http://localhost:3001`
