import React, { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './RestaurantMap.css';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
  marginTop: '16px',
};

const defaultCenter = {
  lat: 3.0437,
  lng: 101.5761, // Sunway Square center
};

function RestaurantMap({ restaurantName, coordinates }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const mapCenter = useMemo(() => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      return {
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    }
    return defaultCenter;
  }, [coordinates]);

  if (loadError) {
    return <div className="restaurant-map-error">Unable to load map</div>;
  }

  if (!isLoaded) {
    return <div className="restaurant-map-loading">Loading map...</div>;
  }

  return (
    <div className="restaurant-map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={17}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        <Marker
          position={mapCenter}
          title={restaurantName}
          icon={{
            path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.5,
          }}
        />
      </GoogleMap>
    </div>
  );
}

export default RestaurantMap;
