# 🔍 Debug 404 NOT_FOUND Error - Step by Step

## ✅ Step 1: Verify the Correct URL Format

Your endpoint should be accessible at:

**Correct URL:**
```
https://your-project.vercel.app/api/health
```

**NOT these:**
- ❌ `https://your-project.vercel.app/health`
- ❌ `https://your-project.vercel.app/api/health.js`
- ❌ `https://your-project.vercel.app/health.js`

**The URL format is:** `https://[your-domain]/api/[filename-without-extension]`

---

## ✅ Step 2: Check Root Directory in Vercel (CRITICAL!)

1. Go to https://vercel.com/dashboard
2. Click on **your project**
3. Click **"Settings"** tab
4. Click **"General"** (left sidebar)
5. Scroll down to **"Root Directory"**
6. **It MUST be one of these:**
   - `.` (single dot) ✅
   - **EMPTY** (no value) ✅
   - `./` (dot slash) ✅

7. **If it's anything else** (like `frontend`, `backend`, etc.), change it to `.` or empty
8. Click **"Save"**
9. **Redeploy** after changing this!

---

## ✅ Step 3: Verify Your File Structure

Your repo should look exactly like this:

```
WheelEat/                    ← This is your root (Root Directory = ".")
├── api/                     ← Serverless functions folder
│   ├── health.js            ← Creates endpoint: /api/health
│   ├── users.js             ← Creates endpoint: /api/users
│   ├── lib/
│   │   └── supabase.js
│   └── package.json
├── package.json             ← Root package.json (Node.js 24.x)
└── (other files...)
```

**Check these:**
- ✅ `api/health.js` exists
- ✅ `api/package.json` exists with `"type": "module"`
- ✅ Root `package.json` exists with `"engines": { "node": "24.x" }`

---

## ✅ Step 4: Check Deployment Logs

1. Go to Vercel dashboard → Your project → **"Deployments"**
2. Click on the **latest deployment**
3. Look for:
   - ✅ Build logs showing functions being detected
   - ❌ Any errors about file not found
   - ❌ Any errors about runtime configuration

**What to look for in logs:**
- Should see: `Detected serverless functions in api/`
- Should see: `Building api/health.js`
- Should NOT see: `404` or `NOT_FOUND` in build logs

---

## ✅ Step 5: Verify Function Export Format

Your `api/health.js` should be exactly:

```javascript
export default async function handler(req, res) {
  // ... your code
}
```

**Make sure:**
- ✅ Uses `export default` (not `module.exports`)
- ✅ Function name is `handler` (or any name, but `handler` is standard)
- ✅ Parameters are `(req, res)` (Node.js request/response)

---

## ✅ Step 6: Check What URL You're Actually Using

**Please verify:**
1. What is your Vercel project URL? (e.g., `wheeleat-xxxxx.vercel.app`)
2. What exact URL are you trying to access?
3. Are you using `https://` (not `http://`)?

**Example:**
- If your project URL is: `wheeleat-abc123.vercel.app`
- The correct endpoint URL is: `https://wheeleat-abc123.vercel.app/api/health`

---

## ✅ Step 7: Test with a Browser

1. Open a web browser (Chrome, Firefox, Edge)
2. Go to: `https://your-project.vercel.app/api/health`
3. You should see JSON like:
   ```json
   {
     "status": "ok",
     "message": "WheelEat API is running",
     "timestamp": "2024-..."
   }
   ```

**If you see a 404 page:**
- Check Root Directory setting
- Check deployment logs
- Verify the file exists

---

## ✅ Step 8: Check Vercel Project Settings

1. Go to Vercel dashboard → Your project → **"Settings"**
2. Click **"General"**
3. Verify:
   - ✅ **Root Directory**: `.` or empty
   - ✅ **Framework Preset**: Can be "Other" or "Vite" (doesn't matter for API)
   - ✅ **Build Command**: Empty (Vercel auto-detects)
   - ✅ **Output Directory**: Empty (Vercel auto-detects)

---

## 🔍 Common Issues and Solutions

### Issue 1: Root Directory is Wrong
**Symptom:** 404 on all endpoints  
**Fix:** Set Root Directory to `.` or empty in Vercel Settings → General

### Issue 2: Wrong URL Format
**Symptom:** 404 on endpoint  
**Fix:** Use `/api/health` (not `/health` or `/api/health.js`)

### Issue 3: Files Not Detected
**Symptom:** No functions in deployment logs  
**Fix:** Make sure `api/` folder is at repo root, check Root Directory

### Issue 4: Export Format Wrong
**Symptom:** Function error (not 404)  
**Fix:** Use `export default async function handler(req, res)`

---

## 📝 Quick Checklist

Before reporting an issue, verify:

- [ ] Root Directory = `.` or empty in Vercel Settings
- [ ] `api/health.js` file exists in your repo
- [ ] Using correct URL: `https://your-project.vercel.app/api/health`
- [ ] Deployment completed successfully (no errors in logs)
- [ ] `api/health.js` uses `export default`
- [ ] Root `package.json` has `"engines": { "node": "24.x" }`
- [ ] `api/package.json` has `"type": "module"`

---

**If all of the above are correct and you still get 404, please share:**
1. Your Vercel project URL
2. The exact URL you're trying to access
3. Screenshot of Root Directory setting
4. Any errors from deployment logs

