import { jsonResponse } from '../lib/cors.js';

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function requireAdmin(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return jsonResponse(
      {
        error: 'Admin token not configured',
        message: 'Set ADMIN_TOKEN in Cloudflare Pages environment variables.',
      },
      500
    );
  }

  const token = getBearerToken(request);
  if (!token || token !== expected) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  return null;
}


