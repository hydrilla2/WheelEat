// POST /api/vouchers/transfer
// Transfer vouchers from guest user to Google user when guest signs in

import { createCORSResponse, jsonResponse } from '../lib/cors.js';
import { getD1Database } from '../lib/d1.js';

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

  const guestUserId = body?.guest_user_id;
  const googleUserId = body?.google_user_id;

  if (!guestUserId || !googleUserId) {
    return jsonResponse({ detail: 'guest_user_id and google_user_id are required' }, 400);
  }

  try {
    // Check if DB binding exists
    if (!env.DB) {
      console.error('Missing D1 database binding. env.DB is undefined.');
      return jsonResponse({ 
        error: 'Database not configured', 
        message: 'D1 database binding is missing.',
      }, 500);
    }

    const db = getD1Database(env);

    console.log('Transferring vouchers:', { guestUserId, googleUserId });

    // Get all active vouchers for the guest user
    const guestVouchers = await db
      .prepare(
        `SELECT id, voucher_id, status, issued_at_ms, expired_at_ms, removed_at_ms, updated_at_ms
         FROM user_vouchers
         WHERE user_id = ? AND status = 'active'`
      )
      .bind(String(guestUserId))
      .all();

    console.log(`Found ${guestVouchers.results?.length || 0} active vouchers for guest user`);

    if (!guestVouchers.results || guestVouchers.results.length === 0) {
      return jsonResponse({
        success: true,
        transferred: 0,
        message: 'No active vouchers to transfer',
      });
    }

    const transferred = [];
    const errors = [];

    // Transfer each voucher to Google user
    for (const voucher of guestVouchers.results) {
      try {
        // Check if Google user already has this voucher
        const existing = await db
          .prepare(
            `SELECT id FROM user_vouchers
             WHERE user_id = ? AND voucher_id = ? AND status = 'active'`
          )
          .bind(String(googleUserId), voucher.voucher_id)
          .first();

        if (existing) {
          // Google user already has this voucher, just remove the guest voucher
          await db
            .prepare(
              `UPDATE user_vouchers
               SET status = 'removed',
                   removed_at_ms = ?,
                   updated_at_ms = ?
               WHERE id = ?`
            )
            .bind(Date.now(), Date.now(), voucher.id)
            .run();
          transferred.push({ voucher_id: voucher.voucher_id, action: 'removed_duplicate' });
        } else {
          // Transfer voucher to Google user
          await db
            .prepare(
              `UPDATE user_vouchers
               SET user_id = ?,
                   updated_at_ms = ?
               WHERE id = ?`
            )
            .bind(String(googleUserId), Date.now(), voucher.id)
            .run();
          transferred.push({ voucher_id: voucher.voucher_id, action: 'transferred' });
        }
      } catch (e) {
        console.error(`Error transferring voucher ${voucher.id}:`, e);
        errors.push({ voucher_id: voucher.voucher_id, error: e.message });
      }
    }

    return jsonResponse({
      success: true,
      transferred: transferred.length,
      vouchers: transferred,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    console.error('Voucher transfer error:', e);
    return jsonResponse({ error: 'Internal server error', message: e.message }, 500);
  }
}

