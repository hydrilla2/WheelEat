// POST /api/user-sessions - Track user session (start, heartbeat, end)
// GET /api/user-sessions - Get session statistics

import { getD1Database, generateUUID, getCurrentTimestamp } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

// POST /api/user-sessions - Track session events
async function handlePost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { action, session_id, user_id, user_agent, referer } = body;

    if (!action || !['start', 'heartbeat', 'end'].includes(action)) {
      return jsonResponse({ error: 'Invalid action. Must be: start, heartbeat, or end' }, 400);
    }

    const db = getD1Database(env);
    const now = Date.now();
    const nowSeconds = getCurrentTimestamp();

    if (action === 'start') {
      // Start a new session
      const sessionId = generateUUID();
      const result = await db.prepare(
        `INSERT INTO user_sessions (
          id, user_id, session_start_ms, last_activity_ms, 
          user_agent, referer, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        user_id || null,
        now,
        now,
        (user_agent || '').substring(0, 500),
        (referer || '').substring(0, 500),
        nowSeconds,
        nowSeconds
      ).run();

      if (!result.success) {
        console.error('Database error:', result.error);
        return jsonResponse({ error: 'Failed to create session' }, 500);
      }

      return jsonResponse({
        success: true,
        session_id: sessionId,
        session_start_ms: now,
      });
    }

    if (!session_id) {
      return jsonResponse({ error: 'session_id is required for heartbeat and end actions' }, 400);
    }

    if (action === 'heartbeat') {
      // Update last activity time
      const result = await db.prepare(
        `UPDATE user_sessions 
         SET last_activity_ms = ?, updated_at = ?, page_views = page_views + 1
         WHERE id = ? AND session_end_ms IS NULL`
      ).bind(now, nowSeconds, session_id).run();

      if (!result.success) {
        console.error('Database error:', result.error);
        return jsonResponse({ error: 'Failed to update session' }, 500);
      }

      return jsonResponse({
        success: true,
        last_activity_ms: now,
      });
    }

    if (action === 'end') {
      // End the session and calculate duration
      // First, get the session start time
      const session = await db.prepare(
        'SELECT session_start_ms, last_activity_ms FROM user_sessions WHERE id = ?'
      ).bind(session_id).first();

      if (!session) {
        return jsonResponse({ error: 'Session not found' }, 404);
      }

      // Use last_activity_ms if available, otherwise use now
      const endTime = session.last_activity_ms || now;
      const durationSeconds = Math.floor((endTime - session.session_start_ms) / 1000);

      const result = await db.prepare(
        `UPDATE user_sessions 
         SET session_end_ms = ?, 
             total_duration_seconds = ?,
             updated_at = ?
         WHERE id = ?`
      ).bind(endTime, durationSeconds, nowSeconds, session_id).run();

      if (!result.success) {
        console.error('Database error:', result.error);
        return jsonResponse({ error: 'Failed to end session' }, 500);
      }

      return jsonResponse({
        success: true,
        session_id: session_id,
        session_end_ms: endTime,
        total_duration_seconds: durationSeconds,
      });
    }
  } catch (error) {
    console.error('Session tracking error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

// GET /api/user-sessions - Get session statistics
async function handleGet(context) {
  const { request, env } = context;

  try {
    const db = getD1Database(env);
    const url = new URL(request.url);
    
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const days = url.searchParams.get('days');
    const userId = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Build WHERE clause
    let whereConditions = [];
    let bindParams = [];
    
    if (date) {
      const startTimestamp = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000);
      whereConditions.push('session_start_ms >= ? AND session_start_ms <= ?');
      bindParams.push(startTimestamp * 1000, endTimestamp * 1000);
    } else if (startDate && endDate) {
      const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000);
      whereConditions.push('session_start_ms >= ? AND session_start_ms <= ?');
      bindParams.push(startTimestamp * 1000, endTimestamp * 1000);
    } else if (days) {
      const daysAgo = parseInt(days, 10);
      const cutoffTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
      whereConditions.push('session_start_ms > ?');
      bindParams.push(cutoffTimestamp);
    } else {
      // Default: last 30 days
      const cutoffTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000);
      whereConditions.push('session_start_ms > ?');
      bindParams.push(cutoffTimestamp);
    }

    if (userId) {
      whereConditions.push('user_id = ?');
      bindParams.push(userId);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Get total sessions
    const totalQuery = `SELECT COUNT(*) as count FROM user_sessions ${whereClause}`;
    const totalResult = await (bindParams.length > 0
      ? db.prepare(totalQuery).bind(...bindParams).first()
      : db.prepare(totalQuery).first());
    const totalSessions = totalResult?.count || 0;

    // Get average session duration (only completed sessions)
    const avgDurationQuery = `SELECT 
      AVG(total_duration_seconds) as avg_duration,
      SUM(total_duration_seconds) as total_duration,
      COUNT(*) as completed_sessions
    FROM user_sessions ${whereClause} AND session_end_ms IS NOT NULL`;
    const avgDurationResult = await (bindParams.length > 0
      ? db.prepare(avgDurationQuery.replace(whereClause, whereClause + ' AND session_end_ms IS NOT NULL')).bind(...bindParams).first()
      : db.prepare(avgDurationQuery).first());

    // Get sessions by user
    const userSessionsQuery = `SELECT 
      user_id,
      COUNT(*) as session_count,
      AVG(total_duration_seconds) as avg_duration,
      SUM(total_duration_seconds) as total_duration
    FROM user_sessions ${whereClause} AND session_end_ms IS NOT NULL
    GROUP BY user_id
    ORDER BY total_duration DESC
    LIMIT ?`;
    const userSessions = await (bindParams.length > 0
      ? db.prepare(userSessionsQuery.replace(whereClause, whereClause + ' AND session_end_ms IS NOT NULL')).bind(...bindParams, limit).all()
      : db.prepare(userSessionsQuery).bind(limit).all());

    // Get daily session statistics
    const dailyQuery = `SELECT 
      DATE(datetime(session_start_ms / 1000, 'unixepoch')) as date,
      COUNT(*) as session_count,
      AVG(total_duration_seconds) as avg_duration,
      SUM(total_duration_seconds) as total_duration
    FROM user_sessions ${whereClause} AND session_end_ms IS NOT NULL
    GROUP BY date
    ORDER BY date DESC`;
    const dailySessions = await (bindParams.length > 0
      ? db.prepare(dailyQuery.replace(whereClause, whereClause + ' AND session_end_ms IS NOT NULL')).bind(...bindParams).all()
      : db.prepare(dailyQuery).all());

    // Get recent sessions
    const recentQuery = `SELECT 
      id,
      user_id,
      session_start_ms,
      session_end_ms,
      total_duration_seconds,
      page_views,
      datetime(session_start_ms / 1000, 'unixepoch') as start_time,
      datetime(session_end_ms / 1000, 'unixepoch') as end_time
    FROM user_sessions ${whereClause}
    ORDER BY session_start_ms DESC
    LIMIT ?`;
    const recentSessions = await (bindParams.length > 0
      ? db.prepare(recentQuery).bind(...bindParams, limit).all()
      : db.prepare(recentQuery).bind(limit).all());

    return jsonResponse({
      success: true,
      filters: {
        date: date || null,
        start_date: startDate || null,
        end_date: endDate || null,
        days: days || null,
        user_id: userId || null,
      },
      summary: {
        total_sessions: totalSessions,
        completed_sessions: avgDurationResult?.completed_sessions || 0,
        average_duration_seconds: avgDurationResult?.avg_duration 
          ? Math.round(avgDurationResult.avg_duration) 
          : 0,
        total_duration_seconds: avgDurationResult?.total_duration || 0,
        average_duration_minutes: avgDurationResult?.avg_duration 
          ? Math.round(avgDurationResult.avg_duration / 60 * 100) / 100 
          : 0,
      },
      statistics: {
        sessions_by_user: userSessions.results || [],
        daily_sessions: dailySessions.results || [],
        recent_sessions: recentSessions.results || [],
      },
    });
  } catch (error) {
    console.error('Session statistics error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

// Main handler
export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return createCORSResponse();
  }

  if (request.method === 'GET') {
    return handleGet(context);
  } else if (request.method === 'POST') {
    return handlePost(context);
  } else {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

