import React from 'react';
import './ResultDisplay.css';
import { getRestaurantLocation } from '../data/restaurantLocations';

function ResultDisplay({ result }) {
  if (!result) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="result-display">
      <div className="result-content">
        <div className="result-icon">🎉</div>
        <h2 className="result-title">You got:</h2>
        <div className="result-restaurant-name">{result.restaurant_name}</div>
        <div className="result-details">
          <div className="result-detail-item">
            <span className="detail-label">� Floor/Unit:</span>
            <span className="detail-value">{result.restaurant_unit}</span>
          </div>
          <div className="result-detail-item result-location-item">
            <span className="detail-label">📍 Location:</span>
            <button 
              className="location-box"
              onClick={() => {
                const locationUrl = getRestaurantLocation(result.restaurant_name);
                if (locationUrl) {
                  window.open(locationUrl, '_blank');
                }
              }}
            >
              {result.restaurant_location || 'View Location'}
            </button>
          </div>
          <div className="result-detail-item">
            <span className="detail-label">🍽️ Category:</span>
            <span className="detail-value">{result.category}</span>
          </div>
        </div>
        <div className="result-timestamp">
          Spun at {formatTime(result.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default ResultDisplay;
