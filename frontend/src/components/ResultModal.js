import React from 'react';
import './ResultModal.css';
import { getRestaurantLocation } from '../data/restaurantLocations';
import { getPriceRange } from '../data/priceRanges';
import { getRestaurantCoordinates } from '../services/restaurantCoordinates';
import RestaurantMap from './RestaurantMap';

function ResultModal({ result, onClose, onSpinAgain }) {
  if (!result) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleSpinAgain = () => {
    onClose(); // Close the modal first
    // Small delay to ensure modal closes before spinning starts
    setTimeout(() => {
      onSpinAgain();
    }, 100);
  };

  // Get logo path - images are in public/images/logo/
  // In React, files in public folder are served from root, so we need /images/logo/filename
  const logoPath = result.logo ? `/${result.logo}` : null;
  
  // Debug: log the logo path to console
  if (logoPath) {
    console.log('Logo path:', logoPath, 'for restaurant:', result.restaurant_name);
  } else {
    console.log('No logo path for restaurant:', result.restaurant_name, 'Result object:', result);
  }

  // Get the appropriate Google Maps URL based on device type
  // iOS: Search by restaurant name + Sunway Square (more reliable on iOS)
  // Android: Try to use Google Maps app deep link, fall back to web link
  const getGoogleMapsLink = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // For iOS, use a search URL with restaurant name + location (works better on iOS)
    if (isIOS) {
      const searchQuery = `${result.restaurant_name} Sunway Square`;
      const encodedQuery = encodeURIComponent(searchQuery);
      return `https://maps.google.com/?q=${encodedQuery}`;
    }
    
    // For Android, try mobile deep link first if available
    if (isAndroid && result.google_maps_mobile_url) {
      return result.google_maps_mobile_url;
    }
    
    // Default to web URL
    return result.google_maps_url;
  };

  const googleMapsLink = getGoogleMapsLink();

  return (
    <div className="result-modal-overlay" onClick={onClose}>
      <div className="result-modal" onClick={(e) => e.stopPropagation()}>
        <button className="result-modal-close" onClick={onClose}>×</button>
        <div className="result-modal-content">
          <div className="result-icon">🎉</div>
          
          {/* Display restaurant logo if available */}
          {logoPath && (
            <div className="result-logo-container">
              <img 
                src={logoPath} 
                alt={result.restaurant_name}
                className="result-logo"
                onError={(e) => {
                  // Log error and hide image if it fails to load
                  console.error('Failed to load logo:', logoPath, 'Error:', e);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', logoPath);
                }}
              />
            </div>
          )}
          
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
            <div className="result-detail-item">
              <span className="detail-label">💰 Price Range:</span>
              <span className="detail-value">{getPriceRange(result.restaurant_name)}</span>
            </div>
            {result.google_maps_url && (
              <div className="result-detail-item">
                <a 
                  href={googleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="google-maps-link"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            )}
          </div>
          
          {/* Interactive Restaurant Map */}
          <RestaurantMap 
            restaurantName={result.restaurant_name}
            coordinates={getRestaurantCoordinates(result.restaurant_name)}
          />
          
          <div className="result-timestamp">
            Spun at {formatTime(result.timestamp)}
          </div>
          <button className="result-modal-button" onClick={handleSpinAgain}>
            Spin Again!
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;

