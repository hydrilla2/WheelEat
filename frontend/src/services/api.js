// Centralized API service (single source of truth for frontend fetch logic)
//
// Goals:
// - Keep API calls in one place so swapping backend is easy later.
// - Provide small in-memory caching to reduce repeated calls.
// - Make it easy to reuse for future features (leaderboard, trending, top picks, etc).

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function buildUrl(path, params) {
  const base = API_BASE_URL || '';
  const url = new URL(`${base}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    // Try to extract a meaningful JSON error if possible.
    if (contentType.includes('application/json')) {
      const errBody = await res.json().catch(() => null);
      const msg = errBody?.detail || errBody?.message || errBody?.error || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return await res.json();
}

// Simple in-memory TTL cache by key
const _cache = new Map();
function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.value;
}
function setCached(key, value, ttlMs) {
  _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function fetchMalls() {
  const url = buildUrl('/api/malls');
  return await fetchJson(url);
}

export async function fetchCategories(mallId) {
  const url = buildUrl('/api/categories', { mall_id: mallId });
  return await fetchJson(url);
}

export async function fetchRestaurants({ categories, mallId, dietaryNeed }) {
  const categoriesParam = Array.isArray(categories) ? categories.join(',') : categories;
  const url = buildUrl('/api/restaurants', {
    categories: categoriesParam,
    mall_id: mallId,
    dietary_need: dietaryNeed,
  });
  return await fetchJson(url);
}

export async function spinWheel({ selectedCategories, mallId, dietaryNeed }) {
  const url = buildUrl('/api/spin');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selected_categories: selectedCategories,
      mall_id: mallId,
      dietary_need: dietaryNeed,
    }),
  });
}

export async function upsertUser({ id, name, email }) {
  const url = buildUrl('/api/users');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, email }),
  });
}

// Leaderboard
const LEADERBOARD_TTL_MS = 2 * 60 * 1000; // 2 minutes (frontend-side)

export async function fetchLeaderboard(mallId) {
  const cacheKey = `leaderboard:${mallId || 'sunway_square'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = buildUrl('/api/leaderboard', { mall_id: mallId });
  const data = await fetchJson(url);

  setCached(cacheKey, data, LEADERBOARD_TTL_MS);
  return data;
}

// Fetch leaderboard in batches to ensure all restaurants are processed
// This works around Cloudflare's subrequest limit (~50 per request)
export async function fetchLeaderboardBatched(mallId = 'sunway_square', batchSize = 25) {
  // Don't use cache for batched requests to ensure fresh data and proper batching
  // The individual batch requests already have nocache=1, but we also skip client-side cache
  // const cacheKey = `leaderboard-batched:${mallId}`;
  // const cached = getCached(cacheKey);
  // if (cached) return cached;

  const batches = [];
  let batch = 1;
  let hasMore = true;
  let totalRestaurants = 0;
  
  console.log(`Fetching leaderboard in batches (batch size: ${batchSize})...`);
  
  while (hasMore) {
    try {
      const url = buildUrl('/api/leaderboard', { 
        mall_id: mallId,
        batch: batch,
        batch_size: batchSize,
        nocache: '1' // Disable cache for batch requests
      });
      
      console.log(`Fetching batch ${batch}...`);
      console.log(`📦 Request URL: ${url}`);
      const data = await fetchJson(url);
      console.log(`📦 Batch ${batch} response:`, {
        restaurants_count: data.restaurants?.length || 0,
        has_batch_metadata: !!data.batch,
        batch_has_more: data.batch?.has_more,
        total_restaurants: data.batch?.total_restaurants || data._debug?.total_restaurants
      });
      
      if (data.restaurants && data.restaurants.length > 0) {
        batches.push(...data.restaurants);
        totalRestaurants = data._debug?.total_restaurants || data.restaurants.length;
        
        // Check if there are more batches
        if (data.batch && data.batch.has_more) {
          batch++;
          console.log(`Batch ${batch - 1} complete, ${data.restaurants.length} restaurants. More batches available.`);
        } else {
          hasMore = false;
          console.log(`Batch ${batch} complete, ${data.restaurants.length} restaurants. All batches fetched.`);
        }
      } else {
        hasMore = false;
        console.log(`Batch ${batch} returned no restaurants. Stopping.`);
      }
    } catch (error) {
      console.error(`Error fetching batch ${batch}:`, error);
      hasMore = false;
    }
  }
  
  // Combine all batches and maintain original order
  const allRestaurants = batches;
  
  const result = {
    mall: batches.length > 0 ? { 
      id: mallId, 
      name: 'Sunway Square', 
      display_name: 'Sunway Square Mall' 
    } : null,
    source: 'google_places_textsearch_per_restaurant_batched',
    cached_ttl_seconds: 300,
    restaurants: allRestaurants,
    _debug: {
      total_restaurants: totalRestaurants || allRestaurants.length,
      restaurants_with_ratings: allRestaurants.filter(r => r.rating !== null).length,
      restaurants_without_ratings: allRestaurants.filter(r => r.rating === null).length,
      batches_fetched: batch,
    },
  };
  
  // Don't cache batched results to ensure fresh data on each load
  // setCached(cacheKey, result, LEADERBOARD_TTL_MS);
  return result;
}

// Page view tracking
export async function trackPageView(path = window.location.pathname, userId = null) {
  try {
    const url = buildUrl('/api/page-views');
    await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: path,
        user_id: userId,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Page view tracking failed:', error);
  }
}

// Get page view statistics
export async function getPageViewStats() {
  const url = buildUrl('/api/page-views');
  return await fetchJson(url);
}

// =========================
// Voucher System (per restaurant)
// =========================

export async function claimRestaurantVoucher({ userId, merchantName, merchantLogo, valueRm, minSpendRm }) {
  const url = buildUrl('/api/vouchers/spin');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      merchant_name: merchantName,
      merchant_logo: merchantLogo,
      value_rm: valueRm,
      min_spend_rm: minSpendRm,
    }),
  });
}

