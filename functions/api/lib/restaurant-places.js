// Restaurant to Google Places place_id mapping
// This maps restaurant names to their Google Places place_id for accurate rating/review fetching
// Format: { mallId: { restaurantName: place_id } }

export const RESTAURANT_PLACE_IDS = {
  sunway_square: {
    "103 Coffee": "ChIJdZs9fDlNzDER0EXdJGGRal4",
    "A'Decade": null,
    "Armoury Steakhouse": "ChIJ3wTgNHJNzDERwWpkLeDeN3c",
    "BESTORE": null,
    "Black Canyon": "ChIJf4bRbABNzDERxMhpsI4qvew",
    "Ba Shu Jia Yan": "ChIJq4xeKwBNzDER9eKAvMamQ_g",
    "Beutea": "ChIJ-cGUT9FNzDERbE00DFUt_fw",
    "Bread History": "ChIJ94J5PABNzDERLqGo-Zdx6To",
    "Chagee": null,
    "Coffee Bean": "ChIJE-63nqlNzDERn3pV2gMKeRU",
    "Christine's Bakery Cafe": "ChIJaTIghXdNzDERz6xaHJSuKek",
    "CHUCHAT": "ChIJNbL2LABNzDER0VjE2_egbwM",
    "ChaPanda": null,
    "CU Mart": "ChIJV3KBDQBNzDERVyhH5R36vpM",
    "Come Buy Yakiniku": "ChIJKQYCQgBNzDERH3tNosohIRk",
    "Count (Flower Drum)": "ChIJdyGo6nhNzDERysflWsBu_Mg",
    "Chatramue": "ChIJF-yyKQBNzDERGaAbW_R-w0A",
    "DOZO": "ChIJB0OGyn5NzDERGHClxfhorGA",
    "Empire Sushi": null,
    "Far Coffee": "ChIJO86z4DtNzDERmOLc_7N_qhA",
    "Fong Woh Tong": null,
    "Gong Luck Cafe": "ChIJtX4RGABNzDERwJ97uOVrpOQ",
    "Gokoku Japanese Bakery": "ChIJ_fot07FNzDERqBm3DDQZgZs",
    "Gong Cha": null,
    "Hock Kee Kopitiam": "ChIJ09ptRedNzDERbME44pP3TmQ",
    "Han Bun Sik": "ChIJA4Y5H5hNzDERAa7ZwVwtR4I",
    "Happy Potato": "ChIJ5TNPO_BNzDERGVK3zkywQ0w",
    "I'm Bagel": "ChIJjdTqVO1NzDERw-H83-VCGZI",
    "I LIKE & Yogurt In A Can": "ChIJJYSa-pRNzDERbrTJ_3R5q88",
    "JP & CO": "ChIJS0y-JwBNzDERpMXxeov8oOY",
    "Kanteen": null,
    "Kenangan Coffee": "ChIJZU98A35NzDERrPnNSCtUAaI",
    "Kedai Kopi Malaya": "ChIJnYRNPQBNzDER9C3fbJJWM28",
    "Kha Coffee Roaster": "ChIJ4d_fZQBNzDERb6gSyrsXgL0",
    "LLAO LLAO": "ChIJV50EzjdNzDER3ewsVZiuN4k",
    "Luckin": "ChIJjT8ADAxNzDERCE78ePN6v74",
    "Manjoe": "ChIJO0-vWwBNzDERlimKL9tkJz4",
    "Mix.Store": "ChIJ3YURFQBNzDERq1xpyBC8K5I",
    "Mr. Wu": "ChIJK6nphbFNzDERydOQGX_lDGY",
    "Missy Sushi": "ChIJnyN-ueNNzDERH-_aW18q_fY",
    "Nasi Lemak Shop": "ChIJsTe-CQBNzDERQ8ON2zveN4M",
    "Nine Dragon Char Chan Teng (Kowloon Cafe)": "ChIJEWNwaQBNzDERe15emyn_ubA",
    "Nippon Sushi": "ChIJJwUgJQBNzDERNXrQc5gzRkQ",
    "Odon Beyond": "ChIJURknbSNNzDERw52oJhcuACI",
    "One Dish One Taste": "ChIJ2Qv78F9NzDER_BMnzzZFORw",
    "Pak Curry": "ChIJS44CHABNzDERPH2QB2mULbA",
    "Ramen Mob": "ChIJnQ3OLgBNzDERyxH5eMBMhQE",
    "Richeese Factory": "ChIJGc_tNwBNzDER2IeI22ZxLV0",
    "Sweetie": null,
    "Salad Atelier": "ChIJKSOEPjVNzDER6aWfGIn5kwc",
    "Super Matcha": "ChIJF-b6AQBNzDERkdD3IOMH69s",
    "Shabuyaki by Nippon Sushi": null,
    "Stuff'D": "ChIJcT1ZFUlNzDER_vbwiF-T5xg",
    "Subway": null,
    "The Public House": "ChIJ-TLrTABNzDERQVg84HG-I1Y",
    "Tealive Plus": null,
    "Tang Gui Fei Tanghulu": "ChIJPZdrEONNzDERNjn8Zliqp_s",
    "The Walking Hotpot Signature": "ChIJBxW4DaBNzDER6MnFKiQAcmE",
    "The Chicken Rice Shop": "ChIJlbwCiXxNzDERe93Zfdzb99U",
    "Village Grocer": "ChIJ62Aw2n5NzDERTd44eZMgGOY",
    "Yellow Bento": "ChIJV3px97hNzDERKOTIJP2xa_A",
    "Yonny": "ChIJvZ4-FgBNzDERI9PrDGjXUJk",
    "Yakiniku Smile MY": "ChIJAZwHG39NzDER0Ihb1EDixdw",
    "Yama by Hojichaya": "ChIJf6iO6AJNzDERKMBCHF558PU",
    "Yogurt Planet": "ChIJ-8jlX-BNzDERb36a1NwUwvY",
    "Zus Coffee": "ChIJ_1aKt4dNzDER7CIPbAMs2U8",
    "Zok Noodle House": "ChIJPUl4EQBNzDERJmv9rI92FcM",
  },
};

