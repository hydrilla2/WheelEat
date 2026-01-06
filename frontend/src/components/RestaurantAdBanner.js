import React, { useState, useEffect } from 'react';
import './RestaurantAdBanner.css';

function RestaurantAdBanner({ variant = 'top', restaurantCategory = null }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageError, setImageError] = useState({});

  // Separate ad configurations by restaurant
  const adConfigs = {
    nls: {
      restaurant: 'NLS Nasi Lemak Shop',
      placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M',
      slides: [
        {
          type: 'profile',
          restaurantName: 'NLS Nasi Lemak Shop',
          location: 'Sunway Square Mall',
          rating: '4.4',
          reviews: '36 reviews',
          description: 'Authentic Malaysian cuisine with free-flow sambal!',
          image: '/images/ads/nls-restaurant.jpg',
          placeholderBg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        },
        {
          type: 'dish',
          restaurantName: 'NLS Nasi Lemak Shop',
          dishName: 'Nasi Lemak Goreng',
          description: 'Traditional coconut rice with fried chicken, sambal, and sides',
          image: '/images/ads/nasi-lemak-goreng.jpg',
          placeholderBg: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
          price: 'From RM 18.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        },
        {
          type: 'dish',
          restaurantName: 'NLS Nasi Lemak Shop',
          dishName: 'Rendang Daging',
          description: 'Slow-cooked beef in rich, aromatic spices',
          image: '/images/ads/rendang-daging.jpg',
          placeholderBg: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
          price: 'From RM 16.90',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        },
        {
          type: 'dish',
          restaurantName: 'NLS Nasi Lemak Shop',
          dishName: 'Asam Laksa',
          description: 'Spicy coconut curry noodles with prawns and vegetables',
          image: '/images/ads/asam-laksa.jpg',
          placeholderBg: 'linear-gradient(135deg, #ff7675 0%, #fd79a8 100%)',
          price: 'From RM 19.50',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        },
        {
          type: 'dish',
          restaurantName: 'NLS Nasi Lemak Shop',
          dishName: 'Prawn Noodles',
          description: 'Rich coconut curry noodles with fresh herbs and toppings',
          image: '/images/ads/prawnNoodle.jpg',
          placeholderBg: 'linear-gradient(135deg, #ff7675 0%, #fd79a8 100%)',
          price: 'From RM 21.50',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        },
        {
          type: 'dish',
          restaurantName: 'NLS Nasi Lemak Shop',
          dishName: 'Lontong Nasi Impit',
          description: 'Rice cakes in creamy coconut curry soup',
          image: '/images/ads/lontong-nasi-impit.jpg',
          placeholderBg: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
          price: 'From RM 20.50',
          cta: 'Visit Restaurant',
          placeId: 'ChIJsTe-CQBNzDERQ8ON2zveN4M'
        }
      ]
    },
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
  };

  // Determine which ads to show based on category
  const getAdsToShow = () => {
    // Normalize category name
    const normalizedCategory = restaurantCategory?.toLowerCase() || '';
    
    // Coffee categories
    const coffeeKeywords = ['coffee', 'cafe', 'tea', 'beverage'];
    const isCoffee = coffeeKeywords.some(keyword => normalizedCategory.includes(keyword));
    
    // Malaysian categories
    const malaysianKeywords = ['malaysian', 'local', 'malay', 'nasi lemak', 'roti', 'satay'];
    const isMalaysian = malaysianKeywords.some(keyword => normalizedCategory.includes(keyword));

    // Return the appropriate ads, or random if ambiguous
    if (isCoffee && !isMalaysian) {
      return adConfigs.farCoffee;
    } else if (isMalaysian && !isCoffee) {
      return adConfigs.nls;
    } else {
      // Both, neither, or uncertain - pick random
      return Math.random() > 0.5 ? adConfigs.farCoffee : adConfigs.nls;
    }
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

