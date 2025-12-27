// GET /api/users
// Example endpoint that connects to D1 and returns data

import { getD1Database } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

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
    // Query D1 for users
    const db = getD1Database(env);
    const result = await db.prepare(
      'SELECT * FROM users LIMIT 10'
    ).all();

    if (!result.success) {
      console.error('Database error:', result.error);
      return jsonResponse({
        error: 'Database error',
        message: result.error?.message || 'Unknown error',
        hint: 'Make sure the "users" table exists in D1',
      }, 500);
    }

    return jsonResponse({
      success: true,
      count: result.results ? result.results.length : 0,
      users: result.results || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message,
    }, 500);
  }
}

