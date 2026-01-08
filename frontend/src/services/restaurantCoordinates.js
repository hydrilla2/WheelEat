import { getRestaurantCoordinates as getCoords } from '../api/lib/restaurant-places';

export const getRestaurantCoordinates = (restaurantName, mallId = 'sunway_square') => {
  return getCoords(restaurantName, mallId);
};
