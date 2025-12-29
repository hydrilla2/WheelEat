# Leaderboard Improvements Applied

## Current Status
From your API response, I can see:
- ✅ **12 restaurants** have ratings/reviews (18% success rate)
- ❌ **54 restaurants** are missing ratings/reviews (82% need improvement)

## Improvements Made

### 1. ✅ Added Place IDs for Found Restaurants
I've extracted and added place_ids for the 13 restaurants that were successfully found:

- "103 Coffee": `ChIJdZs9fDlNzDER0EXdJGGRal4`
- "Armoury Steakhouse": `ChIJ3wTgNHJNzDERwWpkLeDeN3c`
- "Black Canyon": `ChIJf4bRbABNzDERxMhpsI4qvew`
- "Ba Shu Jia Yan": `ChIJq4xeKwBNzDER9eKAvMamQ_g`
- "Bread History": `ChIJ94J5PABNzDERLqGo-Zdx6To`
- "Christine's Bakery Cafe": `ChIJaTIghXdNzDERz6xaHJSuKek`
- "CU Mart": `ChIJV3KBDQBNzDERVyhH5R36vpM`
- "Come Buy Yakiniku": `ChIJKQYCQgBNzDERH3tNosohIRk`
- "Empire Sushi": `ChIJux0_c4JNzDERUg1ovK5kWkI`
- "Far Coffee": `ChIJO86z4DtNzDERmOLc_7N_qhA`
- "Fong Woh Tong": `ChIJH6x3MgBNzDEREpmxvy6KxOI`
- "Gong Luck Cafe": `ChIJtX4RGABNzDERwJ97uOVrpOQ`
- "Gokoku Japanese Bakery": `ChIJ_fot07FNzDERqBm3DDQZgZs`
- "Gong Cha": `ChIJ62YitxZNzDER7zvuU77w4es`

**Result:** These restaurants will now use Place Details API (100% accurate) instead of text search.

### 2. ✅ Improved Text Search Matching
- **Lowered matching threshold** from 0.4 to 0.25 to catch more restaurants with slightly different names
- **Added multiple query variations** to improve search success:
  1. `"Restaurant Name" Sunway Square Mall` (original)
  2. `"Restaurant Name" Sunway Square` (shorter)
  3. `"Restaurant Name"` (just the name)
- **Removed duplicate results** based on place_id

**Result:** More restaurants should be found via text search.

### 3. ✅ Better Error Handling
- Multiple query attempts with fallbacks
- Deduplication of search results
- Better logging for debugging

## Next Steps to Improve Further

### Option 1: Add More Place IDs (Best Solution)
For the remaining 54 restaurants, you can:

1. **Extract place_ids from Google Maps URLs** (if you have them)
2. **Or search manually** on Google Maps and extract place_ids
3. **Update `functions/api/lib/restaurant-places.js`** with the place_ids

See `EXTRACT_PLACE_IDS.md` for detailed instructions.

### Option 2: Improve Search Queries
Some restaurants might need custom search queries. For example:
- "Coffee Bean" might need: `"Coffee Bean & Tea Leaf Sunway Square"`
- "Subway" might need: `"Subway Sunway Square Mall"`

### Option 3: Check if Restaurants Exist on Google Maps
Some restaurants might not have Google Maps listings:
- New restaurants
- Very small/local restaurants
- Restaurants that closed

These will always show `null` for ratings/reviews.

## Expected Results After Deployment

After deploying these changes:
- ✅ **13 restaurants** will use Place Details API (guaranteed accurate)
- ✅ **More restaurants** should be found via improved text search
- ⚠️ **Some restaurants** may still not be found (need place_ids or don't exist on Google Maps)

## Testing

1. **Deploy the changes:**
   ```bash
   git add .
   git commit -m "Improve leaderboard: Add place_ids and improve text search"
   git push
   ```

2. **Test the leaderboard:**
   - Visit: `https://wheeleat-xp5.pages.dev/api/leaderboard?mall_id=sunway_square`
   - Check the `_debug` section for updated counts
   - Verify restaurants with place_ids show ratings

3. **Compare results:**
   - Before: 12 restaurants with ratings
   - After: Should be more (exact number depends on text search improvements)

## Files Modified

- ✅ `functions/api/lib/restaurant-places.js` - Added 13 place_ids
- ✅ `functions/api/leaderboard.js` - Improved text search matching

## Notes

- The matching threshold (0.25) is now more lenient, which may occasionally match the wrong restaurant
- If you notice incorrect matches, you can add place_ids to force exact matches
- Place IDs are the most reliable way to ensure accurate ratings/reviews

