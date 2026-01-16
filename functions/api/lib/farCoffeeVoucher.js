import { generateUUID, getD1Database } from './d1.js';

// Demo voucher definition
export const FAR_COFFEE_VOUCHER_ID = 'far_coffee_rm10_demo';
export const FAR_COFFEE_MERCHANT_NAME = 'Far Coffee';
export const FAR_COFFEE_VALUE_RM = 10;
export const FAR_COFFEE_TOTAL_QTY = 5;
export const FAR_COFFEE_LOGO = 'images/logo/far-coffee.png';

/**
 * Compute "today 5:00 PM Malaysia Time (GMT+8)" as UTC epoch millis.
 * Malaysia time = UTC + 8, so 17:00 MYT == 09:00 UTC.
 */
export function malaysiaToday5pmUtcMs(nowUtcMs = Date.now()) {
  const MY_OFFSET_MS = 8 * 60 * 60 * 1000;
  const myNow = new Date(nowUtcMs + MY_OFFSET_MS);
  const y = myNow.getUTCFullYear();
  const m = myNow.getUTCMonth();
  const d = myNow.getUTCDate();
  // 17:00 MYT -> 09:00 UTC
  return Date.UTC(y, m, d, 9, 0, 0, 0);
}

/**
 * Get voucher from database. Returns null if voucher doesn't exist.
 * You must manually create vouchers in the database.
 */
async function getFarCoffeeVoucher(env) {
  const db = getD1Database(env);
  const row = await db
    .prepare(`SELECT id, expires_at_ms FROM vouchers WHERE id=?`)
    .bind(FAR_COFFEE_VOUCHER_ID)
    .first();
  
  if (!row) {
    return null;
  }
  
  return { voucherId: row.id, expiryMs: Number(row.expires_at_ms) };
}

/**
 * Expire any active Far Coffee vouchers past expiry and restock quantity.
 * Returns expiredCount.
 */
export async function expireFarCoffeeVouchers(env, nowMs = Date.now()) {
  const db = getD1Database(env);
  
  // Check if voucher exists
  const voucher = await getFarCoffeeVoucher(env);
  if (!voucher) {
    return { expiredCount: 0, expiryMs: 0 };
  }

  // Use a transactional batch + SQLite `changes()` so restock count matches exactly how many rows were expired.
  // This avoids relying on data-modifying CTEs/RETURNING behavior differences across D1 builds.
  const batchRes = await db.batch([
    db
      .prepare(
        `UPDATE user_vouchers
         SET status='expired', updated_at_ms=?
         WHERE voucher_id=?
           AND status='active'
           AND expired_at_ms <= ?`
      )
      .bind(nowMs, FAR_COFFEE_VOUCHER_ID, nowMs),
    db
      .prepare(
        `UPDATE vouchers
         SET remaining_qty = MIN(total_qty, remaining_qty + changes()),
             updated_at_ms=?
         WHERE id=?`
      )
      .bind(nowMs, FAR_COFFEE_VOUCHER_ID),
  ]);
  const expiredCount = Number(batchRes?.[0]?.meta?.changes || 0);

  return { expiredCount, expiryMs: voucher.expiryMs };
}

/**
 * Atomically issue a voucher:
 * - Only if remaining_qty > 0 AND before expiry.
 * - Decrements remaining_qty by 1.
 * - Inserts an active user_vouchers row.
 *
 * Returns:
 * - { won: true, userVoucher, remainingQty, expiryMs }
 * - { won: false, remainingQty, expiryMs, reason }
 */
