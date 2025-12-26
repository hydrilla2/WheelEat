// GET /api/users
// Example endpoint that connects to Supabase and returns data

import supabase from './lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

