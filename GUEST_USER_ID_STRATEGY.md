# Guest User ID Strategy

## Problem Statement

**Question:** Should guest users be given a `user_id`? Will it be different if a user logs in with Google?

**Answer:** Yes, guests should have a consistent `user_id`, and it should be different (but linkable) when they log in with Google.

## Solution Overview

### 1. Persistent Anonymous ID
- **Every visitor** gets a persistent anonymous ID stored in `localStorage`
- Format: `anon_xxxxx_timestamp`
- Created on first visit, reused across sessions
- Persists even if user never clicks "Continue as Guest"

### 2. Guest Login
- When user clicks "Continue as Guest", they use the same persistent anonymous ID
- No new ID is generated
- Ensures consistent tracking

### 3. Google Login
- When user logs in with Google, they get a Google ID (e.g., `113988698670144743473`)
- This is a **different ID** from the anonymous ID
- Guest sessions remain under the anonymous ID
- Google sessions use the Google ID

## Implementation

### Anonymous ID Generation

```javascript
// frontend/src/utils/userId.js
export function getOrCreateAnonymousId() {
  let anonId = localStorage.getItem('wheeleat_anon_user_id');
  
  if (!anonId) {
    const randomPart = Math.random().toString(36).substring(2, 11);
    const timestamp = Date.now();
    anonId = `anon_${randomPart}_${timestamp}`;
    localStorage.setItem('wheeleat_anon_user_id', anonId);
  }
  
  return anonId;
}
```

### Effective User ID

```javascript
export function getEffectiveUserId(user) {
  if (user?.id && user?.loginType === 'google') {
    // Authenticated Google user
    return user.id;
  }
  
  // Anonymous user - use persistent anonymous ID
  return getOrCreateAnonymousId();
}
```

## User Flow Examples

### Scenario 1: Anonymous User (Never Logs In)
1. User visits site → Gets `anon_abc123_1234567890`
2. Session tracking uses `anon_abc123_1234567890`
3. User clicks "Continue as Guest" → Still uses `anon_abc123_1234567890`
4. All sessions tracked under same anonymous ID

### Scenario 2: Guest → Google Login
1. User visits site → Gets `anon_abc123_1234567890`
2. Session 1 tracked under `anon_abc123_1234567890`
3. User clicks "Continue as Guest" → Still `anon_abc123_1234567890`
4. User logs in with Google → Gets `113988698670144743473`
5. Session 2 tracked under `113988698670144743473`
6. **Result:** Two different user IDs, but we can link them if needed

### Scenario 3: Direct Google Login
1. User visits site → Gets `anon_abc123_1234567890`
2. User immediately logs in with Google → Gets `113988698670144743473`
3. Session tracked under `113988698670144743473`
4. Anonymous ID still exists but isn't used for tracking

## Benefits

### ✅ Consistent Tracking
- Anonymous users always have the same ID across sessions
- No duplicate anonymous users in analytics

### ✅ Better Analytics
- Can track anonymous user behavior
- Can see conversion from anonymous to authenticated
- Can analyze guest vs. authenticated user patterns

### ✅ Privacy-Friendly
- Anonymous IDs don't reveal personal information
- Can be cleared by user (localStorage)
- No server-side tracking until user authenticates

## Database Impact

### Session Tracking
```sql
-- Anonymous user session
user_id: "anon_abc123_1234567890"

-- Google user session  
user_id: "113988698670144743473"
```

### Analytics Queries

**Total sessions by user type:**
```sql
SELECT 
  CASE 
    WHEN user_id LIKE 'anon_%' THEN 'anonymous'
    ELSE 'authenticated'
  END as user_type,
  COUNT(*) as session_count
FROM user_sessions
GROUP BY user_type;
```

**Average session duration:**
```sql
SELECT 
  CASE 
    WHEN user_id LIKE 'anon_%' THEN 'anonymous'
    ELSE 'authenticated'
  END as user_type,
  AVG(total_duration_seconds) as avg_duration
FROM user_sessions
WHERE session_end_ms IS NOT NULL
GROUP BY user_type;
```

## Future Enhancement: Session Linking

If you want to link guest sessions to Google account after login:

1. **Store anonymous ID before login:**
   ```javascript
   const previousAnonId = localStorage.getItem('wheeleat_anon_user_id');
   ```

2. **Create linking table:**
   ```sql
   CREATE TABLE user_id_links (
     anonymous_id TEXT,
     google_id TEXT,
     linked_at INTEGER,
     PRIMARY KEY (anonymous_id, google_id)
   );
   ```

3. **Link on login:**
   ```javascript
   // When user logs in with Google
   if (previousAnonId) {
     linkUserIds(previousAnonId, googleUserId);
   }
   ```

4. **Query linked sessions:**
   ```sql
   SELECT * FROM user_sessions
   WHERE user_id IN (
     SELECT anonymous_id FROM user_id_links WHERE google_id = ?
     UNION
     SELECT ?
   );
   ```

## Summary

| Scenario | User ID | Consistent? | Different on Login? |
|----------|---------|-------------|-------------------|
| Anonymous (never logs in) | `anon_xxx` | ✅ Yes | N/A |
| Guest (clicks "Continue as Guest") | `anon_xxx` | ✅ Yes | N/A |
| Google Login | `google_id` | ✅ Yes | ✅ Yes (different) |

**Key Points:**
- ✅ Guests get a **consistent** anonymous ID
- ✅ Google login uses a **different** ID
- ✅ Both IDs are tracked separately
- ✅ Can be linked later if needed
- ✅ Better analytics and user tracking

