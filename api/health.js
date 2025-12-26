// GET /api/health
// Simple health check endpoint to verify the API is working

async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      status: 'ok',
      message: 'WheelEat API is running',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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

