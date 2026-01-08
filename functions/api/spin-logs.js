// GET /api/spin-logs - Get spin log statistics and data

import { getD1Database } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

// GET /api/spin-logs - Get spin log statistics
export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const db = getD1Database(env);
    const url = new URL(request.url);
    
    // Parse query parameters for filtering
    const date = url.searchParams.get('date'); // YYYY-MM-DD format
    const startDate = url.searchParams.get('start_date'); // YYYY-MM-DD format
    const endDate = url.searchParams.get('end_date'); // YYYY-MM-DD format
    const days = url.searchParams.get('days'); // Number of days (e.g., 7, 30)
    const category = url.searchParams.get('category'); // Filter by category
    const mallId = url.searchParams.get('mall_id'); // Filter by mall
    const restaurantName = url.searchParams.get('restaurant_name'); // Filter by restaurant
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Build WHERE clause for filtering
    let whereConditions = [];
    let bindParams = [];
    
    if (date) {
      // Filter by specific date
      const startTimestamp = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000);
      whereConditions.push('timestamp >= ? AND timestamp <= ?');
      bindParams.push(startTimestamp, endTimestamp);
    } else if (startDate && endDate) {
      // Filter by date range
      const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000);
      whereConditions.push('timestamp >= ? AND timestamp <= ?');
      bindParams.push(startTimestamp, endTimestamp);
    } else if (days) {
      // Filter by last N days - calculate timestamp in JavaScript
      const daysAgo = parseInt(days, 10);
      const cutoffTimestamp = Math.floor((Date.now() - (daysAgo * 24 * 60 * 60 * 1000)) / 1000);
      whereConditions.push('timestamp > ?');
      bindParams.push(cutoffTimestamp);
    } else {
      // Default: last 30 days - calculate timestamp in JavaScript
      const cutoffTimestamp = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      whereConditions.push('timestamp > ?');
      bindParams.push(cutoffTimestamp);
    }

    if (category) {
      whereConditions.push('category = ?');
      bindParams.push(category);
    }

    if (mallId) {
      whereConditions.push('mall_id = ?');
      bindParams.push(mallId);
    }

    if (restaurantName) {
      whereConditions.push('restaurant_name LIKE ?');
      bindParams.push(`%${restaurantName}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total spins (with filters if specified)
    const totalQuery = `SELECT COUNT(*) as count FROM spin_logs ${whereClause}`;
    const totalResult = await (bindParams.length > 0 
      ? db.prepare(totalQuery).bind(...bindParams).first()
      : db.prepare(totalQuery).first());
    const totalSpins = totalResult?.count || 0;

    // Get spins by category
    const categoryQuery = `SELECT category, COUNT(*) as count FROM spin_logs ${whereClause} GROUP BY category ORDER BY count DESC`;
    const spinsByCategory = await (bindParams.length > 0
      ? db.prepare(categoryQuery).bind(...bindParams).all()
      : db.prepare(categoryQuery).all());

    // Get spins by restaurant
    const restaurantQuery = `SELECT restaurant_name, COUNT(*) as count FROM spin_logs ${whereClause} GROUP BY restaurant_name ORDER BY count DESC LIMIT ?`;
    const spinsByRestaurant = await (bindParams.length > 0
      ? db.prepare(restaurantQuery).bind(...bindParams, limit).all()
      : db.prepare(restaurantQuery).bind(limit).all());

    // Get spins by mall
    const mallQuery = `SELECT mall_id, COUNT(*) as count FROM spin_logs ${whereClause} GROUP BY mall_id ORDER BY count DESC`;
    const spinsByMall = await (bindParams.length > 0
      ? db.prepare(mallQuery).bind(...bindParams).all()
      : db.prepare(mallQuery).all());

    // Get daily spins
    const dailyQuery = `SELECT DATE(datetime(timestamp, 'unixepoch')) as date, COUNT(*) as count FROM spin_logs ${whereClause} GROUP BY date ORDER BY date DESC`;
    const dailySpins = await (bindParams.length > 0
      ? db.prepare(dailyQuery).bind(...bindParams).all()
      : db.prepare(dailyQuery).all());

    // Get recent spins with full details
    const recentQuery = `SELECT 
      id, 
      restaurant_name, 
      restaurant_unit, 
      restaurant_floor, 
      category, 
      dietary_need, 
      timestamp, 
      mall_id, 
      selected_categories, 
      created_at,
      datetime(timestamp, 'unixepoch') as date_time
    FROM spin_logs ${whereClause} ORDER BY timestamp DESC LIMIT ?`;
    const recentSpins = await (bindParams.length > 0
      ? db.prepare(recentQuery).bind(...bindParams, limit).all()
      : db.prepare(recentQuery).bind(limit).all());

    return jsonResponse({
      success: true,
      filters: {
        date: date || null,
        start_date: startDate || null,
        end_date: endDate || null,
        days: days || null,
        category: category || null,
        mall_id: mallId || null,
        restaurant_name: restaurantName || null,
      },
      summary: {
        total_spins: totalSpins,
      },
      statistics: {
        spins_by_category: spinsByCategory.results || [],
        spins_by_restaurant: spinsByRestaurant.results || [],
        spins_by_mall: spinsByMall.results || [],
        daily_spins: dailySpins.results || [],
        recent_spins: recentSpins.results || [],
      },
    });
  } catch (error) {
    console.error('Spin logs API error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}
