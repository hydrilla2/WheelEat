# User Session Tracking - Time Spent on Platform

This document explains how to track the time users spend on the WheelEat platform.

## Overview

The session tracking system monitors:
- **Session Start**: When a user first visits the platform
- **Active Time**: Time spent actively using the platform (heartbeat every 30 seconds)
- **Session End**: When a user leaves (closes tab, navigates away, or becomes inactive)
- **Total Duration**: Calculated time spent per session

## Database Setup

### 1. Create the `user_sessions` table

Run the SQL schema in your D1 database:

```bash
npx wrangler d1 execute wheeleat-db --remote --file=./functions/sql/user_sessions_schema.sql
```

Or manually execute the SQL from `functions/sql/user_sessions_schema.sql` in the Cloudflare dashboard.

### 2. Verify Table Creation

```bash
npx wrangler d1 execute wheeleat-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions';"
```

## How It Works

### Frontend Tracking

The `useSessionTracker` hook automatically:
1. **Starts a session** when the component mounts
2. **Sends heartbeat** every 30 seconds while user is active
3. **Tracks user activity** (mouse, keyboard, clicks, scrolls)
4. **Handles tab switching** (ends session when tab is hidden, starts new when visible)
5. **Ends session** when user closes the tab/window

### Backend API

The `/api/user-sessions` endpoint handles:
- **POST** with `action: 'start'` - Creates a new session
- **POST** with `action: 'heartbeat'` - Updates last activity time
- **POST** with `action: 'end'` - Ends session and calculates duration
- **GET** - Returns session statistics

## API Endpoints

### Start Session
```javascript
POST /api/user-sessions
Body: {
  "action": "start",
  "user_id": "user123", // optional, null for anonymous
  "user_agent": "...",
  "referer": "..."
}

Response: {
  "success": true,
  "session_id": "uuid-here",
  "session_start_ms": 1234567890
}
```

### Send Heartbeat
```javascript
POST /api/user-sessions
Body: {
  "action": "heartbeat",
  "session_id": "uuid-here",
  "user_id": "user123" // optional
}

Response: {
  "success": true,
  "last_activity_ms": 1234567890
}
```

### End Session
```javascript
POST /api/user-sessions
Body: {
  "action": "end",
  "session_id": "uuid-here"
}

Response: {
  "success": true,
  "session_id": "uuid-here",
  "session_end_ms": 1234567890,
  "total_duration_seconds": 120
}
```

### Get Session Statistics
```javascript
GET /api/user-sessions?days=7&user_id=user123

Response: {
  "success": true,
  "summary": {
    "total_sessions": 100,
    "completed_sessions": 95,
    "average_duration_seconds": 180,
    "average_duration_minutes": 3.0,
    "total_duration_seconds": 17100
  },
  "statistics": {
    "sessions_by_user": [...],
    "daily_sessions": [...],
    "recent_sessions": [...]
  }
}
```

## Query Parameters for Statistics

- `days` - Last N days (e.g., `?days=7`)
- `date` - Specific date (YYYY-MM-DD)
- `start_date` & `end_date` - Date range
- `user_id` - Filter by specific user
- `limit` - Limit results (default: 50)

## Example Queries

### Get last 7 days statistics
```
GET https://wheeleat-xp5.pages.dev/api/user-sessions?days=7
```

### Get statistics for specific user
```
GET https://wheeleat-xp5.pages.dev/api/user-sessions?user_id=113988698670144743473
```

### Get statistics for specific date
```
GET https://wheeleat-xp5.pages.dev/api/user-sessions?date=2026-01-08
```

## Frontend Integration

The session tracker is already integrated into `App.js`:

```javascript
import { useSessionTracker } from './hooks/useSessionTracker';

function App() {
  const [user, setUser] = useState(null);
  const userId = user?.id || null;
  
  // Automatically tracks session
  useSessionTracker(userId);
  
  // ... rest of component
}
```

## How Time is Calculated

