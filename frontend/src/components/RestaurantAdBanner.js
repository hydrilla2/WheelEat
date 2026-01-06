import React, { useState, useEffect } from 'react';
import './RestaurantAdBanner.css';

function RestaurantAdBanner({ variant = 'top', restaurantCategory = null }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageError, setImageError] = useState({});

  // Ad configurations by restaurant - easy to add more
  const adConfigs = {
    farCoffee: {
      restaurant: 'Far Coffee',
      placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA',
      slides: [
        {
          type: 'profile',
          restaurantName: 'Far Coffee',
          location: 'Sunway Square Mall',
          rating: '4.3',
          reviews: '28 reviews',
          description: 'Specialty coffee and cozy ambiance!',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #8b6f47 0%, #a0826d 100%)',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        },
        {
          type: 'dish',
          restaurantName: 'Far Coffee',
          dishName: 'Espresso',
          description: 'Espresso',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #6f4e37 0%, #8b6f47 100%)',
          price: 'RM 7.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        },
        {
          type: 'dish',
          restaurantName: 'Far Coffee',
          dishName: 'Cafe Latte',
          description: 'Cafe Latte',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #d2b48c 0%, #c9a961 100%)',
          price: 'RM 10.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        },
        {
          type: 'dish',
          restaurantName: 'Far Coffee',
          dishName: 'Americano',
          description: 'Americano',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #6f4e37 0%, #8b6f47 100%)',
          price: 'RM 9.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        },
        {
          type: 'dish',
          restaurantName: 'Far Coffee',
          dishName: 'Cappuccino',
          description: 'Cappuccino',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #d2b48c 0%, #c9a961 100%)',
          price: 'RM 10.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        },
        {
          type: 'dish',
          restaurantName: 'Far Coffee',
          dishName: 'Some Cookie',
          description: 'Some Cookie',
          image: '/images/logo/far-coffee.png',
          placeholderBg: 'linear-gradient(135deg, #d4a574 0%, #c9a961 100%)',
          price: 'RM 8.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJO86z4DtNzDERmOLc_7N_qhA'
        }
      ]
    }
    // Add more restaurants here in the future
  };

  // Determine which ads to show based on category
  const getAdsToShow = () => {
    // Normalize category name
    const normalizedCategory = restaurantCategory?.toLowerCase() || '';
    
    // Define keyword mappings for each restaurant
    const restaurantKeywords = {
      farCoffee: ['coffee', 'cafe', 'tea', 'beverage']
    };

    // Check which restaurant matches the category
    for (const [key, keywords] of Object.entries(restaurantKeywords)) {
      if (keywords.some(keyword => normalizedCategory.includes(keyword))) {
        return adConfigs[key];
      }
    }

    // If no match or multiple matches, pick random from available ads
    const availableAds = Object.values(adConfigs);
    if (availableAds.length > 0) {
      return availableAds[Math.floor(Math.random() * availableAds.length)];
    }

    // Fallback to Far Coffee
    return adConfigs.farCoffee;
  };

  const activeAds = getAdsToShow();
  const slides = activeAds.slides;

  // Auto-advance slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];
  const isProfile = currentSlideData.type === 'profile';

  // Get the place ID from the current slide
  const GOOGLE_PLACE_ID = currentSlideData.placeId;

  const handleClick = (e) => {
    // Prevent event bubbling if clicking on button specifically
    if (e.target.tagName === 'BUTTON') {
      e.stopPropagation();
    }
    
    // Open Google Maps with the restaurant's place_id
    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`restaurant-ad-banner ${variant}`} onClick={handleClick}>
      <div className="ad-banner-content">
        <div 
          className="ad-banner-image-container"
          style={{
            background: imageError[currentSlide] ? currentSlideData.placeholderBg : 'transparent'
          }}
        >
          {!imageError[currentSlide] && (
            <img 
              src={currentSlideData.image} 
              alt={isProfile ? currentSlideData.restaurantName : currentSlideData.dishName}
              className="ad-banner-image"
              onError={() => {
                setImageError(prev => ({ ...prev, [currentSlide]: true }));
              }}
            />
          )}
          {imageError[currentSlide] && (
            <div className="ad-banner-placeholder">
              {isProfile ? '🏪' : '🍽️'}
            </div>
          )}
          <div className="ad-banner-overlay" />
        </div>
        
        <div className="ad-banner-text">
          {isProfile ? (
            <>
              <div className="ad-banner-header">
                <span className="ad-label">Ad</span>
                <span className="ad-restaurant-name">{currentSlideData.restaurantName}</span>
              </div>
              <div className="ad-banner-location">{currentSlideData.location}</div>
              <div className="ad-banner-rating">
                <span className="ad-rating-stars">★★★★★</span>
                <span className="ad-rating-value">{currentSlideData.rating}</span>
                <span className="ad-reviews-count">({currentSlideData.reviews})</span>
              </div>
              <div className="ad-banner-description">{currentSlideData.description}</div>
            </>
          ) : (
            <>
              <div className="ad-banner-header">
                <span className="ad-label">Ad</span>
                <span className="ad-restaurant-name">{currentSlideData.restaurantName}</span>
              </div>
              <div className="ad-dish-name">{currentSlideData.dishName}</div>
              <div className="ad-banner-description">{currentSlideData.description}</div>
              <div className="ad-dish-price">{currentSlideData.price}</div>
            </>
          )}
          
          <button 
            className="ad-cta-button"
            onClick={handleButtonClick}
            type="button"
          >
            {currentSlideData.cta}
          </button>
        </div>
      </div>
      
      {/* Slide indicators */}
      <div className="ad-slide-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`ad-indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default RestaurantAdBanner;

