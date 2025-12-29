// GET /api/leaderboard?mall_id=<mall_id>
// Returns a leaderboard-ready list of restaurants for a mall, enriched with Google Places rating + review count.
//
// Notes:
// - Uses your static restaurant list (category/unit/floor/logo) as the source of truth.
// - Enriches with Google Places "Text Search" results for "restaurants in <mall>".
// - Caches results for a short time to reduce repeated API calls.

import { createCORSResponse, jsonResponse } from './lib/cors.js';
import { getMallInfo, getRestaurantsByMall, getLogoPath } from './lib/restaurants.js';
import { getPlaceId } from './lib/restaurant-places.js';

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
  // Lowered threshold from 0.4 to 0.25 to catch more matches
  // This helps with restaurants that have slightly different names in Google Places
  return bestScore >= 0.25 ? best : null;
}

/**
 * Fetch place details by place_id using Place Details API
 * @param {string} placeId - Google Places place_id
 * @param {string} apiKey - Google Places API key
 * @returns {Promise<object|null>} - Place details or null
 */
async function fetchPlaceDetails(placeId, apiKey) {
  if (!placeId || !apiKey) return null;
  
  try {
    // Try new Places API first
    const baseUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        name: data.displayName?.text || data.displayName,
        rating: data.rating,
        user_ratings_total: data.userRatingCount,
        place_id: data.id || placeId,
      };
    }
    
    // Fallback to legacy Place Details API
    return await fetchPlaceDetailsLegacy(placeId, apiKey);
  } catch (error) {
    console.log(`New Places API error for place_id ${placeId}, trying legacy: ${error.message}`);
    return await fetchPlaceDetailsLegacy(placeId, apiKey);
  }
}

/**
 * Fetch place details using legacy Place Details API
 * @param {string} placeId - Google Places place_id
 * @param {string} apiKey - Google Places API key
 * @returns {Promise<object|null>} - Place details or null
 */
async function fetchPlaceDetailsLegacy(placeId, apiKey) {
  if (!placeId || !apiKey) return null;
  
  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const url = new URL(baseUrl);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', 'name,rating,user_ratings_total,place_id');

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Place Details API failed: HTTP ${res.status} - ${text}`);
    }

    const data = await res.json();
    
    if (data.status === 'OK' && data.result) {
      return {
        name: data.result.name,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        place_id: data.result.place_id || placeId,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error.message);
    return null;
  }
}

async function fetchPlacesForQuery(query, apiKey) {
  // Try new Places API first, fallback to legacy if needed
  try {
    // New Places API (Places API (New))
    const baseUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 10,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // If new API fails, try legacy
      if (res.status === 404 || res.status === 403) {
        console.log(`New Places API not available, trying legacy API for query: "${query}"`);
        return await fetchPlacesForQueryLegacy(query, apiKey);
      }
      throw new Error(`Google Places API (New) failed: HTTP ${res.status} - ${text}`);
    }

    const data = await res.json();
    
    // Convert new API format to legacy format for compatibility
    if (data.places && Array.isArray(data.places)) {
      return data.places.map(place => ({
        name: place.displayName?.text || place.displayName,
        rating: place.rating,
        user_ratings_total: place.userRatingCount,
        place_id: place.id,
      }));
    }
    
    return [];
  } catch (error) {
    // Fallback to legacy API if new API fails
    console.log(`New Places API error, trying legacy API: ${error.message}`);
    return await fetchPlacesForQueryLegacy(query, apiKey);
  }
}

async function fetchPlacesForQueryLegacy(query, apiKey) {
  // Legacy Places API Text Search endpoint (fallback)
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

  const url = new URL(baseUrl);
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Places Text Search (Legacy) failed: HTTP ${res.status} - ${text}`);
  }

  const data = await res.json();
  
  // Check for Google API errors
  if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    const errorMsg = data.error_message || data.status;
    console.error(`Google Places API (Legacy) error for query "${query}": ${data.status} - ${errorMsg}`);
    throw new Error(`Google Places API (Legacy) error: ${data.status} - ${errorMsg}`);
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
    // Track errors for debugging
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    
    const enriched = await mapWithConcurrency(restaurants, 6, async (r) => {
      try {
        // First, check if we have a place_id mapping for this restaurant
        const placeId = getPlaceId(r.name, mallId);
        let match = null;
        
        if (placeId) {
          // Use Place Details API for exact match
          match = await fetchPlaceDetails(placeId, apiKey);
          if (match) {
            // Even if rating is null/undefined, we found the place, so count as success
            // Some places might not have ratings yet
            if (match.rating !== null && match.rating !== undefined) {
              successCount++;
            } else {
              // Place found but no rating - still count as found
              console.log(`Place found for "${r.name}" but no rating available (place_id: ${placeId})`);
            }
            return {
              ...r,
              rating: typeof match.rating === 'number' ? match.rating : null,
              reviews: typeof match.user_ratings_total === 'number' ? match.user_ratings_total : null,
              google: {
                place_id: match.place_id || placeId,
                name: match.name || null,
              },
            };
          } else {
            // Place Details API failed, will fallback to text search
            console.log(`Place Details API failed for "${r.name}" (place_id: ${placeId}), falling back to text search`);
          }
        }
        
        // Fallback to text search if no place_id or place_id lookup failed
        // Try multiple query variations to improve match rate
        const queries = [
          `${r.name} ${mallQueryName}`,
          `${r.name} Sunway Square`,
          r.name, // Just the restaurant name
        ];
        
        let candidates = [];
        for (const query of queries) {
          try {
            const results = await fetchPlacesForQuery(query, apiKey);
            candidates = candidates.concat(results);
            // If we found results, break early
            if (results.length > 0) break;
          } catch (e) {
            // Continue to next query if this one fails
            continue;
          }
        }
        
        // Remove duplicates based on place_id
        const uniqueCandidates = [];
        const seenPlaceIds = new Set();
        for (const candidate of candidates) {
          const pid = candidate.place_id;
          if (pid && !seenPlaceIds.has(pid)) {
            seenPlaceIds.add(pid);
            uniqueCandidates.push(candidate);
          } else if (!pid) {
            // Include candidates without place_id (shouldn't happen, but just in case)
            uniqueCandidates.push(candidate);
          }
        }
        
        match = pickBestMatch(r.name, uniqueCandidates);
        
        if (match) {
          successCount++;
        } else {
          errorCount++;
          // Log first few failures for debugging
          if (errorCount <= 3) {
            console.log(`No match found for "${r.name}" - found ${candidates.length} candidates`);
          }
        }
        
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
        errorCount++;
        errors.push({ restaurant: r.name, error: e.message });
        // Log first few errors for debugging
        if (errors.length <= 3) {
          console.error(`Error fetching Places data for "${r.name}":`, e.message);
        }
        return { ...r, rating: null, reviews: null, google: null };
      }
    });
    
    // Log summary
    console.log(`Leaderboard enrichment complete: ${successCount} matched, ${errorCount} failed, ${errors.length} errors`);
    if (errors.length > 0 && errors.length <= 5) {
      console.error('Sample errors:', errors);
    }

    // Count how many restaurants have ratings
    const withRatings = enriched.filter(r => r.rating !== null).length;
    const total = enriched.length;
    
    const body = {
      mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
      source: 'google_places_textsearch_per_restaurant',
      cached_ttl_seconds: CACHE_TTL_SECONDS,
      restaurants: enriched,
      _debug: {
        total_restaurants: total,
        restaurants_with_ratings: withRatings,
        restaurants_without_ratings: total - withRatings,
      },
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


