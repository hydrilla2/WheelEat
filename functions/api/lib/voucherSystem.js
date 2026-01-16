import { generateUUID, getD1Database } from './d1.js';

// Demo configuration
export const DEFAULT_VOUCHER_VALUE_RM = 5;
export const DEFAULT_MIN_SPEND_RM = 30;
export const DEFAULT_TOTAL_QTY_PER_RESTAURANT = 5;
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function voucherTypeIdForRestaurant(merchantName) {
  const slug = slugify(merchantName);
  return `voucher_${slug || 'restaurant'}`;
}

/**
 * Ensure a voucher "type" row exists for a merchant.
 * Stock is per-merchant (5 total, 5 remaining by default).
 */
export async function ensureVoucherForMerchant(
  env,
  merchantName,
  nowMs = Date.now(),
  merchantLogo = null,
  valueRm = DEFAULT_VOUCHER_VALUE_RM,
  minSpendRm = DEFAULT_MIN_SPEND_RM
) {
  const db = getD1Database(env);
  const voucherId = voucherTypeIdForRestaurant(merchantName);

  await db
    .prepare(
      `INSERT INTO vouchers (
         id, merchant_name, merchant_logo, value_rm, min_spend_rm, total_qty, remaining_qty, created_at_ms, updated_at_ms
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         merchant_name = excluded.merchant_name,
         merchant_logo = COALESCE(excluded.merchant_logo, vouchers.merchant_logo),
         value_rm = excluded.value_rm,
         min_spend_rm = excluded.min_spend_rm,
         total_qty = excluded.total_qty,
         updated_at_ms = excluded.updated_at_ms`
    )
    .bind(
      voucherId,
      String(merchantName),
      merchantLogo ? String(merchantLogo) : null,
      Number(valueRm),
      Number(minSpendRm),
      DEFAULT_TOTAL_QTY_PER_RESTAURANT,
      DEFAULT_TOTAL_QTY_PER_RESTAURANT,
      nowMs,
      nowMs
    )
    .run();

  return voucherId;
}

/**
 * Expire any active user vouchers that are past expired_at_ms.
 * For each expired voucher, restock the corresponding voucher type by +1 (capped to total_qty).
 * This is intentionally simple and safe for D1 (no advanced RETURNING usage).
 */
export async function expireDueVouchers(env, nowMs = Date.now(), limit = 200) {
  const db = getD1Database(env);

  const due = await db
    .prepare(
      `SELECT id, voucher_id
       FROM user_vouchers
       WHERE status='active' AND expired_at_ms <= ?
       LIMIT ?`
    )
    .bind(nowMs, limit)
    .all();

  const rows = due?.results || [];
  let expired = 0;

  for (const r of rows) {
    // Transactional: expire the user voucher, and restock only if the status was updated.
    const batchRes = await db.batch([
      db
        .prepare(
          `UPDATE user_vouchers
           SET status='expired', updated_at_ms=?
           WHERE id=? AND status='active'`
        )
        .bind(nowMs, r.id),
      db
        .prepare(
          `UPDATE vouchers
           SET remaining_qty = MIN(total_qty, remaining_qty + changes()),
               updated_at_ms=?
           WHERE id=?`
        )
        .bind(nowMs, r.voucher_id),
    ]);

    if (Number(batchRes?.[0]?.meta?.changes || 0) > 0) expired += 1;
  }

  return { expired };
}

/**
 * Claim (issue) a voucher for a specific restaurant/merchant.
 * - Stock decremented atomically (never below 0).
 * - User voucher expires 24 hours from claim.
 * - Only one active voucher per user per restaurant (optional, but keeps UX sane).
 */
