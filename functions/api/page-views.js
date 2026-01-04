// POST /api/page-views - Track a page view
// GET /api/page-views - Get page view statistics

import { getD1Database, generateUUID, getCurrentTimestamp } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

// POST /api/page-views - Track a page view
export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const db = getD1Database(env);
    const viewId = generateUUID();
    const timestamp = getCurrentTimestamp();

    // Extract user info from request headers or body
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || '';
    const path = body.path || '/';
    const userId = body.user_id || null;

    // Insert page view into D1
    const result = await db.prepare(
      `INSERT INTO page_views (
        id, path, user_id, user_agent, referer, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      viewId,
      path,
      userId,
      userAgent.substring(0, 500), // Limit user agent length
      referer.substring(0, 500), // Limit referer length
      timestamp,
      timestamp
    ).run();

    if (!result.success) {
      console.error('Database error:', result.error);
      return jsonResponse({
        error: 'Database error',
        message: result.error?.message || 'Failed to log page view',
      }, 500);
    }

    return jsonResponse({
      success: true,
      view_id: viewId,
      timestamp: new Date(timestamp * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Page view tracking error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

// GET /api/page-views - Get page view statistics
export async function onRequestGet(context) {
  const { request, env } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  try {
    const db = getD1Database(env);

    // Get total page views
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM page_views').first();
    const totalViews = totalResult?.count || 0;

    // Get unique visitors (by user_id or user_agent)
    const uniqueVisitorsResult = await db.prepare(
      `SELECT COUNT(DISTINCT COALESCE(user_id, user_agent)) as count FROM page_views`
    ).first();
    const uniqueVisitors = uniqueVisitorsResult?.count || 0;

    // Get views by path
    const viewsByPath = await db.prepare(
      `SELECT path, COUNT(*) as count 
       FROM page_views 
       GROUP BY path 
       ORDER BY count DESC 
       LIMIT 20`
    ).all();

    // Get daily page views (last 30 days)
    const dailyViews = await db.prepare(
      `SELECT 
         DATE(datetime(timestamp, 'unixepoch')) as date,
         COUNT(*) as count
       FROM page_views
       WHERE timestamp > strftime('%s', 'now', '-30 days')
       GROUP BY date
       ORDER BY date DESC`
    ).all();

    // Get recent page views (last 20)
    const recentViews = await db.prepare(
      `SELECT id, path, user_id, timestamp, created_at 
       FROM page_views 
       ORDER BY timestamp DESC 
       LIMIT 20`
    ).all();

    return jsonResponse({
      success: true,
      summary: {
        total_views: totalViews,
        unique_visitors: uniqueVisitors,
        average_views_per_visitor: uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(2) : 0,
      },
      statistics: {
        views_by_path: viewsByPath.results || [],
        daily_views: dailyViews.results || [],
        recent_views: recentViews.results || [],
      },
    });
  } catch (error) {
    console.error('Page views API error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

// Main handler - routes GET and POST requests
export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'GET') {
    return onRequestGet(context);
  } else if (request.method === 'POST') {
    return onRequestPost(context);
  } else if (request.method === 'OPTIONS') {
    return createCORSResponse();
  } else {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}
