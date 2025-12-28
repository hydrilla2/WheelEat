// GET /api/leaderboard?mall_id=<mall_id>
// Returns a leaderboard-ready list of restaurants for a mall, enriched with Google Places rating + review count.
//
// Notes:
// - Uses your static restaurant list (category/unit/floor/logo) as the source of truth.
// - Enriches with Google Places "Text Search" results for "restaurants in <mall>".
// - Caches results for a short time to reduce repeated API calls.

import { createCORSResponse, jsonResponse } from './lib/cors.js';
import { getMallInfo, getRestaurantsByMall, getLogoPath } from './lib/restaurants.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

function toRestaurantObject(row, mallId) {
  // Source of truth is restaurants.js: [Restaurant Name, Unit Number, Floor, Category, Halal Status]
  if (!Array.isArray(row)) return null;
  const [name, unit, floor, category] = row;
  if (!name) return null;
  return {
    name,
    unit: unit || null,
    floor: floor || null,
    category: category || 'Unknown',
    logo: getLogoPath(name, mallId),
  };
}

function normalizeName(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(s) {
  const norm = normalizeName(s);
  return norm ? norm.split(' ').filter(Boolean) : [];
}

function matchScore(aName, bName) {
  // Simple token overlap score; good enough for mall-restaurant names.
  const a = tokenize(aName);
  const b = tokenize(bName);
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = new Set([...setA, ...setB]).size || 1;
  const jaccard = inter / union;
  // Bonus for exact normalized equality
  const exact = normalizeName(aName) === normalizeName(bName) ? 1 : 0;
  return jaccard + exact;
}

function pickBestMatch(targetName, places) {
  const target = normalizeName(targetName);
  if (!target) return null;

  let best = null;
  let bestScore = -1;
  for (const p of places) {
    const pn = p?.name;
    if (!pn) continue;
    const score = matchScore(targetName, pn);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  // Require some minimal similarity so we don’t attach random places.
  return bestScore >= 0.4 ? best : null;
}

async function fetchPlacesForQuery(query, apiKey) {
  // Google Places Text Search (legacy) endpoint.
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

  const url = new URL(baseUrl);
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Places Text Search failed: HTTP ${res.status} - ${text}`);
  }

  const data = await res.json();
  
  // Check for Google API errors
  if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    const errorMsg = data.error_message || data.status;
    console.error(`Google Places API error for query "${query}": ${data.status} - ${errorMsg}`);
    throw new Error(`Google Places API error: ${data.status} - ${errorMsg}`);
  }
  
  return Array.isArray(data?.results) ? data.results : [];
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  const n = Math.max(1, Math.min(limit, items.length));
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return createCORSResponse();
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get('mall_id') || 'sunway_square';

    // Cache first (edge cache)
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const mallInfo = getMallInfo(mallId);
    const raw = getRestaurantsByMall(mallId);
    const restaurants = (Array.isArray(raw) ? raw : [])
      .map((row) => toRestaurantObject(row, mallId))
      .filter(Boolean);

    const apiKey = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not found in environment variables');
      // Still return the base list (graceful degradation) so UI can render.
      const fallback = {
        mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
        source: 'static_only',
        cached_ttl_seconds: CACHE_TTL_SECONDS,
        restaurants: restaurants.map((r) => ({
          name: r.name,
          unit: r.unit || null,
          floor: r.floor || null,
          category: r.category || 'Unknown',
          logo: r.logo || null,
          rating: null,
          reviews: null,
          google: null,
        })),
      };

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
      return new Response(JSON.stringify(fallback), { status: 200, headers });
    }

    const mallQueryName = mallInfo?.display_name || mallInfo?.name || mallId;

    // Per-restaurant search gives much better coverage than "restaurants in mall" for long mall lists.
    // Concurrency is limited to avoid timeouts / rate spikes.
    const enriched = await mapWithConcurrency(restaurants, 6, async (r) => {
      try {
        const query = `${r.name} ${mallQueryName}`;
        const candidates = await fetchPlacesForQuery(query, apiKey);
        const match = pickBestMatch(r.name, candidates);
        return {
          ...r,
          rating: typeof match?.rating === 'number' ? match.rating : null,
          reviews: typeof match?.user_ratings_total === 'number' ? match.user_ratings_total : null,
          google: match
            ? {
                place_id: match.place_id || null,
                name: match.name || null,
              }
            : null,
        };
      } catch (e) {
        // Log error for debugging, but gracefully degrade per-restaurant
        console.error(`Error fetching Places data for "${r.name}":`, e.message);
        return { ...r, rating: null, reviews: null, google: null };
      }
    });

    const body = {
      mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
      source: 'google_places_textsearch_per_restaurant',
      cached_ttl_seconds: CACHE_TTL_SECONDS,
      restaurants: enriched,
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
    headers.set('Vary', 'Accept-Encoding');

    // Ensure CORS headers are present (jsonResponse helper would do it, but we need a cacheable Response instance).
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');

    const response = new Response(JSON.stringify(body), { status: 200, headers });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error('Error in leaderboard endpoint:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error.message,
      },
      500
    );
  }
}


