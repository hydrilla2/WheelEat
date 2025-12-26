# 🔗 Connect Frontend to Vercel Backend

## ✅ Your Backend is Working!

Your backend API URL:
```
https://wheeleat-ml5qmrsel-ybtan6666s-projects.vercel.app
```

Test endpoint: `https://wheeleat-ml5qmrsel-ybtan6666s-projects.vercel.app/api/health` ✅

---

## 🎯 Two Options for Connecting Frontend

### Option 1: Use Environment Variable (Recommended - Flexible)

Best for: Different deployments, easy to change URLs

### Option 2: Use Relative Paths (Simple - Same Domain)

Best for: Frontend and backend on same Vercel project/domain

---

## ✅ Option 1: Environment Variable (Recommended)

### Step 1: Update Frontend Code

Update `frontend/src/App.js` to use your Vercel backend URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://wheeleat-ml5qmrsel-ybtan6666s-projects.vercel.app';
```

### Step 2: Create .env File for Local Development

Create `frontend/.env` file (for local testing):

```
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: Set Environment Variable in Vercel (for Production)

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://wheeleat-ml5qmrsel-ybtan6666s-projects.vercel.app`
   - **Environment**: Select all (Production, Preview, Development)
4. Click "Add"
5. Redeploy frontend

**Benefits:**
- ✅ Works for local development (uses localhost)
- ✅ Works for production (uses Vercel URL)
- ✅ Easy to change URLs without code changes

---

## ✅ Option 2: Relative Paths (Simpler - Same Domain)

If frontend and backend are on the **same Vercel domain**, use relative paths:

```javascript
const API_BASE_URL = '';
```

Then frontend will make requests to `/api/health` on the same domain.

**Note:** This only works if frontend is served from the same Vercel project.

---

## 🚀 Recommended Approach: Option 1 (Environment Variable)

Let's implement Option 1 - it's more flexible and works for all scenarios.

---

## 📝 Step-by-Step Implementation

### 1. Update frontend/src/App.js

Change line 9 from:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

To:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://wheeleat-ml5qmrsel-ybtan6666s-projects.vercel.app';
```

### 2. Create frontend/.env file (for local dev)

Create a file: `frontend/.env`

```
REACT_APP_API_URL=http://localhost:8000
```

This allows local development to still use localhost.

### 3. Deploy Frontend to Vercel

**If deploying frontend separately:**

1. Create a new Vercel project OR use the same project
2. Set Root Directory to `frontend` (if separate project)
3. Set environment variable `REACT_APP_API_URL` in Vercel
4. Deploy

**If deploying frontend on same Vercel project:**

1. Configure Vercel to build frontend
2. Set Output Directory to `frontend/build`
3. Set Build Command to `cd frontend && npm install && npm run build`
4. Set environment variable `REACT_APP_API_URL`
5. Deploy

---

## 🧪 Testing

### Local Testing:
1. Start local backend: `cd backend && uvicorn main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm start`
3. Frontend will use `http://localhost:8000` (from .env file)

### Production Testing:
1. Deploy frontend to Vercel
2. Set `REACT_APP_API_URL` environment variable
3. Visit your frontend URL
4. Frontend will use your Vercel backend URL

---

## 🔍 Important Notes

1. **Environment Variables in React:**
   - Must start with `REACT_APP_` to be accessible in React
   - Available via `process.env.REACT_APP_API_URL`
   - Build-time variables (set during build, not runtime)

2. **CORS:**
   - Your backend already has CORS headers configured ✅
   - Should work without issues

3. **URL Format:**
   - Don't include trailing slash: `https://your-url.com` ✅
   - Not: `https://your-url.com/` ❌
   - Frontend will add `/api/health` automatically

---

## ✅ Checklist

- [ ] Updated `frontend/src/App.js` with Vercel URL
- [ ] Created `frontend/.env` for local development
- [ ] Set `REACT_APP_API_URL` in Vercel environment variables
- [ ] Deployed frontend to Vercel
- [ ] Tested that frontend can call backend API

---

**After following these steps, your frontend will be connected to your Vercel backend! 🎉**