export async function spinFarCoffeeVoucher(env, userId, nowMs = Date.now()) {
  const db = getD1Database(env);
  
  // Get voucher from database (must be created manually)
  const voucher = await getFarCoffeeVoucher(env);
  if (!voucher) {
    return {
      won: false,
      reason: 'voucher_not_found',
      remainingQty: 0,
      expiryMs: 0,
      message: 'Voucher not found. Please create the voucher in the database first.',
    };
  }
  
  const { expiryMs } = voucher;

  // Expire past vouchers first (restock)
  await expireFarCoffeeVouchers(env, nowMs);

  // Check if user already has an active voucher for this restaurant
  const existingVoucher = await db
    .prepare(
      `SELECT id FROM user_vouchers
       WHERE user_id = ? 
         AND voucher_id = ?
         AND status = 'active'`
    )
    .bind(String(userId), FAR_COFFEE_VOUCHER_ID)
    .first();

  if (existingVoucher) {
    return {
      won: false,
      reason: 'already_has_voucher',
      remainingQty: 0,
      expiryMs,
      message: 'You already have an active voucher for this restaurant. Only one voucher per restaurant is allowed.',
    };
  }

  if (nowMs >= expiryMs) {
    const row = await db.prepare(`SELECT remaining_qty FROM vouchers WHERE id=?`).bind(FAR_COFFEE_VOUCHER_ID).first();
    return {
      won: false,
      reason: 'expired',
      remainingQty: row?.remaining_qty ?? 0,
      expiryMs,
    };
  }

  const userVoucherId = generateUUID();
  const issuedAtMs = nowMs;

  // Atomic issue using D1 transactional batch + SQLite `changes()`.
  //
  // 1) decrement stock iff remaining_qty > 0 and not expired
  // 2) insert user voucher only if step (1) actually updated a row (changes() == 1)
  await db.batch([
    db
      .prepare(
        `UPDATE vouchers
         SET remaining_qty = remaining_qty - 1,
             updated_at_ms = ?
         WHERE id = ?
           AND remaining_qty > 0
           AND expires_at_ms > ?`
      )
      .bind(nowMs, FAR_COFFEE_VOUCHER_ID, nowMs),
    db
      .prepare(
        `INSERT INTO user_vouchers (
           id, user_id, voucher_id, status, issued_at_ms, expired_at_ms, removed_at_ms, updated_at_ms
         )
         SELECT
           ?, ?, ?, 'active', ?, (SELECT expires_at_ms FROM vouchers WHERE id=?), NULL, ?
         WHERE changes() = 1`
      )
      .bind(
        userVoucherId,
        String(userId),
        FAR_COFFEE_VOUCHER_ID,
        issuedAtMs,
        FAR_COFFEE_VOUCHER_ID,
        nowMs
      ),
  ]);

  const after = await db
    .prepare(`SELECT remaining_qty, expires_at_ms FROM vouchers WHERE id=?`)
    .bind(FAR_COFFEE_VOUCHER_ID)
    .first();

  const uv = await db
    .prepare(
      `SELECT id FROM user_vouchers
       WHERE id=? AND user_id=? AND voucher_id=? AND status='active'`
    )
    .bind(userVoucherId, String(userId), FAR_COFFEE_VOUCHER_ID)
    .first();

  const issued = Boolean(uv?.id);
  if (!issued) {
    return {
      won: false,
      reason: 'sold_out',
      remainingQty: Number(after?.remaining_qty ?? 0),
      expiryMs: Number(after?.expires_at_ms ?? expiryMs),
    };
  }

  return {
    won: true,
    remainingQty: Number(after?.remaining_qty ?? 0),
    expiryMs: Number(after?.expires_at_ms ?? expiryMs),
    userVoucher: {
      id: userVoucherId,
      user_id: String(userId),
      voucher_id: FAR_COFFEE_VOUCHER_ID,
      merchant_name: FAR_COFFEE_MERCHANT_NAME,
      value_rm: FAR_COFFEE_VALUE_RM,
      logo: FAR_COFFEE_LOGO,
      status: 'active',
      expired_at_ms: Number(after?.expires_at_ms ?? expiryMs),
      issued_at_ms: issuedAtMs,
    },
  };
}

/**
 * Remove (release) an active voucher and restock by +1.
 */
export async function removeFarCoffeeUserVoucher(env, userId, userVoucherId, nowMs = Date.now()) {
  const db = getD1Database(env);

  // Expire past vouchers first (restock)
  await expireFarCoffeeVouchers(env, nowMs);

  const batchRes = await db.batch([
    db
      .prepare(
        `UPDATE user_vouchers
         SET status='removed',
             removed_at_ms=?,
             updated_at_ms=?
         WHERE id=?
           AND user_id=?
           AND voucher_id=?
           AND status='active'`
      )
      .bind(nowMs, nowMs, String(userVoucherId), String(userId), FAR_COFFEE_VOUCHER_ID),
    db
      .prepare(
        `UPDATE vouchers
         SET remaining_qty = MIN(total_qty, remaining_qty + changes()),
             updated_at_ms=?
         WHERE id=?`
      )
      .bind(nowMs, FAR_COFFEE_VOUCHER_ID),
  ]);
  const released = Number(batchRes?.[0]?.meta?.changes || 0) > 0;

  const row = await db
    .prepare(`SELECT remaining_qty FROM vouchers WHERE id=?`)
    .bind(FAR_COFFEE_VOUCHER_ID)
    .first();

  return {
    released,
    remainingQty: Number(row?.remaining_qty ?? 0),
  };
}

export async function listFarCoffeeUserVouchers(env, userId, nowMs = Date.now()) {
  const db = getD1Database(env);
  
  // Get voucher from database (must be created manually)
  const voucher = await getFarCoffeeVoucher(env);
  if (!voucher) {
    // Return empty list if voucher doesn't exist
    return {
      vouchers: [],
      expiryMs: 0,
    };
  }
  
  const { expiryMs } = voucher;
  await expireFarCoffeeVouchers(env, nowMs);

  const res = await db
    .prepare(
      `SELECT
         uv.id,
         uv.user_id,
         uv.voucher_id,
         uv.status,
         uv.issued_at_ms,
         uv.expired_at_ms,
         uv.removed_at_ms,
         v.merchant_name,
         v.value_rm
       FROM user_vouchers uv
       JOIN vouchers v ON v.id = uv.voucher_id
       WHERE uv.user_id = ?
         AND uv.voucher_id = ?
       ORDER BY uv.issued_at_ms DESC`
    )
    .bind(String(userId), FAR_COFFEE_VOUCHER_ID)
    .all();

  return {
    vouchers: (res?.results || []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      voucher_id: r.voucher_id,
      status: r.status,
      issued_at_ms: r.issued_at_ms,
      expired_at_ms: r.expired_at_ms,
      removed_at_ms: r.removed_at_ms,
      merchant_name: r.merchant_name,
      value_rm: r.value_rm,
      logo: FAR_COFFEE_LOGO,
    })),
    expiryMs,
  };
}


