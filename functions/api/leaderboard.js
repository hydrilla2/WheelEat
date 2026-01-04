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
  // Require some minimal similarity so we don’t attach random places.
  return bestScore >= 0.4 ? best : null;
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

    console.log(`Fetching Place Details for ${placeId}...`);
    let res;
    try {
      res = await fetch(url.toString());
    } catch (error) {
      // Catch "Too many subrequests" error from Cloudflare
      if (error.message && error.message.includes('Too many subrequests')) {
        console.error(`⚠️ Cloudflare subrequest limit reached for ${placeId}. This is a Cloudflare Pages limit, not an API issue.`);
        throw error; // Re-throw to be handled by caller
      }
      throw error;
    }
    
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
      
      // Log success with details
      if (result.rating !== null && result.rating !== undefined) {
        console.log(`✅ Place Details API success for ${placeId}: rating=${result.rating}, reviews=${result.user_ratings_total}`);
      } else {
        console.log(`⚠️ Place Details API found ${placeId} but no rating available (name: ${result.name})`);
      }
      
      return result;
    }
    
    console.warn(`Place Details API returned OK but no result for ${placeId}`);
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
    
    // Support batch processing for client-side batching
    const batch = parseInt(url.searchParams.get('batch') || '0');
    const batchSize = parseInt(url.searchParams.get('batch_size') || '0');
    
    // Debug logging for batch parameters
    console.log(`📦 Request URL: ${request.url}`);
    console.log(`📦 Batch parameters: batch=${batch}, batchSize=${batchSize}, mallId=${mallId}`);
    
    // Cache first (edge cache)
    // Skip cache if nocache parameter is present (for debugging)
    const skipCache = url.searchParams.get('nocache') === '1';
    
    const cache = caches.default;
    const cacheKey = new Request(request.url, { method: 'GET' });
    const cached = skipCache ? null : await cache.match(cacheKey);
    if (cached) {
      console.log(`📦 Returning cached response (skipCache=${skipCache})`);
      return cached;
    }
    console.log(`📦 No cache hit, processing request...`);

    const mallInfo = getMallInfo(mallId);
    const raw = getRestaurantsByMall(mallId);
    const restaurants = (Array.isArray(raw) ? raw : [])
      .map((row) => toRestaurantObject(row, mallId))
      .filter(Boolean);

    // Apply batch slicing BEFORE API key check, so fallback also respects batching
    let restaurantsToProcess = restaurants;
    if (batch > 0 && batchSize > 0) {
      const start = (batch - 1) * batchSize;
      const end = start + batchSize;
      restaurantsToProcess = restaurants.slice(start, end);
      console.log(`📦 Batch slicing (before API check): batch ${batch}, size ${batchSize}, processing restaurants ${start + 1}-${Math.min(end, restaurants.length)} of ${restaurants.length}`);
    }

    const apiKey = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY not found in environment variables');
      console.error('Available env keys:', Object.keys(env).filter(k => k.includes('GOOGLE') || k.includes('API')));
      // Still return the base list (graceful degradation) so UI can render.
      // Use restaurantsToProcess (already sliced if batching) instead of full restaurants array
      const fallback = {
        mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
        source: 'static_only',
        cached_ttl_seconds: CACHE_TTL_SECONDS,
        restaurants: restaurantsToProcess.map((r) => ({
          name: r.name,
          unit: r.unit || null,
          floor: r.floor || null,
          category: r.category || 'Unknown',
          logo: r.logo || null,
          rating: null,
          reviews: null,
          google: null,
        })),
        // Add batch info if batch processing
        ...(batch > 0 && batchSize > 0 ? {
          batch: {
            current: batch,
            size: batchSize,
            total_restaurants: restaurants.length,
            has_more: (batch * batchSize) < restaurants.length,
          }
        } : {}),
      };

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
      return new Response(JSON.stringify(fallback), { status: 200, headers });
    }

    const mallQueryName = mallInfo?.display_name || mallInfo?.name || mallId;

    // Per-restaurant search gives much better coverage than "restaurants in mall" for long mall lists.
    // To maximize success rate within Cloudflare's subrequest limit (~50 per request), we:
    // 1. Prioritize restaurants with place_ids (1 API call each) - process these first
    // 2. Process restaurants without place_ids last (they need text search, which uses more API calls)
    // 3. Skip text search fallback when limit is hit to save API calls
    
    // Note: restaurantsToProcess is already set above (before API key check) if batching is requested
    // If not batching, use full restaurants array
    if (!(batch > 0 && batchSize > 0)) {
      restaurantsToProcess = restaurants;
      console.log(`📦 No batch processing: processing all ${restaurants.length} restaurants`);
    } else {
      console.log(`📦 Batch processing: batch ${batch}, size ${batchSize}, processing restaurants from slice (${restaurantsToProcess.length} restaurants)`);
    }
    
    // Separate restaurants into two groups: with place_ids and without
    const restaurantsWithPlaceIds = [];
    const restaurantsWithoutPlaceIds = [];
    
    for (const r of restaurantsToProcess) {
      const placeId = getPlaceId(r.name, mallId);
      if (placeId) {
        restaurantsWithPlaceIds.push(r);
      } else {
        restaurantsWithoutPlaceIds.push(r);
      }
    }
    
    console.log(`Processing ${restaurantsWithPlaceIds.length} restaurants with place_ids first, then ${restaurantsWithoutPlaceIds.length} without place_ids`);
    
    // Track errors for debugging
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    let subrequestLimitHit = false; // Track if we've hit the subrequest limit
    
    // Process restaurants with place_ids first (1 API call each, most efficient)
    // Use concurrency of 1 to maximize restaurants processed before hitting subrequest limit
    // With concurrency of 1, we can process ~50 restaurants before hitting the ~50 subrequest limit
    const enrichedWithPlaceIds = await mapWithConcurrency(restaurantsWithPlaceIds, 1, async (r) => {
      try {
        // Skip if we've already hit the subrequest limit
        if (subrequestLimitHit) {
          console.log(`Skipping "${r.name}" (subrequest limit reached)`);
          return {
            ...r,
            rating: null,
            reviews: null,
            google: null,
            _debug: { method: 'place_details', place_id: getPlaceId(r.name, mallId), found: false, skipped: 'subrequest_limit' },
          };
        }
        
        const placeId = getPlaceId(r.name, mallId);
        let match = null;
        let debugInfo = null;
        
        if (placeId) {
          // Use Place Details API for exact match
          console.log(`Looking up place_id for "${r.name}": ${placeId}, apiKey present: ${!!apiKey}`);
          match = await fetchPlaceDetails(placeId, apiKey);
          if (match) {
            // Even if rating is null/undefined, we found the place, so count as success
            // Some places might not have ratings yet
            if (match.rating !== null && match.rating !== undefined) {
              successCount++;
              console.log(`✅ Place Details API success for "${r.name}": rating=${match.rating}, reviews=${match.user_ratings_total}`);
            } else {
              // Place found but no rating - still count as found
              console.log(`⚠️ Place found for "${r.name}" but no rating available (place_id: ${placeId})`);
              debugInfo = { method: 'place_details', place_id: placeId, found: true, has_rating: false };
            }
            return {
              ...r,
              rating: typeof match.rating === 'number' ? match.rating : null,
              reviews: typeof match.user_ratings_total === 'number' ? match.user_ratings_total : null,
              google: {
                place_id: match.place_id || placeId,
                name: match.name || null,
              },
              _debug: debugInfo || { method: 'place_details', place_id: placeId, found: true, has_rating: true },
            };
          } else {
            // Place Details API failed, will fallback to text search
            // Check if it's a "Too many subrequests" error (Cloudflare limit)
            const isSubrequestLimit = match === null && placeId; // If match is null, it might be due to subrequest limit
            
            console.error(`❌ Place Details API failed for "${r.name}" (place_id: ${placeId})`);
            console.error(`   - apiKey present: ${!!apiKey}`);
            console.error(`   - apiKey length: ${apiKey ? apiKey.length : 0}`);
            if (isSubrequestLimit) {
              console.error(`   - ⚠️ Likely hit Cloudflare "Too many subrequests" limit`);
              subrequestLimitHit = true; // Mark that we've hit the limit
            }
            
            // If we've hit the subrequest limit, skip text search fallback to save API calls
            if (subrequestLimitHit) {
              console.error(`   - Skipping text search fallback (subrequest limit reached)`);
              debugInfo = { 
                method: 'place_details', 
                place_id: placeId, 
                found: false, 
                fallback: 'skipped_due_to_limit',
                apiKey_present: !!apiKey,
                apiKey_length: apiKey ? apiKey.length : 0,
                error: 'Too many subrequests (Cloudflare limit)'
              };
              return {
                ...r,
                rating: null,
                reviews: null,
                google: null,
                _debug: debugInfo,
              };
            }
            
            // Don't fallback to text search for restaurants with place_ids - they should only use Place Details API
            // If Place Details fails, return null (we'll handle it in the next phase if needed)
            return {
              ...r,
              rating: null,
              reviews: null,
              google: null,
              _debug: debugInfo || { 
                method: 'place_details', 
                place_id: placeId, 
                found: false, 
                error: isSubrequestLimit ? 'Too many subrequests (Cloudflare limit)' : 'Unknown'
              },
            };
          }
        }
        
        // This shouldn't happen for restaurants with place_ids, but handle it just in case
        return {
          ...r,
          rating: null,
          reviews: null,
          google: null,
          _debug: { method: 'place_details', place_id: placeId, found: false, error: 'No place_id found' },
        };
      } catch (e) {
        errorCount++;
        const errorMsg = e.message || String(e);
        errors.push({ restaurant: r.name, error: errorMsg });
        
        // Check if it's a "Too many subrequests" error
        if (errorMsg.includes('Too many subrequests')) {
          console.error(`⚠️ Cloudflare subrequest limit reached for "${r.name}". This is a Cloudflare Pages limit (typically 50 subrequests per request).`);
          console.error(`   Consider reducing concurrency or implementing request batching.`);
        } else {
          // Log first few errors for debugging
          if (errors.length <= 3) {
            console.error(`Error fetching Places data for "${r.name}":`, errorMsg);
          }
        }
        return { 
          ...r, 
          rating: null, 
          reviews: null, 
          google: null,
          _debug: { method: 'place_details', found: false, error: errorMsg },
        };
      }
    });
    
    // Process restaurants without place_ids (they need text search, which uses more API calls)
    // Only process if we haven't hit the subrequest limit yet
    let enrichedWithoutPlaceIds = [];
    if (!subrequestLimitHit && restaurantsWithoutPlaceIds.length > 0) {
      console.log(`Processing ${restaurantsWithoutPlaceIds.length} restaurants without place_ids (text search)`);
      enrichedWithoutPlaceIds = await mapWithConcurrency(restaurantsWithoutPlaceIds, 1, async (r) => {
        try {
          // Skip if we've hit the subrequest limit
          if (subrequestLimitHit) {
            console.log(`Skipping text search for "${r.name}" (subrequest limit reached)`);
            return {
              ...r,
              rating: null,
              reviews: null,
              google: null,
              _debug: { method: 'text_search', found: false, skipped: 'subrequest_limit' },
            };
          }
          
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
              // Check if it's a "Too many subrequests" error
              if (e.message && e.message.includes('Too many subrequests')) {
                subrequestLimitHit = true;
                console.error(`⚠️ Cloudflare subrequest limit reached during text search for "${r.name}"`);
              }
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
          
          const match = pickBestMatch(r.name, uniqueCandidates);
          
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
            _debug: { method: 'text_search', found: match !== null },
          };
        } catch (e) {
          errorCount++;
          const errorMsg = e.message || String(e);
          errors.push({ restaurant: r.name, error: errorMsg });
          
          // Check if it's a "Too many subrequests" error
          if (errorMsg.includes('Too many subrequests')) {
            console.error(`⚠️ Cloudflare subrequest limit reached for "${r.name}". This is a Cloudflare Pages limit (typically 50 subrequests per request).`);
            subrequestLimitHit = true; // Mark that we've hit the limit
          } else {
            // Log first few errors for debugging
            if (errors.length <= 3) {
              console.error(`Error fetching Places data for "${r.name}":`, errorMsg);
            }
          }
          
          return {
            ...r,
            rating: null,
            reviews: null,
            google: null,
            _debug: { method: 'text_search', found: false, error: errorMsg },
          };
        }
      });
    } else if (subrequestLimitHit) {
      // If we hit the limit, return restaurants without place_ids as null
      console.log(`Skipping ${restaurantsWithoutPlaceIds.length} restaurants without place_ids (subrequest limit reached)`);
      enrichedWithoutPlaceIds = restaurantsWithoutPlaceIds.map(r => ({
        ...r,
        rating: null,
        reviews: null,
        google: null,
        _debug: { method: 'text_search', found: false, skipped: 'subrequest_limit' },
      }));
    }
    
    // Combine results: maintain original order by merging back in the correct sequence
    const enrichedMap = new Map();
    enrichedWithPlaceIds.forEach(r => enrichedMap.set(r.name, r));
    enrichedWithoutPlaceIds.forEach(r => enrichedMap.set(r.name, r));
    
    // Reconstruct in original order - use restaurantsToProcess (sliced if batching) not the full restaurants array
    const enriched = restaurantsToProcess.map(r => enrichedMap.get(r.name) || {
      ...r,
      rating: null,
      reviews: null,
      google: null,
      _debug: { method: 'unknown', found: false },
    });
    
    // Log summary
    console.log(`Leaderboard enrichment complete: ${successCount} matched, ${errorCount} failed, ${errors.length} errors`);
    if (errors.length > 0 && errors.length <= 5) {
      console.error('Sample errors:', errors);
    }

    // Count how many restaurants have ratings
    const withRatings = enriched.filter(r => r.rating !== null).length;
    const total = enriched.length;
    
    // Remove _debug from restaurants for cleaner response (optional - comment out if you want to see debug info)
    const restaurantsClean = enriched.map(({ _debug, ...rest }) => rest);
    
    const body = {
      mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
      source: 'google_places_textsearch_per_restaurant',
      cached_ttl_seconds: CACHE_TTL_SECONDS,
      restaurants: restaurantsClean,
      // Add batch info if batch processing
      ...(batch > 0 && batchSize > 0 ? {
        batch: {
          current: batch,
          size: batchSize,
          total_restaurants: restaurants.length,
          has_more: (batch * batchSize) < restaurants.length,
        }
      } : {}),
      _debug: {
        total_restaurants: total,
        restaurants_with_ratings: withRatings,
        restaurants_without_ratings: total - withRatings,
        // Include debug info for restaurants without ratings (for troubleshooting)
        restaurants_without_ratings_debug: enriched
          .filter(r => r.rating === null)
          .map(r => ({
            name: r.name,
            has_place_id: !!getPlaceId(r.name, mallId),
            place_id: getPlaceId(r.name, mallId),
            debug: r._debug,
          })),
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


