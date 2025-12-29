# Alternatives to Ensure All Restaurants Get Ratings

## Current Status

- **43 out of 66 restaurants (65%) have ratings**
- **Issue**: Cloudflare Pages Functions has a limit of ~50 subrequests per request
- **With 66 restaurants**: We need ~66-100+ subrequests, which exceeds the limit

## Solution Implemented: Prioritize Restaurants with Place IDs

I've restructured the code to:
1. ✅ **Process restaurants with place_ids first** (1 API call each - most efficient)
2. ✅ **Process restaurants without place_ids last** (text search uses more API calls)
3. ✅ **Skip text search when limit is hit** (saves API calls)

**Expected improvement**: Should process ~50 restaurants with place_ids before hitting limit (vs ~43 currently)

## Alternative Solutions

### Option 1: Reduce Concurrency to 1 ⭐ (Recommended)

**What it does:**
- Process one restaurant at a time (no concurrent API calls)
- Most reliable way to maximize restaurants processed before hitting limit

**Pros:**
- ✅ Most reliable
- ✅ Should process ~50 restaurants before hitting limit
- ✅ Simple to implement

**Cons:**
- ❌ Slower (sequential processing)
- ❌ Still might not get all 66 restaurants

**Implementation:**
```javascript
// Change concurrency from 2 to 1
const enrichedWithPlaceIds = await mapWithConcurrency(restaurantsWithPlaceIds, 1, async (r) => {
```

### Option 2: Client-Side Batching ⭐⭐ (Best for 100% coverage)

**What it does:**
- Frontend makes multiple API calls in batches
- Each API call processes a subset of restaurants
- Frontend combines the results

**Pros:**
- ✅ Can process ALL restaurants (no limit per request)
- ✅ Better user experience (can show partial results while loading)
- ✅ Most flexible solution

**Cons:**
- ❌ Requires frontend changes
- ❌ More complex implementation
- ❌ Multiple API calls = more latency

**Implementation:**
1. **Backend**: Add batch parameter to leaderboard endpoint
   ```javascript
   // GET /api/leaderboard?mall_id=sunway_square&batch=1&batch_size=25
   ```

2. **Frontend**: Make multiple API calls
   ```javascript
   // Fetch in batches
   const batch1 = await fetch('/api/leaderboard?mall_id=sunway_square&batch=1&batch_size=25');
   const batch2 = await fetch('/api/leaderboard?mall_id=sunway_square&batch=2&batch_size=25');
   const batch3 = await fetch('/api/leaderboard?mall_id=sunway_square&batch=3&batch_size=25');
   // Combine results
   ```

### Option 3: Skip Text Search Entirely

**What it does:**
- Only use Place Details API for restaurants with place_ids
- Skip text search fallback entirely
- Restaurants without place_ids won't get ratings (until place_ids are added)

**Pros:**
- ✅ Uses fewer API calls (1 per restaurant with place_id)
- ✅ Should process ~50 restaurants before hitting limit
- ✅ Simple to implement

**Cons:**
- ❌ Restaurants without place_ids won't get ratings
- ❌ Need to manually add place_ids for all restaurants

**Implementation:**
- Already partially implemented (text search is skipped when limit is hit)
- Could make it permanent (always skip text search)

### Option 4: Increase Cache Duration

**What it does:**
- Cache Place Details API responses longer (e.g., 24 hours instead of 5 minutes)
- Reduces number of API calls needed

**Pros:**
- ✅ Reduces API calls
- ✅ Faster responses (cached)
- ✅ Simple to implement

**Cons:**
- ❌ Ratings might be stale (24 hours old)
- ❌ Still might hit limit on first request

**Implementation:**
```javascript
const CACHE_TTL_SECONDS = 86400; // 24 hours instead of 300 (5 minutes)
```

### Option 5: Pre-fetch and Store Ratings in Database

**What it does:**
- Background job periodically fetches ratings for all restaurants
- Store ratings in D1 database
- Leaderboard endpoint reads from database (no API calls)

**Pros:**
- ✅ No subrequest limit issues
- ✅ Fast responses (database lookup)
- ✅ Can update ratings periodically

**Cons:**
- ❌ More complex (requires background jobs)
- ❌ Ratings might be stale
- ❌ Requires Cloudflare Workers (not just Pages Functions)

**Implementation:**
- Use Cloudflare Workers with cron triggers
- Store ratings in D1 database
- Leaderboard reads from D1

### Option 6: Use Cloudflare Workers (Not Pages Functions)

**What it does:**
- Migrate leaderboard logic to Cloudflare Workers
- Workers have higher subrequest limits (1000+)

**Pros:**
- ✅ Much higher subrequest limit
- ✅ Can process all restaurants in one request

**Cons:**
- ❌ Requires migration from Pages Functions to Workers
- ❌ More complex setup
- ❌ Different deployment process

## Recommended Solution

For **immediate improvement**: **Option 1** (concurrency = 1)
- Simple change
- Should get ~50 restaurants before hitting limit
- Better than current 43

For **100% coverage**: **Option 2** (client-side batching)
- Can process all restaurants
- Better user experience
- Requires frontend changes but most flexible

## Quick Fix: Try Concurrency = 1 First

Let's try the simplest solution first:

```javascript
// Change from 2 to 1
const enrichedWithPlaceIds = await mapWithConcurrency(restaurantsWithPlaceIds, 1, async (r) => {
```

This should allow us to process ~50 restaurants with place_ids before hitting the limit.

## Summary

| Option | Coverage | Complexity | Speed | Recommendation |
|--------|----------|------------|-------|----------------|
| Current (concurrency=2) | 65% | Low | Fast | ✅ Working |
| Option 1 (concurrency=1) | ~75% | Low | Slow | ⭐ Try this first |
| Option 2 (client batching) | 100% | Medium | Medium | ⭐⭐ Best for 100% |
| Option 3 (skip text search) | ~75% | Low | Fast | ⚠️ Loses some restaurants |
| Option 4 (longer cache) | 65% | Low | Fast | ⚠️ Stale data |
| Option 5 (database) | 100% | High | Fast | ⚠️ Complex |
| Option 6 (Workers) | 100% | High | Fast | ⚠️ Requires migration |

## Next Steps

1. **Try Option 1 first** (concurrency = 1) - should improve to ~75%
2. **If still not enough**, implement Option 2 (client-side batching) for 100% coverage

Would you like me to implement Option 1 (concurrency = 1) first, or go straight to Option 2 (client-side batching)?

