# 🔧 Root Directory Fix - Quick Reference

## The Problem
When Vercel Root Directory is set to empty (for frontend), the backend API endpoints return **404 NOT_FOUND**.

## The Solution
Set Root Directory to `.` (repo root) so Vercel can find the `api/` folder.

---

## 🟡 How to Fix (2 minutes)

### Step 1: Change Root Directory
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click **"Settings"** tab
4. Click **"General"** (left menu)
5. Find **"Root Directory"** section
6. **Change to:** `.` (single dot/period)
7. Click **"Save"**

### Step 2: Redeploy
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

### Step 3: Test
Visit: `https://your-project.vercel.app/api/health`

✅ Should return: `{"status":"ok","message":"WheelEat API is running",...}`

---

## ✅ Why This Works

- **Root Directory = "."** → Vercel looks at repo root
- **Vercel finds `api/` folder** → Deploys serverless functions
- **`vercel.json` configures routes** → `/api/*` endpoints work

---

## 📁 File Structure (Must Be Like This)

```
WheelEat/                    ← Root Directory = "."
├── api/                     ← Backend API folder
│   ├── health.js
│   ├── users.js
│   ├── lib/
│   │   └── supabase.js
│   └── package.json
├── vercel.json              ← Vercel configuration
├── frontend/                ← Frontend (ignored for now)
└── ...
```

---

## ⚠️ Common Mistakes

❌ **Root Directory = ""** (empty) → API returns 404  
❌ **Root Directory = "frontend"** → API returns 404  
✅ **Root Directory = "."** → API works!

---

**For complete setup instructions, see: `VERCEL_BACKEND_DEPLOYMENT.md`**

