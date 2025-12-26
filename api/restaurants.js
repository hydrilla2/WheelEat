// GET /api/restaurants?categories=<categories>&mall_id=<mall_id>
// Get restaurants, optionally filtered by categories (comma-separated) and mall

import { getRestaurantsByCategories, getAllCategories } from './lib/restaurants.js';

async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mallId = req.query.mall_id || 'sunway_square';
    let restaurants;

    if (req.query.categories) {
      // Filter by categories
      const categoryList = req.query.categories.split(',').map(c => c.trim());
      restaurants = getRestaurantsByCategories(categoryList, mallId);
    } else {
      // Get all restaurants
      const allCategories = getAllCategories(mallId);
      restaurants = getRestaurantsByCategories(allCategories, mallId);
    }

    return res.status(200).json({
      restaurants,
      count: restaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Export with CORS wrapper
export default async function(req, res) {
  // Set CORS headers FIRST - before anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Call the actual handler
  return await handler(req, res);
}

