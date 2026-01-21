// POST /api/vouchers/spin
// Claim a voucher for a specific restaurant (5 total per restaurant, expires 24h after claim).

import { createCORSResponse, jsonResponse } from '../lib/cors.js';
import { claimVoucher } from '../lib/voucherSystem.js';

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
  const merchantName = body?.merchant_name || body?.restaurant_name;
  const merchantLogo = body?.merchant_logo || body?.logo || null;
  const valueRm = body?.value_rm;
  const minSpendRm = body?.min_spend_rm;
  if (!userId) return jsonResponse({ detail: 'user_id is required' }, 400);
  if (isGuestUserId(userId)) return jsonResponse({ detail: 'Google login required to claim vouchers' }, 401);
  if (!merchantName) return jsonResponse({ detail: 'merchant_name is required' }, 400);

  try {
    // Check if DB binding exists
    if (!env.DB) {
      console.error('Missing D1 database binding. env.DB is undefined.');
      return jsonResponse({ 
        error: 'Database not configured', 
        message: 'D1 database binding is missing. Please configure it in Cloudflare Pages Settings > Functions > D1 Database bindings.',
        hint: 'Variable name should be "DB" and database should be "wheeleat-db"'
      }, 500);
    }

    const nowMs = Date.now();
    const out = await claimVoucher(env, {
      userId: String(userId),
      merchantName: String(merchantName),
      merchantLogo: merchantLogo ? String(merchantLogo) : null,
      valueRm: valueRm === undefined || valueRm === null ? undefined : Number(valueRm),
      minSpendRm: minSpendRm === undefined || minSpendRm === null ? undefined : Number(minSpendRm),
      nowMs,
    });
    return jsonResponse(out);
  } catch (e) {
    console.error('Voucher spin error:', e);
    console.error('Error stack:', e.stack);
    return jsonResponse({ 
      error: 'Internal server error', 
      message: e.message,
      hint: e.message?.includes('Missing D1 database binding') 
        ? 'Please configure D1 database binding in Cloudflare Pages Settings > Functions'
        : 'Check Cloudflare Pages logs for more details'
    }, 500);
  }
}


