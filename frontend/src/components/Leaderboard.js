import React, { useEffect, useMemo, useState } from 'react';
import './Leaderboard.css';
import { fetchLeaderboardBatched } from '../services/api';
import { sortLeaderboardRows } from '../utils/leaderboard';
import { getRestaurantLocation } from '../data/restaurantLocations';

function clampRating(rating) {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return null;
  return Math.max(0, Math.min(5, rating));
}

function formatReviews(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '— reviews';
  return `${n.toLocaleString()} reviews`;
}

function renderStars(rating) {
  const r = clampRating(rating);
  if (r === null) return '—';
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function Leaderboard({ mallId, mallName }) {
  const [mode, setMode] = useState('rating'); // 'rating' | 'reviews'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLoadingProgress('Fetching leaderboard in batches...');

    // Use batched fetching to ensure all restaurants are processed
    // This works around Cloudflare's subrequest limit (~50 per request)
    fetchLeaderboardBatched(mallId, 25)
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data?.restaurants) ? data.restaurants : []);
        setLoading(false);
        setLoadingProgress('');
        
        // Log success stats
        if (data._debug) {
          const total = data._debug.total_restaurants || 0;
          const withRatings = data._debug.restaurants_with_ratings || 0;
          const batches = data._debug.batches_fetched || 1;
          console.log(`✅ Leaderboard loaded: ${withRatings}/${total} restaurants with ratings (${batches} batch${batches > 1 ? 'es' : ''})`);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load leaderboard');
        setRows([]);
        setLoading(false);
        setLoadingProgress('');
        console.error('Leaderboard fetch error:', e);
      });

    return () => {
      cancelled = true;
    };
  }, [mallId]);

  const sorted = useMemo(() => {
    // Use shared logic so future features (trending, top picks) can reuse the same ranking behavior.
    return sortLeaderboardRows(rows, mode);
  }, [rows, mode]);

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="leaderboard-title-row">
          <h2 className="leaderboard-title">Restaurant Leaderboard</h2>
          <div className="leaderboard-subtitle">
            {mallName ? mallName : mallId}
          </div>
        </div>

        <div className="leaderboard-controls">
          <label>
            <select
              className="leaderboard-select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="rating">Sort: Highest rating</option>
              <option value="reviews">Sort: Most reviews</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="leaderboard-loading">
          {loadingProgress || 'Loading leaderboard…'}
        </div>
      ) : null}
      {error ? <div className="leaderboard-error">{error}</div> : null}

      {!loading && !error ? (
        <ol className="leaderboard-list">
          {sorted.map((r, idx) => (
            <li key={`${r.name}-${idx}`} className="leaderboard-card">
              <div className="rank-badge" aria-label={`Rank ${idx + 1}`}>
                {idx + 1}
              </div>

              <div className="leaderboard-main">
                <p 
                  className="restaurant-name"
                  onClick={() => {
                    const locationUrl = getRestaurantLocation(r.name);
                    if (locationUrl) {
                      window.open(locationUrl, '_blank');
                    }
                  }}
                  style={{ cursor: getRestaurantLocation(r.name) ? 'pointer' : 'default' }}
                  title={getRestaurantLocation(r.name) ? 'Click to view location' : ''}
                >
                  {r.name}
                </p>
                <div className="restaurant-meta">
                  <span className="meta-pill">{r.category || 'Unknown'}</span>
                </div>
              </div>

              <div className="leaderboard-stats">
                <div className="rating-row">
                  <span className="stars" aria-label="Rating">
                    {renderStars(r.rating)}
                  </span>{' '}
                  {typeof r.rating === 'number' ? `(${r.rating.toFixed(1)})` : ''}
                </div>
                <div className="reviews-row">{formatReviews(r.reviews)}</div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}


