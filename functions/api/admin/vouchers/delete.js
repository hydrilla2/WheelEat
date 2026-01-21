// POST /api/admin/vouchers/delete
// Body: { user_voucher_id: string }
// Deletes a user_vouchers row WITHOUT restocking (delete forever).

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

    const row = await db
      .prepare(`SELECT voucher_id, code FROM user_vouchers WHERE id=?`)
      .bind(String(userVoucherId))
      .first();
    if (!row?.voucher_id) return jsonResponse({ ok: false, message: 'Voucher not found' }, 404);

    // Delete forever (SOFT delete):
    // - Disable the code so it can never be re-issued.
    // - Mark the user voucher as removed (so it disappears from user inventory).
    // - Do NOT restock.
    const nowMs = Date.now();
    const batchRes = await db.batch([
      db
        .prepare(
          `UPDATE voucher_codes
           SET status='disabled',
               assigned_user_voucher_id=NULL,
               updated_at_ms=?
           WHERE code=?
             AND voucher_id=?`
        )
        .bind(nowMs, row.code, String(row.voucher_id)),
      db
        .prepare(
          `UPDATE user_vouchers
           SET status='removed', removed_at_ms=COALESCE(removed_at_ms, ?), updated_at_ms=?
           WHERE id=?`
        )
        .bind(nowMs, nowMs, String(userVoucherId)),
    ]);

    const updated = Number(batchRes?.[1]?.meta?.changes || 0) > 0;
    return jsonResponse({ ok: true, deleted: updated });
  } catch (e) {
    console.error('Admin delete error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}


