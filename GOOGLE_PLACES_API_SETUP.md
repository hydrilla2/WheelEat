# Google Places API Setup for Leaderboard

## Problem
The leaderboard shows "Highest rating" and "Most reviews" options, but they don't work because the API can't fetch ratings/reviews from Google Places.

## Solution: Set Up Google Places API Key

### Step 1: Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one)
4. Go to **"APIs & Services"** → **"Library"**
5. Search for **"Places API"**
6. Click on **"Places API"** and click **"Enable"**
7. Go to **"APIs & Services"** → **"Credentials"**
8. Click **"+ CREATE CREDENTIALS"** → **"API key"**
9. **Copy the API key** (it looks like: `AIzaSy...`)

### Step 2: Add API Key to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project (`wheeleat`)
3. Click on **Settings** tab
4. Scroll down to **Environment Variables** section
5. Click **"Add variable"**
6. Fill in:
   - **Variable name**: `GOOGLE_PLACES_API_KEY`
   - **Value**: Your Google Places API key (e.g., `AIzaSy...`)
   - **Environment**: Select **Production** (or **All environments**)
7. Click **"Save"**

### Step 3: Restrict API Key (Recommended for Security)

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Click on your API key
4. Under **"API restrictions"**, select **"Restrict key"**
5. Check **"Places API"** (and uncheck others)
6. Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
7. Add your website:
   - `https://wheeleat-xp5.pages.dev/*`
   - `https://*.wheeleat-xp5.pages.dev/*` (for preview deployments)
8. Click **"Save"**

### Step 4: Redeploy

1. Go to Cloudflare Pages → **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Retry deployment"** or **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Test

1. Visit your site: `https://wheeleat-xp5.pages.dev`
2. Click **"Leaderboard"** tab
3. You should now see:
   - ⭐ Star ratings for restaurants
   - 📊 Review counts
   - Sorting by "Highest rating" should work
   - Sorting by "Most reviews" should work

## How It Works

- The leaderboard endpoint (`/api/leaderboard`) searches Google Places for each restaurant
- It matches restaurant names from your static list with Google Places results
- It extracts `rating` (0-5 stars) and `user_ratings_total` (review count)
- Results are cached for 5 minutes to reduce API calls

## Troubleshooting

### Still showing "—" for ratings/reviews?

1. **Check API key is set**: Go to Cloudflare Pages → Settings → Environment Variables
   - Make sure `GOOGLE_PLACES_API_KEY` exists
   - Make sure it's set for **Production** environment

2. **Check API is enabled**: Go to Google Cloud Console → APIs & Services → Library
   - Make sure **"Places API"** is enabled

3. **Check API key restrictions**: If you restricted the key, make sure your domain is added

4. **Check browser console**: Open F12 → Console tab
   - Look for any errors from `/api/leaderboard`
   - Check Network tab to see the API response

5. **Wait for cache to expire**: The leaderboard caches results for 5 minutes
   - Wait 5 minutes and refresh, or
   - Check the API response in Network tab to see if ratings are there

### API Key Billing

- Google Places API has a free tier: **$200 credit per month**
- Text Search API (used by leaderboard) costs **$32 per 1,000 requests**
- With free tier, you get ~6,250 requests/month free
- After that, you'll be charged (but you can set billing alerts)

### Alternative: Use `GOOGLE_API_KEY`

If you already have a general Google API key, you can use that instead:
- Set `GOOGLE_API_KEY` in Cloudflare Pages (instead of `GOOGLE_PLACES_API_KEY`)
- The code will check both: `GOOGLE_PLACES_API_KEY` first, then `GOOGLE_API_KEY`

## Notes

- The API key is used server-side only (in Cloudflare Pages Functions)
- It's never exposed to the frontend
- Each restaurant search is done individually for better accuracy
- Results are cached to reduce API calls and improve performance

