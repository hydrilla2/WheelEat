// POST /api/admin/vouchers/revoke
// Body: { user_voucher_id: string }
// Marks voucher as removed and RESTOCKS +1 (if it was active).

import { createCORSResponse, jsonResponse } from '../../lib/cors.js';
import { getD1Database } from '../../lib/d1.js';
import { requireAdmin } from '../_auth.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return createCORSResponse();
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'Invalid JSON in request body' }, 400);
  }

  const userVoucherId = body?.user_voucher_id;
  if (!userVoucherId) return jsonResponse({ detail: 'user_voucher_id is required' }, 400);

  try {
    if (!env.DB) return jsonResponse({ error: 'Database not configured' }, 500);
    const db = getD1Database(env);
    const nowMs = Date.now();

    const row = await db
      .prepare(`SELECT voucher_id FROM user_vouchers WHERE id=?`)
      .bind(String(userVoucherId))
      .first();
    if (!row?.voucher_id) return jsonResponse({ ok: false, message: 'Voucher not found' }, 404);

    const batchRes = await db.batch([
      db
        .prepare(
          `UPDATE user_vouchers
           SET status='removed', removed_at_ms=?, updated_at_ms=?
           WHERE id=? AND status='active'`
        )
        .bind(nowMs, nowMs, String(userVoucherId)),
      db
        .prepare(
          `UPDATE vouchers
           SET remaining_qty = MIN(total_qty, remaining_qty + changes()),
               updated_at_ms=?
           WHERE id=?`
        )
        .bind(nowMs, String(row.voucher_id)),
    ]);

    const released = Number(batchRes?.[0]?.meta?.changes || 0) > 0;
    return jsonResponse({ ok: true, released });
  } catch (e) {
    console.error('Admin revoke error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}


