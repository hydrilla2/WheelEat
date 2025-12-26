# 🚀 Complete Vercel + Supabase Setup Guide

**This guide will get your backend working on Vercel with Supabase in the simplest way possible.**

---

## 📋 Overview

✅ **What happens automatically:**
- Vercel detects your `api/` folder and deploys it
- Environment variables are loaded automatically
- API endpoints are available at `https://your-project.vercel.app/api/*`

🟡 **What you must do manually:**
- Create Supabase account and project
- Run SQL to create tables
- Copy environment variables to Vercel
- Deploy to Vercel

---

## 🟡 STEP 1: Create Supabase Account & Project

### 1.1 Sign up for Supabase
1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub (easiest) or email
4. Verify your email if needed

### 1.2 Create a New Project
1. Click **"New Project"** button
2. Fill in:
   - **Name**: `wheeleat` (or any name you like)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it)
   - **Region**: Choose closest to you (e.g., "Southeast Asia (Singapore)")
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for project to be created

### 1.3 Get Your Supabase Credentials
1. Once project is ready, click on **"Project Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. **COPY BOTH VALUES** - you'll need them in Step 3

---

## 🟡 STEP 2: Create Database Tables

### 2.1 Open SQL Editor
1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### 2.2 Run the SQL Script
1. Open the file `supabase-schema.sql` in this project
2. **Copy the ENTIRE contents** of that file
3. **Paste it** into the SQL Editor in Supabase
4. Click **"Run"** button (or press `Ctrl+Enter`)
5. ✅ You should see: **"Success. No rows returned"** or a success message

### 2.3 Verify Tables Were Created
1. In Supabase, click **"Table Editor"** in the left sidebar
2. You should see two tables:
   - ✅ `users`
   - ✅ `spin_logs`
3. Click on `users` table - you should see 2 example rows

**If you see the tables, you're done with Step 2! ✅**

---

## 🟡 STEP 3: Set Environment Variables in Vercel

### 3.1 Install Vercel CLI (if not already installed)
1. Open PowerShell or Command Prompt
2. Run:
   ```bash
   npm install -g vercel
   ```
3. Wait for installation to complete

### 3.2 Login to Vercel
1. In your terminal, run:
   ```bash
   vercel login
   ```
2. Follow the prompts (choose email or GitHub)
3. Open the link it gives you and authorize

### 3.3 Link Your Project to Vercel
1. Make sure you're in the project root folder:
   ```bash
   cd C:\Users\User\Documents\SpinWheel\WheelEat
   ```
2. Run:
   ```bash
   vercel
   ```
3. Answer the prompts:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Your account
   - **Link to existing project?** → No (first time)
   - **Project name?** → Press Enter (uses folder name)
   - **Directory?** → Press Enter (uses current directory)
   - **Override settings?** → No

### 3.4 Add Environment Variables
1. Go to https://vercel.com/dashboard
2. Click on your project (should be named "WheelEat" or similar)
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in the left menu
5. Add these TWO variables:

   **Variable 1:**
   - **Name**: `SUPABASE_URL`
   - **Value**: Paste your Supabase Project URL (from Step 1.3)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2:**
   - **Name**: `SUPABASE_ANON_KEY`
   - **Value**: Paste your Supabase anon public key (from Step 1.3)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

6. ✅ You should now see both variables listed

---

## 🟡 STEP 4: Deploy to Vercel

### 4.1 Deploy from Command Line
1. In your terminal (still in project root), run:
   ```bash
   vercel --prod
   ```
2. Wait for deployment to complete
3. ✅ You'll see a URL like: `https://wheeleat-xxxxx.vercel.app`

### 4.2 Or Deploy via GitHub (Recommended)
1. Push your code to GitHub (if not already):
   ```bash
   git add .
   git commit -m "Add Vercel backend with Supabase"
   git push
   ```
2. Go to https://vercel.com/dashboard
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. Vercel will auto-detect settings
6. Click **"Deploy"**
7. ✅ Wait for deployment (usually 1-2 minutes)

---

## ✅ STEP 5: Test Your API

### 5.1 Test Health Endpoint
1. Open your browser
2. Go to: `https://your-project.vercel.app/api/health`
   (Replace `your-project` with your actual Vercel project name)
3. ✅ You should see:
   ```json
   {
     "status": "ok",
     "message": "WheelEat API is running",
     "timestamp": "2024-..."
   }
   ```

### 5.2 Test Users Endpoint
1. Go to: `https://your-project.vercel.app/api/users`
2. ✅ You should see:
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

**If both endpoints work, you're done! 🎉**

---

## 🔍 Troubleshooting

### Problem: Health endpoint works, but users endpoint returns error

**Solution:**
1. Check Supabase:
   - Go to Supabase → Table Editor
   - Verify `users` table exists
   - Verify it has data (at least 2 rows from the SQL script)

2. Check environment variables:
   - Go to Vercel → Settings → Environment Variables
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
   - Make sure they're set for "Production" environment

3. Redeploy:
   ```bash
   vercel --prod
   ```

### Problem: "Missing Supabase environment variables" error

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Make sure both variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Make sure they're enabled for "Production"
4. Redeploy: `vercel --prod`

### Problem: CORS errors in browser

**Solution:**
- The API endpoints already include CORS headers
- If you still get CORS errors, check:
  1. You're accessing the correct URL (should be `https://...`)
  2. The endpoint exists (check the URL spelling)

### Problem: "Table doesn't exist" error

**Solution:**
1. Go to Supabase → SQL Editor
2. Run the `supabase-schema.sql` script again
3. Check Table Editor to verify tables exist
4. Wait 30 seconds, then test API again

---

## 📝 Quick Reference

### Your API Endpoints:
- **Health Check**: `https://your-project.vercel.app/api/health`
- **Get Users**: `https://your-project.vercel.app/api/users`

### Where to Find Things:
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Project URL**: Check your Vercel project settings

### Important Files:
- `api/health.js` - Health check endpoint
- `api/users.js` - Users endpoint (example with Supabase)
- `api/lib/supabase.js` - Supabase connection
- `supabase-schema.sql` - Database schema
- `vercel.json` - Vercel configuration

---

## 🎯 Next Steps

Once your API is working:

1. **Update Frontend to Use Vercel API:**
   - In `frontend/src/App.js`, change:
     ```javascript
     const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-project.vercel.app';
     ```
   - Or set `REACT_APP_API_URL` environment variable

2. **Add More Endpoints:**
   - Copy `api/users.js` as a template
   - Create new endpoints in `api/` folder
   - They'll automatically be available at `/api/your-endpoint`

3. **Add More Tables:**
   - Use Supabase SQL Editor
   - Follow the same pattern as `supabase-schema.sql`

---

## ✅ Checklist

Before you consider this done, verify:

- [ ] Supabase project created
- [ ] SQL schema executed successfully
- [ ] Tables visible in Supabase Table Editor
- [ ] Environment variables set in Vercel
- [ ] Project deployed to Vercel
- [ ] `/api/health` endpoint returns success
- [ ] `/api/users` endpoint returns data

**If all checkboxes are checked, you're done! 🎉**

