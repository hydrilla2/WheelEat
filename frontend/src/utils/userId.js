// Utility functions for managing user IDs (anonymous and authenticated)

const ANON_ID_KEY = 'wheeleat_anon_user_id';

/**
 * Get or create a persistent anonymous user ID
 * This ID persists across sessions and page reloads
 * @returns {string} Anonymous user ID (format: anon_xxxxx_timestamp)
 */
export function getOrCreateAnonymousId() {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  
  if (!anonId) {
    // Generate a new anonymous ID
    const randomPart = Math.random().toString(36).substring(2, 11);
    const timestamp = Date.now();
    anonId = `anon_${randomPart}_${timestamp}`;
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  
  return anonId;
}

/**
 * Get the current user ID (authenticated or anonymous)
 * @param {object|null} user - Current user object from localStorage
 * @returns {string} User ID (Google ID or anonymous ID)
 */
export function getEffectiveUserId(user) {
  if (user?.id && user?.loginType === 'google') {
    // Authenticated Google user
    return user.id;
  }
  
  // Anonymous user - use persistent anonymous ID
  return getOrCreateAnonymousId();
}

/**
 * Check if a user ID is anonymous
 * @param {string} userId - User ID to check
 * @returns {boolean} True if the ID is anonymous
 */
export function isAnonymousId(userId) {
  return userId && userId.startsWith('anon_');
}

/**
 * Clear anonymous ID (useful for testing or logout)
 */
export function clearAnonymousId() {
  localStorage.removeItem(ANON_ID_KEY);
}