1. **Session Start**: Recorded when user first visits
2. **Last Activity**: Updated every 30 seconds (heartbeat) or on user activity
3. **Session End**: When user leaves, duration = `last_activity_ms - session_start_ms`
4. **Total Duration**: Stored in seconds in `total_duration_seconds`

## Key Features

### Automatic Tracking
- No manual intervention needed
- Works for both logged-in and anonymous users
- Handles page visibility changes (tab switching)

### Activity Detection
- Tracks mouse movements, clicks, keyboard input, scrolling
- Sends heartbeat on any user activity
- Prevents session timeout during active use

### Reliable Session End
- Uses `beforeunload` event for page close
- Uses `sendBeacon` API for reliable delivery
- Handles tab visibility changes

## Database Schema

```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,                    -- NULL for anonymous users
  session_start_ms INTEGER NOT NULL,
  session_end_ms INTEGER,           -- NULL if still active
  total_duration_seconds INTEGER,  -- Calculated duration
  page_views INTEGER DEFAULT 0,
  last_activity_ms INTEGER NOT NULL,
  user_agent TEXT,
  referer TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Analytics Queries

### Average session duration
```sql
SELECT 
  AVG(total_duration_seconds) as avg_seconds,
  AVG(total_duration_seconds) / 60.0 as avg_minutes
FROM user_sessions
WHERE session_end_ms IS NOT NULL;
```

### Total time spent by user
```sql
SELECT 
  user_id,
  COUNT(*) as session_count,
  SUM(total_duration_seconds) as total_seconds,
  SUM(total_duration_seconds) / 60.0 as total_minutes
FROM user_sessions
WHERE session_end_ms IS NOT NULL
GROUP BY user_id
ORDER BY total_seconds DESC;
```

### Daily average session time
```sql
SELECT 
  DATE(datetime(session_start_ms / 1000, 'unixepoch')) as date,
  COUNT(*) as sessions,
  AVG(total_duration_seconds) / 60.0 as avg_minutes
FROM user_sessions
WHERE session_end_ms IS NOT NULL
GROUP BY date
ORDER BY date DESC;
```

## Testing

### Test Session Start
1. Open the app in a browser
2. Check browser console for session start
3. Verify in database:
```bash
npx wrangler d1 execute wheeleat-db --remote --command="SELECT * FROM user_sessions ORDER BY session_start_ms DESC LIMIT 1;"
```

### Test Heartbeat
1. Wait 30 seconds after page load
2. Check network tab for POST requests to `/api/user-sessions`
3. Verify `last_activity_ms` is updated

### Test Session End
1. Close the browser tab
2. Wait a few seconds
3. Check database for completed session:
```bash
npx wrangler d1 execute wheeleat-db --remote --command="SELECT * FROM user_sessions WHERE session_end_ms IS NOT NULL ORDER BY session_end_ms DESC LIMIT 1;"
```

## Troubleshooting

### Sessions not being created
- Check browser console for errors
- Verify database table exists
- Check network tab for API calls

### Sessions not ending
- Check if `beforeunload` event is firing
- Verify `sendBeacon` is supported (modern browsers)
- Check database for sessions with `session_end_ms IS NULL`

### Duration seems incorrect
- Verify `session_start_ms` and `session_end_ms` are in milliseconds
- Check that `total_duration_seconds` is calculated correctly
- Ensure heartbeat is updating `last_activity_ms`

## Best Practices

1. **Heartbeat Interval**: 30 seconds is a good balance between accuracy and API calls
2. **Activity Detection**: Multiple event listeners ensure accurate tracking
3. **Session End**: Use `sendBeacon` for reliable delivery during page unload
4. **Tab Switching**: End session when tab is hidden to prevent inflated durations

## Summary

The session tracking system provides:
- ✅ Automatic time tracking
- ✅ Works for anonymous and logged-in users
- ✅ Handles tab switching and page navigation
- ✅ Reliable session end detection
- ✅ Comprehensive analytics API
- ✅ Easy integration with existing codebase

After deployment, users' time spent on the platform will be automatically tracked and available via the `/api/user-sessions` endpoint.

