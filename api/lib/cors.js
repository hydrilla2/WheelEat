// CORS helper for Vercel serverless functions
// This ensures CORS headers are ALWAYS set, even in error cases

export function setCORSHeaders(res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  } catch (error) {
    console.error('Error setting CORS headers:', error);
  }
}

export function handleOPTIONS(res) {
  setCORSHeaders(res);
  return res.status(200).end();
}

// Wrapper to ensure CORS headers are always set
export function withCORS(handler) {
  return async function(req, res) {
    // ALWAYS set CORS headers first
    setCORSHeaders(res);
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Call the actual handler
    try {
      return await handler(req, res);
    } catch (error) {
      // Ensure CORS headers are set even on error
      setCORSHeaders(res);
      console.error('Handler error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };
}

