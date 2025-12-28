# Leaderboard Troubleshooting Guide

## Problem: Ratings and Reviews Not Showing

If you've added `GOOGLE_PLACES_API_KEY` but the leaderboard still shows "—" for ratings/reviews, follow these steps:

## Step 1: Verify You Redeployed

**Important:** After adding environment variables, you MUST redeploy!

1. Go to Cloudflare Pages → **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Retry deployment"** or **"Redeploy"**
4. Wait for deployment to complete

## Step 2: Check the API Response

Test the leaderboard endpoint directly:

1. Open your browser
2. Go to: `https://wheeleat-xp5.pages.dev/api/leaderboard?mall_id=sunway_square`
3. Check the JSON response:
   - Look for `"source": "google_places_textsearch_per_restaurant"` (means API key is working)
   - Look for `"source": "static_only"` (means API key is missing or not working)
   - Check if restaurants have `"rating"` and `"reviews"` values (not `null`)

## Step 3: Check Cloudflare Logs

1. Go to Cloudflare Pages → **Analytics & logs** tab
2. Look for errors related to `/api/leaderboard`
3. Common errors:
   - `"GOOGLE_PLACES_API_KEY not found"` → Variable not set correctly
   - `"Google Places API error: REQUEST_DENIED"` → API key is invalid or restricted
   - `"Google Places API error: OVER_QUERY_LIMIT"` → API quota exceeded

## Step 4: Verify Google Places API is Enabled

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for **"Places API"**
5. Make sure it shows **"Enabled"** (not "Enable")

## Step 5: Check API Key Restrictions

If your API key has restrictions, make sure:

1. **API Restrictions:**
   - Should include **"Places API"** (or be unrestricted for testing)

2. **Application Restrictions:**
   - If set to "HTTP referrers", add:
     - `https://wheeleat-xp5.pages.dev/*`
     - `https://*.wheeleat-xp5.pages.dev/*`
   - Or temporarily set to "None" for testing

## Step 6: Test API Key Directly

Test your API key with a simple request:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+Sunway+Square&key=YOUR_API_KEY"
```

Expected response:
- `"status": "OK"` → API key works
- `"status": "REQUEST_DENIED"` → API key invalid or restricted
- `"status": "OVER_QUERY_LIMIT"` → Quota exceeded

## Step 7: Clear Cache

The leaderboard caches results for 5 minutes. If you just added the API key:

1. Wait 5 minutes, OR
2. Add a cache-busting parameter: `?mall_id=sunway_square&_t=1234567890`

## Common Issues

### Issue: "source": "static_only" in API response

**Cause:** API key not found or not accessible

**Solution:**
- Verify variable name is exactly `GOOGLE_PLACES_API_KEY`
- Make sure it's set for **Production** environment
- Redeploy after adding the variable

### Issue: All ratings are `null` but `"source"` is `"google_places_textsearch_per_restaurant"`

**Cause:** Google Places API is working, but restaurants aren't being matched

**Solution:**
- This is normal - not all restaurants will have Google Places data
- Check if at least some restaurants have ratings (not all will)
- Restaurant names must match Google Places results

### Issue: "REQUEST_DENIED" error

**Cause:** API key is invalid, restricted, or Places API not enabled

**Solution:**
- Verify Places API is enabled in Google Cloud Console
- Check API key restrictions
- Make sure the API key is correct (no extra spaces)

### Issue: "OVER_QUERY_LIMIT" error

**Cause:** You've exceeded the free tier quota

**Solution:**
- Wait 24 hours for quota to reset
- Or upgrade your Google Cloud billing plan
- Free tier: $200/month credit (~6,250 requests)

## Still Not Working?

1. **Check browser console (F12):**
   - Look for errors when loading leaderboard
   - Check Network tab for `/api/leaderboard` request

2. **Check Cloudflare Pages logs:**
   - Go to Analytics & logs
   - Look for error messages

3. **Test with a simple query:**
   - Visit: `https://wheeleat-xp5.pages.dev/api/leaderboard?mall_id=sunway_square`
   - Check the JSON response structure

4. **Verify environment variable:**
   - Go to Cloudflare Pages → Settings → Variables and Secrets
   - Make sure `GOOGLE_PLACES_API_KEY` exists
   - Check that it's set for the correct environment

