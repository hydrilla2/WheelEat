// POST /api/vouchers/use
// Mark a user voucher as used (does NOT restock).

import { createCORSResponse, jsonResponse } from '../lib/cors.js';
import { useUserVoucher } from '../lib/voucherSystem.js';

function isGuestUserId(userId) {
  const s = String(userId || '');
  return s.startsWith('anon_');
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return createCORSResponse();
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'Invalid JSON in request body' }, 400);
  }

  const userId = body?.user_id;
  const userVoucherId = body?.user_voucher_id;
  if (!userId || !userVoucherId) {
    return jsonResponse({ detail: 'user_id and user_voucher_id are required' }, 400);
  }
  if (isGuestUserId(userId)) return jsonResponse({ detail: 'Google login required' }, 401);

  try {
    if (!env.DB) {
      return jsonResponse(
        {
          error: 'Database not configured',
          message:
            'D1 database binding is missing. Please configure it in Cloudflare Pages Settings > Functions > D1 Database bindings.',
          hint: 'Variable name should be "DB" and database should be "wheeleat-db"',
        },
        500
      );
    }

    const out = await useUserVoucher(env, { userId: String(userId), userVoucherId: String(userVoucherId), nowMs: Date.now() });
    return jsonResponse(out);
  } catch (e) {
    console.error('Voucher use error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}


