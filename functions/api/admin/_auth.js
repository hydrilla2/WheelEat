import { jsonResponse } from '../lib/cors.js';

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

const DEFAULT_ADMIN_EMAIL = 'ybtan6666@gmail.com';

async function verifyGoogleAccessToken(accessToken) {
  // Validates the token by calling Google UserInfo endpoint.
  // This ensures the caller can't spoof email from the client.
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data && typeof data.email === 'string' ? data : null;
}

export async function requireAdmin(request, env) {
  const token = getBearerToken(request);
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  // Back-compat: if ADMIN_TOKEN is set, accept it (optional).
  const expected = env.ADMIN_TOKEN;
  if (expected && token === expected) return null;

  // No shared secret: verify Google token and email allowlist.
  const info = await verifyGoogleAccessToken(token);
  if (!info) return jsonResponse({ error: 'Unauthorized' }, 401);

  const email = String(info.email || '').toLowerCase();
  const allowed = (env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const emailVerified = info.email_verified === true || info.email_verified === 'true';

  if (!emailVerified) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (email !== allowed) return jsonResponse({ error: 'Forbidden' }, 403);

  return null;
}


