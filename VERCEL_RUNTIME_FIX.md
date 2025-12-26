# 🔧 Vercel Runtime Fix - Complete Guide

## ✅ What Cursor Did Automatically

- ✅ Updated `vercel.json` - Removed `"version": 2` (can cause conflicts)
- ✅ Created root `package.json` - Specifies Node.js 18.x engine
- ✅ Verified `api/health.js` - Uses ES Modules (`export default`)
- ✅ Verified `api/package.json` - Has `"type": "module"` and Node.js 18.x

**All files are ready! You don't need to edit anything.**

---

## 🟡 What You Must Do Manually

### Step 1: Commit and Push to GitHub (2 minutes)

**Option A: Using Command Line (Recommended)**

1. Open PowerShell or Command Prompt
2. Navigate to your project folder:
   ```bash
   cd C:\Users\User\Documents\SpinWheel\WheelEat
   ```

3. Check what files changed:
   ```bash
   git status
   ```
   You should see `vercel.json` and `package.json` as modified/new files.

4. Add the files:
   ```bash
   git add vercel.json package.json
   ```

5. Commit:
   ```bash
   git commit -m "Fix Vercel runtime configuration - remove version field and add root package.json"
   ```

6. Push to host branch:
   ```bash
   git push ybtan host
   ```

**Option B: Using GitHub Desktop or VS Code**
- Stage `vercel.json` and `package.json`
- Commit with message: "Fix Vercel runtime configuration"
- Push to `host` branch

---

### Step 2: Redeploy on Vercel (2 minutes)

**If Vercel is connected to GitHub (Auto-deploy):**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **"Deployments"** tab
4. Wait 1-2 minutes - Vercel should automatically detect the push and start deploying
5. You'll see a new deployment appear with "Building..." status
6. Wait for it to complete (usually 1-2 minutes)

**If Vercel is NOT connected to GitHub (Manual deploy):**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **"Deployments"** tab
4. Click the **"..."** menu (three dots) on the latest deployment
5. Click **"Redeploy"**
6. Wait 1-2 minutes for deployment to complete

---

### Step 3: Verify the Fix (1 minute)

1. **Get your Vercel project URL:**
   - In Vercel dashboard → Your project → **"Deployments"** tab
   - Click on the latest deployment
   - Copy the URL (looks like: `https://wheeleat-xxxxx.vercel.app`)

2. **Test the health endpoint:**
   - Open in browser: `https://your-project.vercel.app/api/health`
   - ✅ You should see:
     ```json
     {
       "status": "ok",
       "message": "WheelEat API is running",
       "timestamp": "2024-..."
     }
     ```

3. **If you see the JSON response above, the fix worked! 🎉**

---

## 🔍 Troubleshooting

### Problem: Still getting runtime error after redeploy

**Solution:**
1. Check Vercel deployment logs:
   - Go to Vercel dashboard → Your project → **"Deployments"**
   - Click on the failed deployment
   - Click **"View Function Logs"** or **"View Build Logs"**
   - Look for specific error messages

2. Verify files are correct:
   - `vercel.json` should have `"functions"` with `"runtime": "nodejs18.x"`
   - Root `package.json` should have `"engines": { "node": "18.x" }`
   - `api/health.js` should use `export default`

3. Try clearing Vercel cache:
   - In Vercel dashboard → Settings → **"Build & Development Settings"**
   - Click **"Clear Build Cache"**
   - Redeploy

### Problem: 404 error on /api/health

**Solution:**
1. Verify Root Directory is set to `.` (repo root):
   - Vercel dashboard → Settings → General
   - Check "Root Directory" = `.` (single dot)

2. Verify `api/health.js` exists in your repo

3. Check deployment logs for build errors

### Problem: CORS errors

**Solution:**
- The API already includes CORS headers
- Make sure you're using HTTPS (not HTTP)
- Make sure the URL is correct

---

## 📝 Files Changed

### `vercel.json` (Updated)
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### `package.json` (New - Root Level)
```json
{
  "name": "wheeleat",
  "version": "1.0.0",
  "description": "WheelEat - Spin Wheel Restaurant Picker",
  "engines": {
    "node": "18.x"
  }
}
```

### `api/health.js` (Verified - Already Correct)
- Uses `export default async function handler(req, res)`
- Includes CORS headers
- Handles GET and OPTIONS requests
- Returns JSON response

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Files committed to GitHub
- [ ] Changes pushed to `host` branch
- [ ] Vercel deployment completed (no errors)
- [ ] `/api/health` returns JSON: `{"status":"ok",...}`
- [ ] No runtime errors in Vercel logs

**If all checked, your backend is working! 🎉**

---

## 🎯 Quick Reference

**Your API Endpoint:**
- Health: `https://your-project.vercel.app/api/health`

**Important Files:**
- `vercel.json` - Vercel configuration
- `package.json` - Root package.json (Node.js version)
- `api/health.js` - Health endpoint (ES modules)
- `api/package.json` - API package.json (ES modules config)

**Git Commands:**
```bash
git add vercel.json package.json
git commit -m "Fix Vercel runtime configuration"
git push ybtan host
```

---

**Follow these steps in order, and your backend will work! 🚀**

