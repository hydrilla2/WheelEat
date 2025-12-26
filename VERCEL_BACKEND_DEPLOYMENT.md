# 🚀 Vercel Backend Deployment Guide

**This guide fixes the Root Directory issue and gets your backend API working on Vercel.**

---

## ✅ What Cursor Did Automatically

- ✅ Created `api/health.js` - Health check endpoint
- ✅ Created `api/users.js` - Example endpoint with Supabase
- ✅ Created `api/lib/supabase.js` - Supabase connection
- ✅ Created `api/package.json` - Dependencies
- ✅ Created `vercel.json` - Vercel configuration (works with Root Directory = ".")
- ✅ Created `supabase-schema.sql` - Database schema

**You don't need to edit any of these files!**

---

## 🟡 What You Must Do Manually

### Step 1: Set Up Supabase (5 minutes)

#### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `wheeleat` (or any name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes for project creation

#### 1.2 Get Your Supabase Credentials
1. In Supabase dashboard, click **"Project Settings"** (gear icon)
2. Click **"API"** in the settings menu
3. Copy these TWO values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. **Save both values** - you'll need them in Step 3

#### 1.3 Create Database Tables
1. In Supabase, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase-schema.sql` in this project
4. **Copy ALL the SQL code** from that file
5. **Paste it** into Supabase SQL Editor
6. Click **"Run"** button (or press `Ctrl+Enter`)
7. ✅ You should see: **"Success. No rows returned"**

#### 1.4 Verify Tables Were Created
1. In Supabase, click **"Table Editor"** (left sidebar)
2. You should see two tables:
   - ✅ `users`
   - ✅ `spin_logs`
3. Click on `users` table - you should see 2 example rows

**✅ Step 1 Complete!**

---

### Step 2: Fix Vercel Root Directory (2 minutes)

**This is the critical step that fixes your 404 errors!**

1. Go to https://vercel.com/dashboard
2. Click on your project (WheelEat or whatever you named it)
3. Click **"Settings"** tab
4. Click **"General"** in the left menu
5. Scroll down to **"Root Directory"**
6. **Change it to:** `.` (just a single dot/period)
7. Click **"Save"**

**Important:** The Root Directory must be `.` (repo root) for the backend API to work!

---

### Step 3: Add Environment Variables (3 minutes)

1. Still in Vercel project settings, click **"Environment Variables"** (left menu)
2. Add **Variable 1:**
   - **Name**: `SUPABASE_URL`
   - **Value**: Paste your Supabase Project URL (from Step 1.2)
   - **Environment**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Add"**

3. Add **Variable 2:**
   - **Name**: `SUPABASE_ANON_KEY`
   - **Value**: Paste your Supabase anon public key (from Step 1.2)
   - **Environment**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Add"**

4. ✅ You should now see both variables listed:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

**✅ Step 3 Complete!**

---

### Step 4: Deploy (2 minutes)

#### Option A: Deploy via Vercel Dashboard (Easiest)
1. In Vercel dashboard, go to **"Deployments"** tab
2. Click the **"..."** menu (three dots) on the latest deployment
3. Click **"Redeploy"**
4. ✅ Wait 1-2 minutes for deployment to complete

#### Option B: Deploy via Command Line
1. Open terminal/PowerShell in your project folder
2. Run:
   ```bash
   vercel --prod
   ```
3. ✅ Wait for deployment to complete

**✅ Step 4 Complete!**

---

### Step 5: Test Your API (1 minute)

1. Get your Vercel project URL:
   - Go to Vercel dashboard → Your project → **"Deployments"** tab
   - Click on the latest deployment
   - Copy the URL (looks like: `https://wheeleat-xxxxx.vercel.app`)

2. Test Health Endpoint:
   - Open in browser: `https://your-project.vercel.app/api/health`
   - ✅ You should see:
     ```json
     {
       "status": "ok",
       "message": "WheelEat API is running",
       "timestamp": "2024-..."
     }
     ```

3. Test Users Endpoint:
   - Open in browser: `https://your-project.vercel.app/api/users`
   - ✅ You should see:
     ```json
     {
       "success": true,
       "count": 2,
       "users": [
         {
           "id": "...",
           "name": "John Doe",
           "email": "john@example.com",
           ...
         },
         ...
       ]
     }
     ```

**✅ If both endpoints work, you're done! 🎉**

---

## 🔍 Troubleshooting

### Problem: Still Getting 404 on /api/health

**Solution:**
1. ✅ Verify Root Directory is set to `.` (single dot) in Vercel Settings → General
2. ✅ Verify `api/health.js` exists in your repo
3. ✅ Verify `vercel.json` exists in repo root
4. ✅ Redeploy after changing Root Directory
5. ✅ Check Vercel deployment logs for errors

### Problem: Users endpoint returns error about missing environment variables

**Solution:**
1. ✅ Go to Vercel → Settings → Environment Variables
2. ✅ Verify both `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
3. ✅ Make sure they're enabled for "Production"
4. ✅ Redeploy after adding variables

### Problem: Users endpoint returns "Table doesn't exist"

**Solution:**
1. ✅ Go to Supabase → SQL Editor
2. ✅ Run `supabase-schema.sql` again
3. ✅ Verify tables exist in Supabase → Table Editor
4. ✅ Wait 30 seconds, then test API again

### Problem: CORS errors in browser

**Solution:**
- The API endpoints already include CORS headers
- Make sure you're using HTTPS (not HTTP)
- Make sure the URL is correct

---

## 📝 Quick Reference

### Your API Endpoints:
- **Health Check**: `https://your-project.vercel.app/api/health`
- **Get Users**: `https://your-project.vercel.app/api/users`

### Important Settings:
- **Root Directory**: Must be `.` (repo root)
- **Environment Variables**: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### File Structure:
```
WheelEat/
├── api/
│   ├── health.js          ← Health endpoint
│   ├── users.js           ← Users endpoint
│   ├── lib/
│   │   └── supabase.js    ← Supabase connection
│   └── package.json       ← Dependencies
├── vercel.json            ← Vercel config
└── supabase-schema.sql    ← Database schema
```

---

## ✅ Final Checklist

Before considering this done, verify:

- [ ] Supabase project created
- [ ] SQL schema executed successfully
- [ ] Tables visible in Supabase (users, spin_logs)
- [ ] Vercel Root Directory set to `.` (single dot)
- [ ] Environment variables added in Vercel:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] Project redeployed after changes
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] `/api/users` returns user data

**If all checkboxes are checked, your backend is working! 🎉**

---

## 🎯 What's Next?

Once your backend is working:

1. **Add More Endpoints:**
   - Copy `api/users.js` as a template
   - Create new files in `api/` folder
   - They automatically become available at `/api/your-endpoint`

2. **Connect Frontend:**
   - Update `frontend/src/App.js`:
     ```javascript
     const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-project.vercel.app';
     ```

3. **Add More Tables:**
   - Use Supabase SQL Editor
   - Follow the pattern in `supabase-schema.sql`

---

**You've got this! The Root Directory fix is the key. Once it's set to `.`, everything should work! 🚀**

