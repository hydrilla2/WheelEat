# ⚡ Quick Start - Vercel + Supabase

**Follow these 5 steps to get your backend working:**

## 🟡 Step 1: Supabase Setup (5 minutes)
1. Go to https://supabase.com → Sign up → Create project
2. Go to Project Settings → API
3. Copy: **Project URL** and **anon public key** (save these!)

## 🟡 Step 2: Create Tables (2 minutes)
1. In Supabase, click **SQL Editor** → **New Query**
2. Open `supabase-schema.sql` in this project
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor → Click **Run**
5. ✅ Verify: Go to **Table Editor** → You should see `users` and `spin_logs` tables

## 🟡 Step 3: Install Vercel CLI (1 minute)
```bash
npm install -g vercel
vercel login
```

## 🟡 Step 4: Deploy & Set Environment Variables (3 minutes)
```bash
# In project root folder
vercel
```

Then:
1. Go to https://vercel.com/dashboard → Your project → Settings → Environment Variables
2. Add `SUPABASE_URL` = (your Supabase Project URL)
3. Add `SUPABASE_ANON_KEY` = (your Supabase anon key)
4. Make sure both are enabled for "Production"
5. Redeploy: `vercel --prod`

## 🟡 Step 5: Test (1 minute)
Open in browser:
- `https://your-project.vercel.app/api/health` → Should show `{"status":"ok"}`
- `https://your-project.vercel.app/api/users` → Should show users data

**✅ Done! Your backend is working!**

---

**Full detailed guide:** See `VERCEL_SUPABASE_SETUP.md`

