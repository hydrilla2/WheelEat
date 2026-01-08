// GET /api/users - Get all users
// POST /api/users - Create or update a user (for Google login)

import { getD1Database, generateUUID, getCurrentTimestamp } from './lib/d1.js';
import { createCORSResponse, jsonResponse } from './lib/cors.js';

// GET /api/users - Get all users
export async function onRequestGet(context) {
  const { request, env } = context;

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return createCORSResponse();
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

// POST /api/users - Create or update a user (upsert)
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

    // Validate required fields
    if (!body.id) {
      return jsonResponse({
        error: 'Missing required fields',
        message: '"id" is required',
      }, 400);
    }

    // Email is optional (for anonymous users)
    // If email is provided, it's a Google user; if not, it's an anonymous user
    // Also check if ID starts with 'anon_' to identify anonymous users
    const isAnonymous = !body.email || body.id.startsWith('anon_');

    const db = getD1Database(env);
    const timestamp = getCurrentTimestamp();

    // Check if user already exists
    // For anonymous users, only check by ID; for Google users, check by ID or email
    const existingUser = isAnonymous
      ? await db.prepare('SELECT * FROM users WHERE id = ?').bind(body.id).first()
      : await db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').bind(body.id, body.email).first();

    if (existingUser) {
      // Update existing user
      if (isAnonymous) {
        // Anonymous users: only update name and timestamp
        const result = await db.prepare(
          `UPDATE users 
           SET name = ?, updated_at = ?
           WHERE id = ?`
        ).bind(
          body.name || existingUser.name || 'Guest User',
          timestamp,
          body.id
        ).run();

        if (!result.success) {
          console.error('Database update error:', result.error);
          return jsonResponse({
            error: 'Database error',
            message: result.error?.message || 'Failed to update user',
          }, 500);
        }
      } else {
        // Google users: update name, email, and timestamp
        const result = await db.prepare(
          `UPDATE users 
           SET name = ?, email = ?, updated_at = ?
           WHERE id = ? OR email = ?`
        ).bind(
          body.name || existingUser.name,
          body.email,
          timestamp,
          body.id,
          body.email
        ).run();

        if (!result.success) {
          console.error('Database update error:', result.error);
          return jsonResponse({
            error: 'Database error',
            message: result.error?.message || 'Failed to update user',
          }, 500);
        }
      }

      // Fetch updated user
      const updatedUser = isAnonymous
        ? await db.prepare('SELECT * FROM users WHERE id = ?').bind(body.id).first()
        : await db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').bind(body.id, body.email).first();

      return jsonResponse({
        success: true,
        action: 'updated',
        user: updatedUser,
      });
    } else {
      // Insert new user
      if (isAnonymous) {
        // Anonymous users: email is NULL
        const result = await db.prepare(
          `INSERT INTO users (id, name, email, created_at, updated_at)
           VALUES (?, ?, NULL, ?, ?)`
        ).bind(
          body.id,
          body.name || 'Guest User',
          timestamp,
          timestamp
        ).run();

        if (!result.success) {
          console.error('Database insert error:', result.error);
          return jsonResponse({
            error: 'Database error',
            message: result.error?.message || 'Failed to create user',
          }, 500);
        }
      } else {
        // Google users: email is required
        if (!body.email) {
          return jsonResponse({
            error: 'Missing required fields',
            message: '"email" is required for authenticated users',
          }, 400);
        }

        const result = await db.prepare(
          `INSERT INTO users (id, name, email, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          body.id,
          body.name || 'User',
          body.email,
          timestamp,
          timestamp
        ).run();

        if (!result.success) {
          console.error('Database insert error:', result.error);
          return jsonResponse({
            error: 'Database error',
            message: result.error?.message || 'Failed to create user',
          }, 500);
        }
      }

      if (!result.success) {
        console.error('Database insert error:', result.error);
        return jsonResponse({
          error: 'Database error',
          message: result.error?.message || 'Failed to create user',
        }, 500);
      }

      // Fetch created user
      const newUser = await db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(body.id).first();

      return jsonResponse({
        success: true,
        action: 'created',
        user: newUser,
      });
    }
  } catch (error) {
    console.error('API error:', error);
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
