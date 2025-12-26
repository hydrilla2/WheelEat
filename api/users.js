// GET /api/users
// Example endpoint that connects to Supabase and returns data

import supabase from './lib/supabase.js';

async function handler(req, res) {

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query Supabase for users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(10); // Limit to 10 results for demo

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: error.message,
        hint: 'Make sure the "users" table exists in Supabase',
      });
    }

    return res.status(200).json({
      success: true,
      count: data ? data.length : 0,
      users: data || [],
    });
  } catch (error) {
    console.error('API error:', error);
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

