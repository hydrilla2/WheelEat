// GET /api/vouchers/stocks?merchant_names=[...]
// Returns remaining voucher stock for one or more merchants.

import { createCORSResponse, jsonResponse } from '../lib/cors.js';
import { getD1Database } from '../lib/d1.js';
import { ensureVoucherForMerchant, voucherTypeIdForRestaurant } from '../lib/voucherSystem.js';

function parseMerchantNames(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s));
  } catch {
    // fall through
  }
  // fallback: comma-separated
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return createCORSResponse();
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

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

    const url = new URL(request.url);
    const names = parseMerchantNames(url.searchParams.get('merchant_names')).slice(0, 25);
    if (names.length === 0) return jsonResponse({ stocks: {} });

    const db = getD1Database(env);
    const nowMs = Date.now();

    const stocks = {};
    for (const merchantName of names) {
      // Ensure voucher row exists (does not reset remaining_qty for existing rows).
      await ensureVoucherForMerchant(env, merchantName, nowMs);
      const voucherId = voucherTypeIdForRestaurant(merchantName);
      const row = await db
        .prepare(`SELECT remaining_qty, total_qty, value_rm, min_spend_rm FROM vouchers WHERE id=?`)
        .bind(voucherId)
        .first();
      stocks[merchantName] = {
        remaining_qty: Number(row?.remaining_qty ?? 0),
        total_qty: Number(row?.total_qty ?? 0),
        value_rm: Number(row?.value_rm ?? 0),
        min_spend_rm: Number(row?.min_spend_rm ?? 0),
      };
    }

    const res = jsonResponse({ stocks });
    // Prevent any caching (browser, intermediary proxies, Cloudflare edge)
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    return res;
  } catch (e) {
    console.error('Voucher stocks error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}


