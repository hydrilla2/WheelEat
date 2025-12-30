import React from 'react';
import './ResultModal.css';

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
              <span className="detail-label">📍 Unit:</span>
              <span className="detail-value">{result.restaurant_unit}</span>
            </div>
            <div className="result-detail-item">
              <span className="detail-label">🏢 Floor:</span>
              <span className="detail-value">{result.restaurant_floor}</span>
            </div>
            <div className="result-detail-item">
              <span className="detail-label">🍽️ Category:</span>
              <span className="detail-value">{result.category}</span>
            </div>
          </div>
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

