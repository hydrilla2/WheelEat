// POST /api/spin
// Spin the wheel and return a random restaurant from selected categories

import { getRestaurantsByCategories } from './lib/restaurants.js';
import { getD1Database, generateUUID, getCurrentTimestamp } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';
import { RESTAURANT_PLACE_IDS } from './lib/restaurant-places.js';

// Helper function to get Google Maps URL from restaurant name and mall ID
function getGoogleMapsUrl(restaurantName, mallId) {
  const placeId = RESTAURANT_PLACE_IDS[mallId]?.[restaurantName];
  if (!placeId) {
    return null;
  }
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
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

      // Get Google Maps URL for the restaurant
      const googleMapsUrl = getGoogleMapsUrl(selectedRestaurant.name, mallId);

      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date(timestamp * 1000).toISOString(),
        spin_id: spinId,
        logo: selectedRestaurant.logo,
        google_maps_url: googleMapsUrl || null
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return result even if database insert fails
      // Get Google Maps URL for the restaurant
      const googleMapsUrl = getGoogleMapsUrl(selectedRestaurant.name, mallId);

      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date().toISOString(),
        spin_id: null,
        logo: selectedRestaurant.logo,
        google_maps_url: googleMapsUrl || null
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

