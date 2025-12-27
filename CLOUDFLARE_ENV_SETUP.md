# Setting Environment Variables in Cloudflare Pages

## Problem
Your console shows:
- `NODE_ENV: production` - This means you're running in production
- `REACT_APP_GOOGLE_CLIENT_ID: undefined` - Environment variable not found

## Solution: Add Environment Variable in Cloudflare Pages

### Step 1: Go to Cloudflare Pages Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project (`wheeleat`)
3. Click on **Settings** tab (top menu)
4. Scroll down to **Environment Variables** section

### Step 2: Add the Environment Variable

1. Click **"Add variable"** or **"Add environment variable"**
2. Fill in:
   - **Variable name**: `REACT_APP_GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID (e.g., `123456789-abc...apps.googleusercontent.com`)
   - **Environment**: Select **Production** (or **All environments**)
3. Click **"Save"**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Retry deployment"** or **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Verify

After redeployment:
1. Visit your site: `https://wheeleat-xp5.pages.dev`
2. Open browser console (F12)
3. You should now see:
   ```
   REACT_APP_GOOGLE_CLIENT_ID: [your-client-id]
   ```
   Instead of `undefined`

## For Local Development

If you want to test locally with the environment variable:

1. Create `frontend/.env` file:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
   ```

2. Make sure you're running in development mode:
   ```bash
   cd frontend
   npm start
   ```
   (Not `npm run build` - that creates a production build)

3. The `.env` file only works in development mode (`npm start`)

## Important Notes

- **Production builds** (like on Cloudflare Pages) don't read `.env` files
- Environment variables must be set in Cloudflare Pages dashboard
- After adding env vars, you MUST redeploy for changes to take effect
- The variable name must be exactly: `REACT_APP_GOOGLE_CLIENT_ID`

## Quick Checklist

- [ ] Go to Cloudflare Pages → Settings → Environment Variables
- [ ] Add `REACT_APP_GOOGLE_CLIENT_ID` with your Google Client ID
- [ ] Save the variable
- [ ] Redeploy the site
- [ ] Check console - should show the Client ID instead of `undefined`

