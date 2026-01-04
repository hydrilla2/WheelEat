// POST /api/spin
// Spin the wheel and return a random restaurant from selected categories

import { getRestaurantsByCategories } from './lib/restaurants.js';
import { getD1Database, generateUUID, getCurrentTimestamp } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';
import { RESTAURANT_PLACE_IDS, getRestaurantCoordinates } from './lib/restaurant-places.js';

// Helper function to get Google Maps URLs from restaurant name and mall ID
// Returns both web URL (for desktop) and mobile deep link (for Google Maps app on mobile)
function getGoogleMapsUrls(restaurantName, mallId) {
  const placeId = RESTAURANT_PLACE_IDS[mallId]?.[restaurantName];
  const coordinates = getRestaurantCoordinates(restaurantName, mallId);

  if (!placeId && !coordinates) {
    return { web: null, mobile: null };
  }

  // Web URL - works well for desktop browsers and fallback for mobile
  const webUrl = placeId 
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
    : null;

  // Mobile deep link - uses Google Maps search URL with coordinates and restaurant name
  // This works better on mobile devices and opens the Maps app if installed
  let mobileUrl = null;
  if (coordinates && restaurantName) {
    // Use Google Maps search URL with location and restaurant name
    // Format: https://maps.google.com/maps/search/RestaurantName/@LAT,LNG,15z
    // The intent:// wrapper will open in Google Maps app on Android
    const mapsSearchUrl = `https://maps.google.com/maps/search/${encodeURIComponent(restaurantName)}/@${coordinates.lat},${coordinates.lng},15z`;
    mobileUrl = `intent://${mapsSearchUrl.replace('https://', '')}#Intent;scheme=https;action=android.intent.action.VIEW;package=com.google.android.apps.maps;end`;
  } else if (webUrl) {
    // Fallback to web URL
    mobileUrl = webUrl;
  }

  return { 
    web: webUrl,
    mobile: mobileUrl
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ detail: 'Invalid JSON in request body' }, 400);
    }
    
    if (!body || !body.selected_categories || body.selected_categories.length === 0) {
      return jsonResponse({ detail: 'At least one category must be selected' }, 400);
    }

    const mallId = body.mall_id || 'sunway_square';
    const selectedCategories = body.selected_categories;

    // Get all restaurants in the selected categories for the specified mall
    const availableRestaurants = getRestaurantsByCategories(selectedCategories, mallId);

    if (availableRestaurants.length === 0) {
      return jsonResponse({ detail: 'No restaurants found in selected categories' }, 400);
    }

    // Random selection with equal probability
    const selectedRestaurant = availableRestaurants[Math.floor(Math.random() * availableRestaurants.length)];

    // Log the spin to D1 database
    try {
      const db = getD1Database(env);
      const spinId = generateUUID();
      const timestamp = getCurrentTimestamp();
      
      // Insert spin log into D1
      const result = await db.prepare(
        `INSERT INTO spin_logs (
          id, restaurant_name, restaurant_unit, restaurant_floor,
          category, dietary_need, timestamp, mall_id, selected_categories, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        spinId,
        selectedRestaurant.name,
        selectedRestaurant.unit || null,
        selectedRestaurant.floor || null,
        selectedRestaurant.category,
        body.dietary_need || 'any',
        timestamp,
        mallId,
        JSON.stringify(selectedCategories),
        timestamp
      ).run();

      if (!result.success) {
        console.error('Database error:', result.error);
        // Continue even if database insert fails
      }

      // Get Google Maps URLs for the restaurant (both web and mobile versions)
      const googleMapsUrls = getGoogleMapsUrls(selectedRestaurant.name, mallId);

      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date(timestamp * 1000).toISOString(),
        spin_id: spinId,
        logo: selectedRestaurant.logo,
        google_maps_url: googleMapsUrls.web || null,
        google_maps_mobile_url: googleMapsUrls.mobile || null
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return result even if database insert fails
      // Get Google Maps URLs for the restaurant (both web and mobile versions)
      const googleMapsUrls = getGoogleMapsUrls(selectedRestaurant.name, mallId);

      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date().toISOString(),
        spin_id: null,
        logo: selectedRestaurant.logo,
        google_maps_url: googleMapsUrls.web || null,
        google_maps_mobile_url: googleMapsUrls.mobile || null
      });
    }
  } catch (error) {
    console.error('Error in spin endpoint:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

