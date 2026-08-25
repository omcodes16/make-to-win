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

## Result
Within 2 minutes, Vercel will give you a live, production-ready link (e.g., `weather-gpt.vercel.app`). 
Since Vercel has a global CDN, your UI will load instantly, making it **super fast and responsive** for the SIH judges!

---
> [!IMPORTANT]
> Maine aapke API files (`chatApi.js` aur `AlertsScreen.jsx`) me zaroori changes kar diye hain taaki wo production me `VITE_API_URL` ko samajh sakein. Aapko bas ab GitHub par push karna hai. Boliye, kya main push karne me aapki madad karu?