/**
 * Get place_id for a restaurant
 * @param {string} restaurantName - Name of the restaurant
 * @param {string} mallId - Mall ID (default: 'sunway_square')
 * @returns {string|null} - place_id or null if not found
 */
export function getPlaceId(restaurantName, mallId = 'sunway_square') {
  const mallMapping = RESTAURANT_PLACE_IDS[mallId];
  if (!mallMapping) return null;
  return mallMapping[restaurantName] || null;
}

/**
 * Check if a restaurant is explicitly marked as unavailable (null in mapping)
 * This distinguishes between:
 * - Explicitly null: "don't search, we know it's not available"
 * - Missing from mapping: "not found yet, try text search"
 * @param {string} restaurantName - Name of the restaurant
 * @param {string} mallId - Mall ID (default: 'sunway_square')
 * @returns {boolean} - true if explicitly marked as null, false otherwise
 */
export function isExplicitlyUnavailable(restaurantName, mallId = 'sunway_square') {
  const mallMapping = RESTAURANT_PLACE_IDS[mallId];
  if (!mallMapping) return false;
  // Check if the key exists and its value is explicitly null
  return restaurantName in mallMapping && mallMapping[restaurantName] === null;
}

/**
 * Extract place_id from a Google Maps URL (shortened or full)
 * This function attempts to resolve shortened URLs and extract place_id
 * @param {string} url - Google Maps URL
 * @returns {Promise<string|null>} - place_id or null
 */
export async function extractPlaceIdFromUrl(url) {
  if (!url || url === 'null' || url.trim() === '') return null;
  
  try {
    // If it's already a place_id format, return it
    if (url.startsWith('Ch') || /^[A-Za-z0-9_-]{27}$/.test(url)) {
      return url;
    }
    
    // If it's a shortened URL, we need to resolve it
    // For now, we'll return null and let the user manually add place_ids
    // In production, you could make a HEAD request to resolve the shortened URL
    // and extract place_id from the Location header or final URL
    
    // Check if it's a full Google Maps URL with place_id
    const placeIdMatch = url.match(/[?&]place_id=([A-Za-z0-9_-]+)/);
    if (placeIdMatch) {
      return placeIdMatch[1];
    }
    
    // Check if it's a maps.google.com URL with data parameter
    const dataMatch = url.match(/data=([^&]+)/);
    if (dataMatch) {
      // Try to decode and extract place_id
      try {
        const decoded = decodeURIComponent(dataMatch[1]);
        const placeIdInData = decoded.match(/place_id[=:]([A-Za-z0-9_-]+)/);
        if (placeIdInData) {
          return placeIdInData[1];
        }
      } catch (e) {
        // Ignore decode errors
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting place_id from URL ${url}:`, error);
    return null;
  }
}

