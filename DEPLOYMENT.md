# 🚀 WeatherGuard Deployment Guide

Follow these quick steps to deploy both the **NestJS Backend** and **React Frontend** online for free using Render and Vercel.

---

## ⚙️ Step 1: Deploy Backend (NestJS) on Render

1. Go to **[Render.com](https://render.com/)**, sign up, and click **New > Web Service**.
2. Connect your GitHub repository: `Bhanudheeravath15/WeatherGaurd-Admin`.
3. Configure the service settings:
   * **Name:** `weatherguard-api`
   * **Region:** Choose the closest region.
   * **Branch:** `main`
   * **Root Directory:** `api` (⚠️ *Very Important*)
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start:prod`
4. Add the following **Environment Variables** in the variables section:
   * `JWT_SECRET`: `any_random_secure_string_here`
   * `PORT`: `3000`
   * *(Optional)* `MONGODB_URI`: Your MongoDB Atlas connection string. *(If left blank, the app will automatically start a dynamic in-memory database on launch!)*
   * *(Optional)* `TELEGRAM_BOT_TOKEN`, `OPENWEATHER_API_KEY`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
5. Click **Create Web Service**. 
6. Render will compile and start the backend. Copy your live API URL (e.g. `https://weatherguard-api.onrender.com`).

---

## 🖥️ Step 2: Deploy Frontend (React) on Vercel

1. Go to **[Vercel.com](https://vercel.com/)**, log in, and click **Add New > Project**.
2. Import your GitHub repository: `Bhanudheeravath15/WeatherGaurd-Admin`.
3. Configure the Project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Edit and select the `admin` folder (⚠️ *Very Important*)
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Under **Environment Variables**, add the following settings:
   * `VITE_GOOGLE_CLIENT_ID`: Your Google client ID *(or use default placeholders to run in simulator mode)*
   * `VITE_GITHUB_CLIENT_ID`: Your GitHub client ID *(or use default placeholders)*
   * `VITE_GITHUB_REDIRECT_URI`: Point this to your Vercel URL callback: `https://<your-vercel-project-name>.vercel.app/login`
5. Click **Deploy**. Vercel will build and launch your dashboard portal!

---

## ⚡ Step 3: Link Client to API (CORS & Requests)

By default, the React frontend is configured to call `http://localhost:3000/api` for server actions. To point it to your live Render backend:

1. Open `admin/src/services/api.ts` on Vercel environment variables, or update it in the code:
   * Set `baseURL` to your live Render endpoint: `https://your-backend-name.onrender.com/api`.
2. Push any changes to GitHub; Vercel will automatically redeploy!
