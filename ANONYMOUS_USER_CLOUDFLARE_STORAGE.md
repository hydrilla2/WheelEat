# Anonymous User ID Storage on Cloudflare

## Overview

Anonymous user IDs are now stored in **both**:
1. **localStorage** (client-side) - For immediate access and persistence across browser sessions
2. **Cloudflare D1 Database** (server-side) - For analytics, tracking, and server-side operations

## How It Works

### Client-Side (localStorage)
- Anonymous ID is generated and stored in `localStorage` when user first visits
- Key: `wheeleat_anon_user_id`
- Format: `anon_xxxxx_timestamp`
- Persists across browser sessions

### Server-Side (Cloudflare D1)
- Anonymous ID is automatically registered in D1 database when first created
- Stored in `users` table with `email = NULL`
- Tracked for analytics and session management

## Database Schema

The `users` table supports both authenticated and anonymous users:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  -- Google ID or anon_xxx
  name TEXT NOT NULL,
  email TEXT,  -- NULL for anonymous, required for Google
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Implementation Details

### 1. Frontend: `frontend/src/utils/userId.js`
- `getOrCreateAnonymousId()` - Creates ID in localStorage and registers in D1
- Automatically calls `registerAnonymousUser()` API when ID is first created
- Uses `wheeleat_anon_registered` flag to prevent duplicate registrations

### 2. API: `functions/api/users.js`
- Updated to accept users without email (anonymous users)
- Detects anonymous users by checking if `id` starts with `anon_` or if `email` is missing
- Stores anonymous users with `email = NULL`

### 3. API Service: `frontend/src/services/api.js`
- `registerAnonymousUser(anonId)` - Registers anonymous ID in D1 database
- Called automatically when anonymous ID is first created

## Setup Instructions

### 1. Update D1 Database Schema

Run this SQL in your D1 database to support anonymous users:

```bash
npx wrangler d1 execute wheeleat-db --remote --file=./functions/sql/users_schema_d1.sql
```

Or manually execute:

```sql
-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,  -- NULL allowed for anonymous users
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- If table exists with NOT NULL email, alter it
-- Note: SQLite doesn't support ALTER COLUMN, so you may need to recreate
-- For existing tables, you can skip this if email is already nullable
```

### 2. Verify Setup

Check that anonymous users can be created:

```bash
# Test creating an anonymous user
curl -X POST https://wheeleat-xp5.pages.dev/api/users \
  -H "Content-Type: application/json" \
  -d '{"id":"anon_test123","name":"Guest User"}'
```

## User Flow

### Anonymous User Journey

1. **First Visit:**
   - User visits site → Anonymous ID generated: `anon_abc123_1234567890`
   - Stored in `localStorage` as `wheeleat_anon_user_id`
   - Automatically registered in D1 database via API call
   - Flag set: `wheeleat_anon_registered = true`

2. **Subsequent Visits:**
   - Anonymous ID retrieved from `localStorage`
   - No need to re-register (already in D1)

3. **Session Tracking:**
   - All sessions tracked with anonymous ID
   - Stored in `user_sessions` table with `user_id = anon_abc123_1234567890`

4. **Google Login:**
   - User logs in with Google → Gets Google ID: `113988698670144743473`
   - New sessions tracked with Google ID
   - Anonymous sessions remain linked to anonymous ID

## Benefits

### ✅ Dual Storage
- **localStorage**: Fast, immediate access, works offline
- **D1 Database**: Server-side tracking, analytics, cross-device (if needed)

### ✅ Automatic Registration
- No manual intervention needed
- Anonymous IDs automatically registered in Cloudflare
- Prevents duplicate registrations

### ✅ Analytics Ready
- All anonymous users tracked in database
- Can query anonymous vs. authenticated user behavior
- Session tracking works for both user types

## Querying Anonymous Users

### Count anonymous users
```sql
SELECT COUNT(*) FROM users WHERE email IS NULL;
```

### Get all anonymous users
```sql
SELECT * FROM users WHERE email IS NULL ORDER BY created_at DESC;
```

### Anonymous user sessions
```sql
SELECT * FROM user_sessions 
WHERE user_id LIKE 'anon_%' 
ORDER BY session_start_ms DESC;
```

### Compare anonymous vs authenticated
```sql
SELECT 
  CASE 
    WHEN email IS NULL THEN 'anonymous'
    ELSE 'authenticated'
  END as user_type,
  COUNT(*) as user_count,
  AVG((SELECT COUNT(*) FROM user_sessions WHERE user_sessions.user_id = users.id)) as avg_sessions
FROM users
GROUP BY user_type;
```

## Troubleshooting

### Anonymous ID not registering
- Check browser console for API errors
- Verify D1 database binding is configured
- Check network tab for `/api/users` POST requests

### Duplicate registrations
- The `wheeleat_anon_registered` flag prevents duplicates
- If flag is lost, registration will retry (idempotent - safe to retry)

### Email constraint errors
- Ensure `users` table allows NULL email
- Run the schema migration if needed

## Summary

Anonymous user IDs are now:
- ✅ Stored in **localStorage** (client-side persistence)
- ✅ Registered in **Cloudflare D1** (server-side tracking)
- ✅ Automatically synced when first created
- ✅ Tracked for analytics and session management
- ✅ Ready for cross-device tracking (if needed in future)

This provides the best of both worlds: fast client-side access and reliable server-side tracking on Cloudflare.

