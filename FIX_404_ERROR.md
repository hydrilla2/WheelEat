# 🔧 Fix 404 NOT_FOUND Error on Vercel

## Common Causes and Solutions

### ✅ Solution 1: Check Root Directory Setting (Most Common)

**This is the #1 cause of 404 errors!**

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click **"Settings"** tab
4. Click **"General"** in the left menu
5. Scroll down to **"Root Directory"**
6. **Make sure it's set to:** `.` (single dot) or leave it **EMPTY**
7. Click **"Save"**
8. **Redeploy** your project

---

### ✅ Solution 2: Verify File Structure

Your files should be exactly like this:

```
WheelEat/                    ← Root Directory = "." or empty
├── api/                     ← Serverless functions folder
│   ├── health.js            ← Must exist
│   ├── users.js
│   ├── lib/
│   │   └── supabase.js
│   └── package.json
├── package.json             ← Root package.json with Node.js 24.x
└── (no vercel.json needed)
```

---

### ✅ Solution 3: Verify Export Format

Your `api/health.js` should export the handler like this:

```javascript
export default async function handler(req, res) {
  // ... your code
}
```

**This is already correct in your files!** ✅

---

### ✅ Solution 4: Check Deployment Logs

1. Go to Vercel dashboard → Your project → **"Deployments"**
2. Click on the latest deployment
3. Check for any errors in the build logs
4. Look for messages about file detection or function loading

---

### ✅ Solution 5: Force Redeploy

1. Go to Vercel dashboard → Your project → **"Deployments"**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete
5. Test the endpoint again

---

### ✅ Solution 6: Clear Build Cache

1. Go to Vercel dashboard → Your project → **"Settings"**
2. Click **"Build & Development Settings"**
3. Click **"Clear Build Cache"**
4. Redeploy your project

---

## 🎯 Step-by-Step Fix Checklist

Follow these steps in order:

1. ✅ **Check Root Directory** = `.` or empty in Vercel Settings → General
2. ✅ **Save** the Root Directory setting
3. ✅ **Verify** `api/health.js` exists and has `export default`
4. ✅ **Clear Build Cache** (Settings → Build & Development Settings)
5. ✅ **Redeploy** (Deployments → ... → Redeploy)
6. ✅ **Test** the endpoint: `https://your-project.vercel.app/api/health`

---

## 📝 Verify Your Setup

### File: `api/health.js`
```javascript
export default async function handler(req, res) {
  // ... code
}
```

### File: `package.json` (root)
```json
{
  "engines": {
    "node": "24.x"
  }
}
```

### File: `api/package.json`
```json
{
  "type": "module",
  "engines": {
    "node": "24.x"
  }
}
```

---

## 🔍 Testing Your Endpoint

After fixing, test these URLs:

1. **Health endpoint:**
   ```
   https://your-project.vercel.app/api/health
   ```
   Should return: `{"status":"ok","message":"WheelEat API is running",...}`

2. **Users endpoint:**
   ```
   https://your-project.vercel.app/api/users
   ```
   Should return user data (if Supabase is configured)

---

## ⚠️ Important Notes

- **Root Directory** MUST be `.` (single dot) or EMPTY - this is critical!
- **No vercel.json needed** - Vercel auto-detects serverless functions in `api/` folder
- **Node.js 24.x** is required (already set in package.json)
- **ES Modules** are used (`export default`)

---

**If Root Directory is correct and you still get 404, check the deployment logs for specific errors!**

