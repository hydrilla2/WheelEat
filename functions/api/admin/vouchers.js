// GET /api/admin/vouchers?status=active&user_id=...&limit=200&offset=0
// Admin list for user vouchers (token protected).

import { createCORSResponse, jsonResponse } from '../lib/cors.js';
import { getD1Database } from '../lib/d1.js';
import { requireAdmin } from './_auth.js';

function clampInt(x, { min, max, fallback }) {
  const n = Number.parseInt(String(x), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return createCORSResponse();
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;

  try {
    if (!env.DB) return jsonResponse({ error: 'Database not configured' }, 500);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('user_id');
    const q = (url.searchParams.get('q') || '').trim(); // match user_id or email
    const limit = clampInt(url.searchParams.get('limit'), { min: 1, max: 500, fallback: 200 });
    const offset = clampInt(url.searchParams.get('offset'), { min: 0, max: 100000, fallback: 0 });

    const where = [];
    const bind = [];

    if (status) {
      where.push(`uv.status = ?`);
      bind.push(status);
    }
    if (userId) {
      where.push(`uv.user_id = ?`);
      bind.push(userId);
    }
    if (q) {
      where.push(`(uv.user_id LIKE ? OR u.email LIKE ?)`);
      bind.push(`%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const db = getD1Database(env);

    const rows = await db
      .prepare(
        `SELECT
           uv.id            AS user_voucher_id,
           uv.user_id       AS user_id,
           u.email          AS user_email,
           uv.status        AS status,
           uv.issued_at_ms  AS issued_at_ms,
           uv.expired_at_ms AS expired_at_ms,
           uv.used_at_ms    AS used_at_ms,
           uv.removed_at_ms AS removed_at_ms,
           v.id             AS voucher_id,
           v.merchant_name  AS merchant_name,
           v.value_rm       AS value_rm,
           v.min_spend_rm   AS min_spend_rm
         FROM user_vouchers uv
         JOIN vouchers v ON v.id = uv.voucher_id
         LEFT JOIN users u ON u.id = uv.user_id
         ${whereSql}
         ORDER BY uv.issued_at_ms DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...bind, limit, offset)
      .all();

    return jsonResponse({
      vouchers: rows?.results || [],
      limit,
      offset,
    });
  } catch (e) {
    console.error('Admin vouchers list error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}


