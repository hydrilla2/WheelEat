// POST /api/spin
// Spin the wheel and return a random restaurant from selected categories

import { getRestaurantsByCategories } from './lib/restaurants.js';
import supabase from './lib/supabase.js';

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body if it's a string (Vercel sometimes sends string)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ detail: 'Invalid JSON in request body' });
      }
    }
    
    if (!body || !body.selected_categories || body.selected_categories.length === 0) {
      return res.status(400).json({ detail: 'At least one category must be selected' });
    }

    const mallId = body.mall_id || 'sunway_square';
    const selectedCategories = body.selected_categories;

    // Get all restaurants in the selected categories for the specified mall
    const availableRestaurants = getRestaurantsByCategories(selectedCategories, mallId);

    if (availableRestaurants.length === 0) {
      return res.status(400).json({ detail: 'No restaurants found in selected categories' });
    }

    // Random selection with equal probability
    const selectedRestaurant = availableRestaurants[Math.floor(Math.random() * availableRestaurants.length)];

    // Log the spin to Supabase database
    try {
      const { data: spinLog, error: dbError } = await supabase
        .from('spin_logs')
        .insert({
          restaurant_name: selectedRestaurant.name,
          restaurant_unit: selectedRestaurant.unit,
          restaurant_floor: selectedRestaurant.floor,
          category: selectedRestaurant.category,
          dietary_need: body.dietary_need || 'any',
          mall_id: mallId,
          selected_categories: JSON.stringify(selectedCategories),
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue even if database insert fails
      }

      return res.status(200).json({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: spinLog?.timestamp || new Date().toISOString(),
        spin_id: spinLog?.id || null,
        logo: selectedRestaurant.logo
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return result even if database insert fails
      return res.status(200).json({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date().toISOString(),
        spin_id: null,
        logo: selectedRestaurant.logo
      });
    }
  } catch (error) {
    console.error('Error in spin endpoint:', error);
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