export async function claimVoucher(env, { userId, merchantName, merchantLogo = null, valueRm = DEFAULT_VOUCHER_VALUE_RM, minSpendRm = DEFAULT_MIN_SPEND_RM, nowMs = Date.now() }) {
  const db = getD1Database(env);
  await expireDueVouchers(env, nowMs);

  const voucherId = await ensureVoucherForMerchant(env, merchantName, nowMs, merchantLogo, valueRm, minSpendRm);

  // Prevent duplicate active voucher per user+merchant
  const existing = await db
    .prepare(
      `SELECT id
       FROM user_vouchers
       WHERE user_id=? AND voucher_id=? AND status='active'
       LIMIT 1`
    )
    .bind(String(userId), voucherId)
    .first();

  if (existing?.id) {
    return {
      won: false,
      reason: 'already_has_voucher',
      message: 'You already have an active voucher for this restaurant.',
    };
  }

  const issuedAtMs = nowMs;
  const expiredAtMs = nowMs + DEFAULT_TTL_MS;
  const userVoucherId = generateUUID(); // unique voucher id (per issued voucher)

  // Atomic decrement then insert.
  await db.batch([
    db
      .prepare(
        `UPDATE vouchers
         SET remaining_qty = remaining_qty - 1,
             updated_at_ms = ?
         WHERE id = ?
           AND remaining_qty > 0`
      )
      .bind(nowMs, voucherId),
    db
      .prepare(
        `INSERT INTO user_vouchers (
           id, user_id, voucher_id, status, issued_at_ms, expired_at_ms, removed_at_ms, used_at_ms, updated_at_ms
         )
         SELECT
           ?, ?, ?, 'active', ?, ?, NULL, NULL, ?
         WHERE changes() = 1`
      )
      .bind(userVoucherId, String(userId), voucherId, issuedAtMs, expiredAtMs, nowMs),
  ]);

  // Check if inserted
  const uv = await db
    .prepare(`SELECT id FROM user_vouchers WHERE id=? AND user_id=? AND voucher_id=? AND status='active'`)
    .bind(userVoucherId, String(userId), voucherId)
    .first();

  if (!uv?.id) {
    const left = await db.prepare(`SELECT remaining_qty FROM vouchers WHERE id=?`).bind(voucherId).first();
    return {
      won: false,
      reason: 'sold_out',
      remainingQty: Number(left?.remaining_qty ?? 0),
    };
  }

  const left = await db.prepare(`SELECT remaining_qty FROM vouchers WHERE id=?`).bind(voucherId).first();
  return {
    won: true,
    remainingQty: Number(left?.remaining_qty ?? 0),
    userVoucher: {
      id: userVoucherId,
      user_id: String(userId),
      voucher_id: voucherId,
      merchant_name: String(merchantName),
      merchant_logo: merchantLogo ? String(merchantLogo) : null,
      value_rm: Number(valueRm),
      min_spend_rm: Number(minSpendRm),
      status: 'active',
      issued_at_ms: issuedAtMs,
      expired_at_ms: expiredAtMs,
    },
  };
}

/**
 * Remove a voucher (restock +1).
 */
export async function removeUserVoucher(env, { userId, userVoucherId, nowMs = Date.now() }) {
  const db = getD1Database(env);
  await expireDueVouchers(env, nowMs);

  // Fetch voucher_id for restock
  const row = await db
    .prepare(`SELECT voucher_id FROM user_vouchers WHERE id=? AND user_id=?`)
    .bind(String(userVoucherId), String(userId))
    .first();

  if (!row?.voucher_id) return { ok: false, released: false };

  const batchRes = await db.batch([
    db
      .prepare(
        `UPDATE user_vouchers
         SET status='removed', removed_at_ms=?, updated_at_ms=?
         WHERE id=? AND user_id=? AND status='active'`
      )
      .bind(nowMs, nowMs, String(userVoucherId), String(userId)),
    db
      .prepare(
        `UPDATE vouchers
         SET remaining_qty = MIN(total_qty, remaining_qty + changes()),
             updated_at_ms=?
         WHERE id=?`
      )
      .bind(nowMs, row.voucher_id),
  ]);

  const released = Number(batchRes?.[0]?.meta?.changes || 0) > 0;
  return { ok: true, released };
}

/**
 * Mark voucher as used (no restock).
 * After used, it should disappear from inventory (frontend filters active).
 */
export async function useUserVoucher(env, { userId, userVoucherId, nowMs = Date.now() }) {
  const db = getD1Database(env);
  await expireDueVouchers(env, nowMs);

  const res = await db
    .prepare(
      `UPDATE user_vouchers
       SET status='used', used_at_ms=?, updated_at_ms=?
       WHERE id=? AND user_id=? AND status='active'`
    )
    .bind(nowMs, nowMs, String(userVoucherId), String(userId))
    .run();

  return { ok: true, used: Boolean(res?.meta?.changes) };
}

export async function listUserVouchers(env, { userId, nowMs = Date.now() }) {
  const db = getD1Database(env);
  await expireDueVouchers(env, nowMs);

  const res = await db
    .prepare(
      `SELECT uv.id, uv.user_id, uv.voucher_id, uv.status,
              uv.issued_at_ms, uv.expired_at_ms, uv.removed_at_ms, uv.used_at_ms,
              v.merchant_name, v.merchant_logo, v.value_rm, v.min_spend_rm
       FROM user_vouchers uv
       JOIN vouchers v ON v.id = uv.voucher_id
       WHERE uv.user_id = ?
       ORDER BY uv.issued_at_ms DESC`
    )
    .bind(String(userId))
    .all();

  return { vouchers: res?.results || [] };
}


