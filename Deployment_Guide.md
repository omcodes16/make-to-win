# SIH 2026: Free & Fast Deployment Guide

To make the app **extremely fast and responsive**, we will split the hosting:
1. **Frontend (UI)** -> **Vercel** (Global Edge CDN, Instant loading)
2. **Backend (AI & News)** -> **Render** (Free Node.js server)

Follow these steps carefully:

## Step 1: Upload to GitHub (Mandatory)
Both Vercel and Render need your code to be on GitHub.
1. Go to [GitHub](https://github.com/) and create a **New Repository** (e.g., `weather-gpt-sih`).
2. Open your VS Code terminal (where the app is) and run these exact commands:
   ```bash
   git add .
   git commit -m "Ready for Deployment"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```
   *(If you get an error, let me know and I will fix it for you)*

## Step 2: Deploy Backend to Render (Free)
1. Go to [Render.com](https://render.com/) and sign in with GitHub.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Name:** `weather-gpt-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Scroll down to **Environment Variables**:
   - Add `GROQ_API_KEY` = `(Your actual Groq API Key)`
   - Add `VAPID_PUBLIC_KEY` = `BBbK9hNpoPr4r9tfUNERfurJw-BQBKOp1E7H9zBCQpqzINorKvFmD9JAQrUWCbL42830gfS1Lmxzw0RGUUl6utU`
   - Add `VAPID_PRIVATE_KEY` = `vsJiPHKStvs5USWUWlp5ilKuY32_EtOkElyFHmDn7EM`
   - *(Optional)* Add `MONGODB_URI` = `(Your MongoDB connection string)`
6. Click **Create Web Service**. 
7. Once it says "Live", copy the URL (e.g., `https://weather-gpt-api.onrender.com`).

## Step 3: Deploy Frontend to Vercel (Lightning Fast)
1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** section, open **Environment Variables**:
   - Add Name: `VITE_API_URL`
   - Add Value: `(Paste your Render URL here, without the trailing slash)`
5. Click **Deploy**.

## Option A: Split Deployment (Vercel Frontend + Render Backend)
*(Follow Steps 2 & 3 above if you want your frontend hosted on Vercel and backend on Render)*

---

## Option B: Full-Stack Docker Deployment on Render (All-in-One)
With Docker, the entire application (React frontend UI + Express backend + WebSockets + Web Push) is packaged into a single container running on Render at zero cost.

### How to Deploy on Render using Docker:
1. Push your latest code to GitHub.
2. Go to [Render.com](https://render.com/) and sign in.
3. Click **New +** -> **Web Service**.
4. Select your GitHub repository.
5. In the configuration page:
   - **Name**: `weathergpt-sih`
   - **Region**: `Singapore` (Fastest for India)
   - **Runtime**: Select **Docker** (Render will automatically detect the `Dockerfile`)
   - **Instance Type**: **Free**
6. Scroll down to **Environment Variables** and add:
   - `GROQ_API_KEY`: `(Your Groq API Key)`
   - `GEMINI_API_KEY`: `(Your Gemini API Key)`
   - `VAPID_PUBLIC_KEY`: `BBbK9hNpoPr4r9tfUNERfurJw-BQBKOp1E7H9zBCQpqzINorKvFmD9JAQrUWCbL42830gfS1Lmxzw0RGUUl6utU`
   - `VAPID_PRIVATE_KEY`: `vsJiPHKStvs5USWUWlp5ilKuY32_EtOkElyFHmDn7EM`
   - *(Optional)* `MONGODB_URI`: `(Your MongoDB connection string)`
7. Click **Create Web Service**.

Render will automatically build the multi-stage Docker container (compile the React Vite bundle, start the Express server, and expose everything on `https://weathergpt-sih.onrender.com`). All features—including PWA installation, offline shell caching, and Web Push notifications—work out of the box with zero CORS issues!
