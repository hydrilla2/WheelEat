// GET /api/restaurants?categories=<categories>&mall_id=<mall_id>&dietary_need=<dietary_need>
// Get restaurants, optionally filtered by categories (comma-separated), mall, and dietary need

import { getRestaurantsByCategories, getAllCategories } from './lib/restaurants.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

export async function onRequest(context) {
  const { request } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get('mall_id') || 'sunway_square';
    const dietaryNeed = url.searchParams.get('dietary_need') || 'any';
    let restaurants;

    const categoriesParam = url.searchParams.get('categories');
    if (categoriesParam) {
      // Filter by categories and dietary need
      const categoryList = categoriesParam.split(',').map(c => c.trim());
      restaurants = getRestaurantsByCategories(categoryList, mallId, dietaryNeed);
    } else {
      // Get all restaurants with dietary filter
      const allCategories = getAllCategories(mallId);
      restaurants = getRestaurantsByCategories(allCategories, mallId, dietaryNeed);
    }

    return jsonResponse({
      restaurants,
      count: restaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

