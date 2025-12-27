// D1 database utility for Cloudflare Pages Functions
// This file handles connecting to Cloudflare D1 database

// Helper function to get D1 database from environment
export function getD1Database(env) {
  const db = env.DB; // D1 database binding

  if (!db) {
    throw new Error(
      'Missing D1 database binding. ' +
      'Please bind the D1 database to your Pages project in Cloudflare dashboard.'
    );
  }

  return db;
}

// Helper function to generate UUID (for SQLite compatibility)
export function generateUUID() {
  return crypto.randomUUID();
}

// Helper function to get current timestamp as Unix epoch (integer)
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

