# Restaurant Ad Banner Setup Guide

## Overview

The Restaurant Ad Banner is a Google-style advertisement component that displays:
1. **First slide**: Restaurant profile (NLS Nasi Lemak Shop)
2. **Subsequent slides**: Featured dishes (Nasi Lemak, Rendang, Laksa, Lontong Sayur)

The banner automatically advances every 3 seconds and appears:
- At the top of the main page
- Inside the result modal popup

## Image Requirements

To display the actual restaurant and dish images, place the following images in `frontend/public/images/ads/`:

### Required Images:
- `nls-restaurant.jpg` - Restaurant interior photo
- `nasi-lemak.jpg` - Nasi Lemak dish photo
- `rendang.jpg` - Rendang dish photo
- `laksa.jpg` - Laksa dish photo
- `lontong.jpg` - Lontong Sayur dish photo

### Image Specifications:
- **Format**: JPG or PNG
- **Recommended size**: 120x120px minimum (will be scaled)
- **Aspect ratio**: 1:1 (square) works best
- **File size**: Keep under 200KB per image for fast loading

### Creating the Directory:
```bash
mkdir -p frontend/public/images/ads
```

## Fallback Behavior

If images are not found, the banner will:
- Display colorful gradient placeholders
- Show emoji icons (🏪 for restaurant, 🍽️ for dishes)
- Still function fully with all text and interactive elements

## Customization

### Changing Restaurant Information

Edit `frontend/src/components/RestaurantAdBanner.js`:

```javascript
const slides = [
  {
    type: 'profile',
    restaurantName: 'NLS Nasi Lemak Shop',  // Change restaurant name
    location: 'Sunway Square Mall',          // Change location
    rating: '4.4',                           // Change rating
    reviews: '36 reviews',                  // Change review count
    description: 'Authentic Malaysian cuisine with free-flow sambal!',
    // ...
  },
  // Add or modify dish slides
];
```

### Changing Slide Duration

Edit the `useEffect` interval in `RestaurantAdBanner.js`:

```javascript
const interval = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % slides.length);
}, 3000); // Change 3000 to desired milliseconds (e.g., 5000 for 5 seconds)
```

### Styling

Modify `frontend/src/components/RestaurantAdBanner.css` to customize:
- Colors
- Sizes
- Animations
- Layout

## Component Usage

### In App.js (Top Banner)
```jsx
<RestaurantAdBanner variant="top" />
```

### In ResultModal (Popup Banner)
```jsx
<RestaurantAdBanner variant="modal" />
```

## Features

✅ Auto-advancing carousel (3 seconds per slide)  
✅ Manual navigation via slide indicators  
✅ Google Ads-style design  
✅ Responsive layout (mobile-friendly)  
✅ Smooth transitions  
✅ Clickable banner (ready for navigation logic)  
✅ Fallback placeholders for missing images  

## Next Steps

1. Add the restaurant and dish images to `frontend/public/images/ads/`
2. Customize restaurant information if needed
3. Add navigation logic in the `handleClick` function
4. Optionally connect to restaurant ordering system or menu page

