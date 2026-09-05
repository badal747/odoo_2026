# PeoplePay360: Cloud Deployment Guide (Render & Vercel)

This guide provides step-by-step instructions to host **PeoplePay360** on **Render** (FastAPI Backend) and **Vercel** (Next.js Frontend).

---

## 🚀 Part 1: Deploy Backend to Render (Python FastAPI)

### Step 1: Create a New Web Service
1. Open [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right corner and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your repo: `badal747/odoo_2026`.

### Step 2: Configure Service Details
Fill in the following fields:
* **Name**: `peoplepay360-api` (or any name you prefer)
* **Region**: Choose the closest region (e.g. `Singapore` or `Frankfurt`)
* **Branch**: `main`
* **Root Directory**: `backend`  *(⚠️ Important: must be `backend`)*
* **Runtime**: `Python 3`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Instance Type**: `Free`

### Step 3: Add Environment Variables
Scroll down to the **Environment Variables** section and add the following keys and values:

| Key | Value |
| :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` |
| `MONGODB_URL` | `mongodb+srv://24cs064_db_user:nyEFhp1egPDJ9lPU@cluster0.4fzkcia.mongodb.net/peoplepay360?retryWrites=true&w=majority&appName=Cluster0` |
| `DATABASE_NAME` | `peoplepay360` |
| `SECRET_KEY` | `peoplepay360_super_secret_jwt_key_hackathon_2026_odoo` |
| `ALLOWED_ORIGINS` | `*` |

### Step 4: Deploy & Copy Live URL
1. Click **Deploy Web Service** (or **Create Web Service**).
2. Wait 2–3 minutes for the build to finish.
3. Once the status shows **Live**, copy your Render URL at the top (e.g., `https://peoplepay360-api.onrender.com`).
4. Test by opening in your browser: `https://peoplepay360-api.onrender.com/` (should return JSON `{ "status": "Online" }`).

---

## 🌐 Part 2: Deploy Frontend to Vercel (Next.js 14+)

### Step 1: Import Project to Vercel
1. Open [Vercel Dashboard](https://vercel.com/new).
2. Under **Import Git Repository**, find and select `badal747/odoo_2026`.

### Step 2: Configure Project Settings
* **Project Name**: `peoplepay360`
* **Framework Preset**: `Next.js`
* **Root Directory**: Click **Edit** next to Root Directory and select **`frontend`** *(⚠️ Critical: Do not leave blank!)*

### Step 3: Add Environment Variable
Open the **Environment Variables** dropdown and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<YOUR-RENDER-BACKEND-URL>/api/v1` |

*(Example: `https://peoplepay360-api.onrender.com/api/v1`)*

### Step 4: Deploy
1. Click **Deploy**.
2. Vercel will run `npm install` (using our `.npmrc` legacy peer deps) and `next build`.
3. In ~90 seconds, you will receive your live domain (e.g., `https://peoplepay360.vercel.app`)!

---

## 🎯 Verification Checklist
- [ ] Open Vercel URL -> redirected to `/login`
- [ ] Click quick-fill **Admin** -> Log in -> Dashboard loads with 3D Sphere & Recharts
- [ ] Click quick-fill **Employee** -> Only Attendance & Time Off visible
- [ ] Test live attendance check-in
- [ ] Generate or inspect payslip PDF