export async function fetchUserVouchers(userId) {
  const url = buildUrl('/api/vouchers', { user_id: userId });
  return await fetchJson(url);
}

export async function fetchVoucherStocks(merchantNames) {
  const url = buildUrl('/api/vouchers/stocks', {
    merchant_names: JSON.stringify(merchantNames || []),
    t: Date.now(), // cache buster
  });
  return await fetchJson(url, { cache: 'no-store' });
}

export async function removeUserVoucher({ userId, userVoucherId }) {
  const url = buildUrl('/api/vouchers/remove');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, user_voucher_id: userVoucherId }),
  });
}

export async function markVoucherUsed({ userId, userVoucherId }) {
  const url = buildUrl('/api/vouchers/use');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, user_voucher_id: userVoucherId }),
  });
}

export async function transferVouchers({ guestUserId, googleUserId }) {
  const url = buildUrl('/api/vouchers/transfer');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest_user_id: guestUserId, google_user_id: googleUserId }),
  });
}

// =========================
// Admin (Google access token)
// =========================

function withBearer(token) {
  const t = String(token || '').trim();
  if (!t) throw new Error('Auth token is required');
  return { Authorization: `Bearer ${t}` };
}

export async function adminFetchUserVouchers({ accessToken, status, userId, q, limit = 200, offset = 0 }) {
  const url = buildUrl('/api/admin/vouchers', {
    status,
    user_id: userId,
    q,
    limit,
    offset,
  });
  return await fetchJson(url, {
    headers: withBearer(accessToken),
    cache: 'no-store',
  });
}

export async function adminRevokeVoucher({ accessToken, userVoucherId }) {
  const url = buildUrl('/api/admin/vouchers/revoke');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...withBearer(accessToken) },
    body: JSON.stringify({ user_voucher_id: userVoucherId }),
  });
}

export async function adminDeleteVoucher({ accessToken, userVoucherId }) {
  const url = buildUrl('/api/admin/vouchers/delete');
  return await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...withBearer(accessToken) },
    body: JSON.stringify({ user_voucher_id: userVoucherId }),
  });
}


