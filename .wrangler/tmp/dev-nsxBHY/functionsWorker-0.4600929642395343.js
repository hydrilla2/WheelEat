var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-YhKUjg/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-UMXQAw/functionsWorker-0.4600929642395343.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
function getD1Database(env) {
  const db = env.DB;
  if (!db) {
    throw new Error(
      "Missing D1 database binding. Please bind the D1 database to your Pages project in Cloudflare dashboard."
    );
  }
  return db;
}
__name(getD1Database, "getD1Database");
__name2(getD1Database, "getD1Database");
function generateUUID() {
  return crypto.randomUUID();
}
__name(generateUUID, "generateUUID");
__name2(generateUUID, "generateUUID");
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1e3);
}
__name(getCurrentTimestamp, "getCurrentTimestamp");
__name2(getCurrentTimestamp, "getCurrentTimestamp");
function setCORSHeaders(headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
}
__name(setCORSHeaders, "setCORSHeaders");
__name2(setCORSHeaders, "setCORSHeaders");
function createCORSResponse() {
  const headers = new Headers();
  setCORSHeaders(headers);
  return new Response(null, { status: 200, headers });
}
__name(createCORSResponse, "createCORSResponse");
__name2(createCORSResponse, "createCORSResponse");
function jsonResponse(data, status = 200) {
  const headers = new Headers();
  setCORSHeaders(headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status, headers });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
async function onRequestGet(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  try {
    const db = getD1Database(env);
    const result2 = await db.prepare(
      "SELECT * FROM users LIMIT 10"
    ).all();
    if (!result2.success) {
      console.error("Database error:", result2.error);
      return jsonResponse({
        error: "Database error",
        message: result2.error?.message || "Unknown error",
        hint: 'Make sure the "users" table exists in D1'
      }, 500);
    }
    return jsonResponse({
      success: true,
      count: result2.results ? result2.results.length : 0,
      users: result2.results || []
    });
  } catch (error) {
    console.error("API error:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: "Invalid JSON in request body" }, 400);
    }
    if (!body.id || !body.email) {
      return jsonResponse({
        error: "Missing required fields",
        message: 'Both "id" and "email" are required'
      }, 400);
    }
    const db = getD1Database(env);
    const timestamp = getCurrentTimestamp();
    const existingUser = await db.prepare(
      "SELECT * FROM users WHERE id = ? OR email = ?"
    ).bind(body.id, body.email).first();
    if (existingUser) {
      const result2 = await db.prepare(
        `UPDATE users 
         SET name = ?, email = ?, updated_at = ?
         WHERE id = ? OR email = ?`
      ).bind(
        body.name || existingUser.name,
        body.email,
        timestamp,
        body.id,
        body.email
      ).run();
      if (!result2.success) {
        console.error("Database update error:", result2.error);
        return jsonResponse({
          error: "Database error",
          message: result2.error?.message || "Failed to update user"
        }, 500);
      }
      const updatedUser = await db.prepare(
        "SELECT * FROM users WHERE id = ? OR email = ?"
      ).bind(body.id, body.email).first();
      return jsonResponse({
        success: true,
        action: "updated",
        user: updatedUser
      });
    } else {
      const result2 = await db.prepare(
        `INSERT INTO users (id, name, email, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        body.id,
        body.name || "User",
        body.email,
        timestamp,
        timestamp
      ).run();
      if (!result2.success) {
        console.error("Database insert error:", result2.error);
        return jsonResponse({
          error: "Database error",
          message: result2.error?.message || "Failed to create user"
        }, 500);
      }
      const newUser = await db.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(body.id).first();
      return jsonResponse({
        success: true,
        action: "created",
        user: newUser
      });
    }
  } catch (error) {
    console.error("API error:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequest(context) {
  const { request } = context;
  if (request.method === "GET") {
    return onRequestGet(context);
  } else if (request.method === "POST") {
    return onRequestPost(context);
  } else if (request.method === "OPTIONS") {
    return createCORSResponse();
  } else {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var RESTAURANT_PLACE_IDS = {
  sunway_square: {
    "103 Coffee": "fbBLzNbbAhyC5EtD8",
    "A'Decade": "9cyHNx553ExuJ3hi6",
    "Armoury Steakhouse": "8cy6us9hjZZAfgQU7",
    "BESTORE": "bZcgGiT72iYHjSF37",
    "Black Canyon": "bDrUgbEaBWs6N9z76",
    "Ba Shu Jia Yan": "rAbFM3inKp4fiXjT6",
    "Beutea": "gTpa8hVRC3zoFKvX8",
    "Bread History": "YNf3xqP7gjnenGRz7",
    "Chagee": "hsHB84aUzaJMoYwV6",
    "Coffee Bean": "8UQKcnuq4poo2TtP7",
    "Christine's Bakery Cafe": "Vzi3pQPYAb4VPVWB7",
    "CHUCHAT": "HdHo9caEHwqE7FR46",
    "ChaPanda": null,
    "CU Mart": "81pYamF1w1PyF43R6",
    "Come Buy Yakiniku": "ieY95nnWVsQeYHQJ7",
    "Count (Flower Drum)": "iPbZbNnu8CbcaND67",
    "Chatramue": "Bw8NZrf3AmpLFkhK7",
    "DOZO": "fqCY31DUaC8ChX3o6",
    "Empire Sushi": null,
    "Far Coffee": "a7GEwwkEoMzeLmkZ9",
    "Fong Woh Tong": null,
    "Gong Luck Cafe": "Bceop6WU4we1Vu5S9",
    "Gokoku Japanese Bakery": "HwodhKyk5ZQ5m6LR9",
    "Gong Cha": null,
    "Hock Kee Kopitiam": "2yJdQL9CPr1oDr3z5",
    "Han Bun Sik": "xUT7WYerdouKGsoa7",
    "Happy Potato": "FVPDE4T5dpLSE7Mt5",
    "I'm Bagel": "aK4sMT9zBwCm1XeU7",
    "I LIKE & Yogurt In A Can": "LRsojAytvsBgzqpv9",
    "JP & CO": "56FcqA8teoZ5Ku4u6",
    "Kanteen": null,
    "Kenangan Coffee": "M2fq3Pfzwnyre2ni7",
    "Kedai Kopi Malaya": "C8hWQKMMUnd618Uc6",
    "Kha Coffee Roaster": "ngRqG79LMDokFfqr9",
    "LLAO LLAO": "AY2o8QkqQuucspDJ9",
    "Luckin": "hsrTZRaaK5UbvEHeA",
    "Manjoe": "3v2opuM9JvVk8RRS9",
    "Mix.Store": "GiJVi2Uqk4TibUpc7",
    "Mr. Wu": "3SrpfuxhL2SYk7aXA",
    "Missy Sushi": "sPSthzG1BSRjos1N6",
    "Nasi Lemak Shop": "jZBwji1p2b85ovuKA",
    "Nine Dragon Char Chan Teng (Kowloon Cafe)": "HCDjtpfo6AaBHprU8",
    "Nippon Sushi": "x9YSdRGxkuHrxiQm6",
    "Odon Beyond": "L53kDg7b1HyfrdKH6",
    "One Dish One Taste": null,
    "Pak Curry": "wn7z5CQfESoZG4iD9",
    "Ramen Mob": "zrcMQS1tvyWiEpya6",
    "Richeese Factory": "RNK7dyqkSNLNP2V8A",
    "Sweetie": null,
    "Salad Atelier": "tgAYaAv18MnbCtHr5",
    "Super Matcha": "6QjRZ6edKZofvyN27",
    "Shabuyaki by Nippon Sushi": null,
    "Stuff'D": "5yw6fwJcvoGT8GHc6",
    "Subway": null,
    "The Public House": "D3e43oMf2zMd7ASu5",
    "Tealive Plus": null,
    "Tang Gui Fei Tanghulu": "21VFJna44i6xYref9",
    "The Walking Hotpot Signature": "gPrcGRUEhAgAzCSJ7",
    "The Chicken Rice Shop": "mbxDFcZV8jzmBWaM6",
    "Village Grocer": "H3spKPGzaj6war8A9",
    "Yellow Bento": "XuXetfXJVGaxJNBG8",
    "Yonny": "UdP75iyUAGZJ6HgX8",
    "Yama by Hojichaya": "GNJeSQDHNkWJNa4KA",
    "Yogurt Planet": "wCyZNRzR3HJZka2y6",
    "Zus Coffee": "ciunsPEq5nqnp54g7",
    "Zok Noodle House": "gdejSbdHpXJHJe5X9"
  }
};
function getPlaceId(restaurantName, mallId = "sunway_square") {
  return RESTAURANT_PLACE_IDS[mallId]?.[restaurantName] || null;
}
__name(getPlaceId, "getPlaceId");
__name2(getPlaceId, "getPlaceId");
var MALL_RESTAURANTS = {
  sunway_square: [
    ["103 Coffee", "L1-07", "LG", "Coffee & Cafes", false],
    ["A'Decade", "L2-22", "L2", "Local & Malaysian", true],
    ["Armoury Steakhouse", "LG-05", "LG", "Western & International", false],
    ["BESTORE", "L1-39", "L1", "Snacks & Specialty Store", false],
    ["Black Canyon", "L1-40", "L1", "Western & International", true],
    ["Ba Shu Jia Yan", "LG-09 & LG-10", "LG", "Chinese & Taiwanese", false],
    ["Beutea", "LG1-02", "LG1", "Tea & Beverages", true],
    ["Bread History", "LG1-25", "LG1", "Bakery & Pastry", true],
    ["Chagee", "L1-04", "L1", "Tea & Beverages", true],
    ["Coffee Bean", "L1-31", "L1", "Coffee & Cafes", true],
    ["Christine's Bakery Cafe", "L1-42", "L1", "Bakery & Pastry", true],
    ["CHUCHAT", "L1-06", "L1", "Tea & Beverages", true],
    ["ChaPanda", "L2-01", "L2", "Tea & Beverages", true],
    ["CU Mart", "L2-28", "L2", "Korean & Convenience", false],
    ["Come Buy Yakiniku", "LG-01", "LG", "Japanese Cuisine", false],
    ["Count (Flower Drum)", "LG-06 & LG-07", "LG", "Chinese & Taiwanese", false],
    ["Chatramue", "LG1-18", "LG1", "Tea & Beverages", true],
    ["DOZO", "L1-41", "L1", "Japanese Cuisine", false],
    ["Empire Sushi", "LG1-22", "LG1", "Japanese Cuisine", true],
    ["Far Coffee", "L2-18A", "L2", "Coffee & Cafes", true],
    ["Fong Woh Tong", "LG1-23", "LG1", "Chinese & Taiwanese", true],
    ["Gong Luck Cafe", "L1-30", "L1", "Local & Malaysian", false],
    ["Gokoku Japanese Bakery", "L1-44", "L1", "Bakery & Pastry", true],
    ["Gong Cha", "L2-02", "L2", "Tea & Beverages", true],
    ["Hock Kee Kopitiam", "L1-43", "L1", "Local & Malaysian", true],
    ["Han Bun Sik", "L2-12", "L2", "Korean Cuisine", false],
    ["Happy Potato", "L2-04", "L2", "Snacks & Desserts", true],
    ["I'm Bagel", "L2-29", "L2", "Western & International", true],
    ["I LIKE & Yogurt In A Can", "L2-03", "L2", "Snacks & Desserts", true],
    ["JP & CO", "L1-45", "L1", "Western & International", true],
    ["Kanteen", "L1-08", "L1", "Local & Malaysian", true],
    ["Kenangan Coffee", "L2-08", "L2", "Coffee & Cafes", true],
    ["Kedai Kopi Malaya", "LG1-20", "LG1", "Local & Malaysian", true],
    ["Kha Coffee Roaster", "LG1-14", "LG1", "Coffee & Cafes", true],
    ["LLAO LLAO", "L1-14", "L1", "Snacks & Desserts", true],
    ["Luckin", "L1-05", "L1", "Coffee & Cafes", true],
    ["Manjoe", "L1-17", "L1", "Chinese & Taiwanese", false],
    ["Mix.Store", "LG-04", "LG", "Snacks & Specialty Store", false],
    ["Mr. Wu", "LG-11", "LG", "Chinese & Taiwanese", false],
    ["Missy Sushi", "LG-06", "LG", "Japanese Cuisine", false],
    ["Nasi Lemak Shop", "LG1-16", "LG1", "Local & Malaysian", true],
    ["Nine Dragon Char Chan Teng (Kowloon Cafe)", "LG1-13", "LG1", "Chinese & Taiwanese", false],
    ["Nippon Sushi", "LG1-01", "LG1", "Japanese Cuisine", true],
    ["Odon Beyond", "L1-03", "L1", "Japanese Cuisine", false],
    ["One Dish One Taste", "LG1-12B", "LG1", "Chinese & Taiwanese", false],
    ["Pak Curry", "LG1-26", "LG1", "Local & Malaysian", true],
    ["Ramen Mob", "L1-12", "L1", "Japanese Cuisine", false],
    ["Richeese Factory", "LG1-15", "LG1", "Fast Food", true],
    ["Sweetie", "LG1-24", "LG1", "Snacks & Desserts", true],
    ["Salad Atelier", "L1-01", "L1", "Western & International", true],
    ["Super Matcha", "L1-20", "L1", "Tea & Beverages", true],
    ["Shabuyaki by Nippon Sushi", "LG-12 & LG-13", "LG", "Japanese Cuisine", true],
    ["Stuff'D", "LG1-27", "LG1", "Western & International", true],
    ["Subway", "LG1-21", "LG1", "Fast Food", true],
    ["The Public House", "L1-09", "L1", "Western & International", false],
    ["Tealive Plus", "L2-30", "L2", "Tea & Beverages", true],
    ["Tang Gui Fei Tanghulu", "L2-17", "L2", "Snacks & Desserts", true],
    ["The Walking Hotpot Signature", "L2-23", "L2", "Chinese & Taiwanese", false],
    ["The Chicken Rice Shop", "LG1-10", "LG1", "Local & Malaysian", true],
    ["Village Grocer", "LG1-05 to LG1-09", "LG1", "Supermarket", false],
    ["Yellow Bento", "L2-01", "L2", "Japanese Cuisine", false],
    ["Yonny", "L1-32", "L1", "Chinese & Taiwanese", false],
    ["Yama by Hojichaya", "L2-10A", "L2", "Japanese Cuisine", true],
    ["Yogurt Planet", "LG1-19", "LG1", "Snacks & Desserts", true],
    ["Zus Coffee", "L1-02", "L1", "Coffee & Cafes", true],
    ["Zok Noodle House", "L2-24", "L2", "Chinese & Taiwanese", false]
  ]
};
var MALL_INFO = {
  sunway_square: {
    name: "Sunway Square",
    display_name: "Sunway Square Mall"
  }
};
var LOGO_MAPPING = {
  "103 Coffee": "103-coffee.png",
  "A'Decade": "a'decade.png",
  "Armoury Steakhouse": "armoury-steakhouse.png",
  "BESTORE": "bestore.png",
  "Black Canyon": "black-canyon.png",
  "Ba Shu Jia Yan": "ba-shu-jia-yan.png",
  "Beutea": "beutea.png",
  "Bread History": "bread-history.png",
  "Chagee": "chagee.png",
  "Coffee Bean": "coffee-bean.png",
  "Christine's Bakery Cafe": "christine's-bakery-cafe.png",
  "CHUCHAT": "chuchat.png",
  "ChaPanda": "chapanda.png",
  "CU Mart": "cumart.png",
  "Come Buy Yakiniku": "come-buy-yakiniku.png",
  "Count (Flower Drum)": "count(flower-drum).png",
  "Chatramue": "chatramue.png",
  "DOZO": "dozo.png",
  "Empire Sushi": "empire-sushi.png",
  "Far Coffee": "far-coffee.png",
  "Fong Woh Tong": "fong-woh-tong.png",
  "Gong Luck Cafe": "gong-luck-cafe.png",
  "Gokoku Japanese Bakery": "gokoku-japanese-bakery.png",
  "Gong Cha": "gong-cha.png",
  "Hock Kee Kopitiam": "hock-kee-kopitiam.png",
  "Han Bun Sik": "han-bun-sik.png",
  "Happy Potato": "happy-potato.png",
  "I'm Bagel": "i'm-bagel.png",
  "I LIKE & Yogurt In A Can": "i-like-&-yogurt-in-a-can.png",
  "JP & CO": "jp-&-co.png",
  "Kanteen": "kanteen.png",
  "Kenangan Coffee": "kenangan-coffee.png",
  "Kedai Kopi Malaya": "kedai-kopi-malaya.png",
  "Kha Coffee Roaster": "kha-coffee-roaster.png",
  "LLAO LLAO": "llao-llao.png",
  "Luckin": "luckin.png",
  "Manjoe": "manjoe.png",
  "Mix.Store": "mix.store.png",
  "Mr. Wu": "mr.wu.png",
  "Missy Sushi": "missy-sushi.jpeg",
  "Nasi Lemak Shop": "nasi-lemak-shop.png",
  "Nine Dragon Char Chan Teng (Kowloon Cafe)": "nine-dragon-char-chan-teng-(kowloon-cafe).png",
  "Nippon Sushi": "nippon-sushi.png",
  "Odon Beyond": "odon-beyond.png",
  "One Dish One Taste": "one-dish-one-taste.png",
  "Pak Curry": "pak-curry.png",
  "Ramen Mob": "ramen-mob.png",
  "Richeese Factory": "richeese-factory.png",
  "Sweetie": "sweetie.jpg",
  "Salad Atelier": "salad-atelier.png",
  "Super Matcha": "super-matcha.png",
  "Shabuyaki by Nippon Sushi": "shabuyaki-by-nippon-sushi.png",
  "Stuff'D": "stuff'd.png",
  "Subway": "subway.png",
  "The Public House": "the-public-house.png",
  "Tealive Plus": "tealive-plus.png",
  "Tang Gui Fei Tanghulu": "tang-gui-fei-tanghulu.png",
  "The Walking Hotpot Signature": "the-walking-hotpot-signature.png",
  "The Chicken Rice Shop": "the-chicken-rice-shop.png",
  "Village Grocer": "village-grocer.png",
  "Yellow Bento": "yellow-bento.jpeg",
  "Yonny": "yonny.png",
  "Yama by Hojichaya": "yama-by-hojichaya.png",
  "Yogurt Planet": "yogurt-planet.png",
  "Zus Coffee": "zus-coffee.png",
  "Zok Noodle House": "zok-noodle-house.png"
};
function getLogoPath(restaurantName, mallId = "sunway_square") {
  const logoFilename = LOGO_MAPPING[restaurantName];
  if (logoFilename) {
    return `images/logo/${logoFilename}`;
  }
  return null;
}
__name(getLogoPath, "getLogoPath");
__name2(getLogoPath, "getLogoPath");
function getGoogleMapsLink(restaurantName, mallId = "sunway_square") {
  const placeId = getPlaceId(restaurantName, mallId);
  if (placeId) {
    return `https://maps.app.goo.gl/${placeId}`;
  }
  return null;
}
__name(getGoogleMapsLink, "getGoogleMapsLink");
__name2(getGoogleMapsLink, "getGoogleMapsLink");
function getAvailableMalls() {
  return Object.keys(MALL_RESTAURANTS);
}
__name(getAvailableMalls, "getAvailableMalls");
__name2(getAvailableMalls, "getAvailableMalls");
function getMallInfo(mallId) {
  return MALL_INFO[mallId] || { name: mallId, display_name: mallId };
}
__name(getMallInfo, "getMallInfo");
__name2(getMallInfo, "getMallInfo");
function getRestaurantsByMall(mallId) {
  return MALL_RESTAURANTS[mallId] || [];
}
__name(getRestaurantsByMall, "getRestaurantsByMall");
__name2(getRestaurantsByMall, "getRestaurantsByMall");
function getRestaurantsByCategories(categories, mallId = "sunway_square", dietaryNeed = "any") {
  const restaurants = getRestaurantsByMall(mallId);
  const matchingRestaurants = [];
  for (const restaurant of restaurants) {
    const [name, unit, floor, category, isHalal] = restaurant;
    if (!categories.includes(category)) {
      continue;
    }
    if (dietaryNeed === "halal_pork_free" && !isHalal) {
      continue;
    }
    const logoPath = getLogoPath(name, mallId);
    matchingRestaurants.push({
      name,
      unit,
      floor,
      category,
      isHalal,
      logo: logoPath
    });
  }
  return matchingRestaurants;
}
__name(getRestaurantsByCategories, "getRestaurantsByCategories");
__name2(getRestaurantsByCategories, "getRestaurantsByCategories");
function getAllCategories(mallId = "sunway_square") {
  const restaurants = getRestaurantsByMall(mallId);
  const categories = /* @__PURE__ */ new Set();
  for (const restaurant of restaurants) {
    categories.add(restaurant[3]);
  }
  return Array.from(categories).sort();
}
__name(getAllCategories, "getAllCategories");
__name2(getAllCategories, "getAllCategories");
async function onRequest2(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get("mall_id") || "sunway_square";
    const categories = getAllCategories(mallId);
    return jsonResponse({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
async function onRequest3(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  try {
    return jsonResponse({
      status: "ok",
      message: "WheelEat API is running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var CACHE_TTL_SECONDS = 300;
function toRestaurantObject(row, mallId) {
  if (!Array.isArray(row)) return null;
  const [name, unit, floor, category] = row;
  if (!name) return null;
  return {
    name,
    unit: unit || null,
    floor: floor || null,
    category: category || "Unknown",
    logo: getLogoPath(name, mallId)
  };
}
__name(toRestaurantObject, "toRestaurantObject");
__name2(toRestaurantObject, "toRestaurantObject");
function normalizeName(input) {
  return String(input || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}
__name(normalizeName, "normalizeName");
__name2(normalizeName, "normalizeName");
function tokenize(s) {
  const norm = normalizeName(s);
  return norm ? norm.split(" ").filter(Boolean) : [];
}
__name(tokenize, "tokenize");
__name2(tokenize, "tokenize");
function matchScore(aName, bName) {
  const a = tokenize(aName);
  const b = tokenize(bName);
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = (/* @__PURE__ */ new Set([...setA, ...setB])).size || 1;
  const jaccard = inter / union;
  const exact = normalizeName(aName) === normalizeName(bName) ? 1 : 0;
  return jaccard + exact;
}
__name(matchScore, "matchScore");
__name2(matchScore, "matchScore");
function pickBestMatch(targetName, places) {
  const target = normalizeName(targetName);
  if (!target) return null;
  let best = null;
  let bestScore = -1;
  for (const p of places) {
    const pn = p?.name;
    if (!pn) continue;
    const score = matchScore(targetName, pn);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 0.4 ? best : null;
}
__name(pickBestMatch, "pickBestMatch");
__name2(pickBestMatch, "pickBestMatch");
async function fetchPlaceDetails(placeId, apiKey) {
  if (!placeId || !apiKey) return null;
  try {
    const baseUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount"
      }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.displayName?.text || data.displayName,
        rating: data.rating,
        user_ratings_total: data.userRatingCount,
        place_id: data.id || placeId
      };
    }
    return await fetchPlaceDetailsLegacy(placeId, apiKey);
  } catch (error) {
    console.log(`New Places API error for place_id ${placeId}, trying legacy: ${error.message}`);
    return await fetchPlaceDetailsLegacy(placeId, apiKey);
  }
}
__name(fetchPlaceDetails, "fetchPlaceDetails");
__name2(fetchPlaceDetails, "fetchPlaceDetails");
async function fetchPlaceDetailsLegacy(placeId, apiKey) {
  if (!placeId || !apiKey) return null;
  try {
    const baseUrl = "https://maps.googleapis.com/maps/api/place/details/json";
    const url = new URL(baseUrl);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("fields", "name,rating,user_ratings_total,place_id");
    console.log(`Fetching Place Details for ${placeId}...`);
    let res;
    try {
      res = await fetch(url.toString());
    } catch (error) {
      if (error.message && error.message.includes("Too many subrequests")) {
        console.error(`\u26A0\uFE0F Cloudflare subrequest limit reached for ${placeId}. This is a Cloudflare Pages limit, not an API issue.`);
        throw error;
      }
      throw error;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Place Details API failed: HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (data.status === "OK" && data.result) {
      return {
        name: data.result.name,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        place_id: data.result.place_id || placeId
      };
      if (result.rating !== null && result.rating !== void 0) {
        console.log(`\u2705 Place Details API success for ${placeId}: rating=${result.rating}, reviews=${result.user_ratings_total}`);
      } else {
        console.log(`\u26A0\uFE0F Place Details API found ${placeId} but no rating available (name: ${result.name})`);
      }
      return result;
    }
    console.warn(`Place Details API returned OK but no result for ${placeId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error.message);
    return null;
  }
}
__name(fetchPlaceDetailsLegacy, "fetchPlaceDetailsLegacy");
__name2(fetchPlaceDetailsLegacy, "fetchPlaceDetailsLegacy");
async function fetchPlacesForQuery(query, apiKey) {
  try {
    const baseUrl = "https://places.googleapis.com/v1/places:searchText";
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 10
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 404 || res.status === 403) {
        console.log(`New Places API not available, trying legacy API for query: "${query}"`);
        return await fetchPlacesForQueryLegacy(query, apiKey);
      }
      throw new Error(`Google Places API (New) failed: HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (data.places && Array.isArray(data.places)) {
      return data.places.map((place) => ({
        name: place.displayName?.text || place.displayName,
        rating: place.rating,
        user_ratings_total: place.userRatingCount,
        place_id: place.id
      }));
    }
    return [];
  } catch (error) {
    console.log(`New Places API error, trying legacy API: ${error.message}`);
    return await fetchPlacesForQueryLegacy(query, apiKey);
  }
}
__name(fetchPlacesForQuery, "fetchPlacesForQuery");
__name2(fetchPlacesForQuery, "fetchPlacesForQuery");
async function fetchPlacesForQueryLegacy(query, apiKey) {
  const baseUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
  const url = new URL(baseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Places Text Search (Legacy) failed: HTTP ${res.status} - ${text}`);
  }
  const data = await res.json();
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    const errorMsg = data.error_message || data.status;
    console.error(`Google Places API (Legacy) error for query "${query}": ${data.status} - ${errorMsg}`);
    throw new Error(`Google Places API (Legacy) error: ${data.status} - ${errorMsg}`);
  }
  return Array.isArray(data?.results) ? data.results : [];
}
__name(fetchPlacesForQueryLegacy, "fetchPlacesForQueryLegacy");
__name2(fetchPlacesForQueryLegacy, "fetchPlacesForQueryLegacy");
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  __name(worker, "worker");
  __name2(worker, "worker");
  const workers = [];
  const n = Math.max(1, Math.min(limit, items.length));
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
__name(mapWithConcurrency, "mapWithConcurrency");
__name2(mapWithConcurrency, "mapWithConcurrency");
async function onRequest4(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return createCORSResponse();
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get("mall_id") || "sunway_square";
    const urlParams = new URL(request.url).searchParams;
    const skipCache = urlParams.get("nocache") === "1";
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cached = skipCache ? null : await cache.match(cacheKey);
    if (cached) return cached;
    const mallInfo = getMallInfo(mallId);
    const raw = getRestaurantsByMall(mallId);
    const restaurants = (Array.isArray(raw) ? raw : []).map((row) => toRestaurantObject(row, mallId)).filter(Boolean);
    const apiKey = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("\u274C GOOGLE_PLACES_API_KEY not found in environment variables");
      console.error("Available env keys:", Object.keys(env).filter((k) => k.includes("GOOGLE") || k.includes("API")));
      const fallback = {
        mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
        source: "static_only",
        cached_ttl_seconds: CACHE_TTL_SECONDS,
        restaurants: restaurants.map((r) => ({
          name: r.name,
          unit: r.unit || null,
          floor: r.floor || null,
          category: r.category || "Unknown",
          logo: r.logo || null,
          rating: null,
          reviews: null,
          google: null
        }))
      };
      const headers2 = new Headers();
      headers2.set("Content-Type", "application/json");
      headers2.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
      return new Response(JSON.stringify(fallback), { status: 200, headers: headers2 });
    }
    const mallQueryName = mallInfo?.display_name || mallInfo?.name || mallId;
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    let subrequestLimitHit = false;
    const enriched = await mapWithConcurrency(restaurants, 2, async (r) => {
      try {
        const placeId = getPlaceId(r.name, mallId);
        let match2 = null;
        let debugInfo = null;
        if (placeId) {
          console.log(`Looking up place_id for "${r.name}": ${placeId}, apiKey present: ${!!apiKey}`);
          match2 = await fetchPlaceDetails(placeId, apiKey);
          if (match2) {
            if (match2.rating !== null && match2.rating !== void 0) {
              successCount++;
              console.log(`\u2705 Place Details API success for "${r.name}": rating=${match2.rating}, reviews=${match2.user_ratings_total}`);
            } else {
              console.log(`\u26A0\uFE0F Place found for "${r.name}" but no rating available (place_id: ${placeId})`);
              debugInfo = { method: "place_details", place_id: placeId, found: true, has_rating: false };
            }
            return {
              ...r,
              rating: typeof match2.rating === "number" ? match2.rating : null,
              reviews: typeof match2.user_ratings_total === "number" ? match2.user_ratings_total : null,
              google: {
                place_id: match2.place_id || placeId,
                name: match2.name || null
              },
              _debug: debugInfo || { method: "place_details", place_id: placeId, found: true, has_rating: true }
            };
          } else {
            const isSubrequestLimit = match2 === null && placeId;
            console.error(`\u274C Place Details API failed for "${r.name}" (place_id: ${placeId})`);
            console.error(`   - apiKey present: ${!!apiKey}`);
            console.error(`   - apiKey length: ${apiKey ? apiKey.length : 0}`);
            if (isSubrequestLimit) {
              console.error(`   - \u26A0\uFE0F Likely hit Cloudflare "Too many subrequests" limit`);
              subrequestLimitHit = true;
            }
            if (subrequestLimitHit) {
              console.error(`   - Skipping text search fallback (subrequest limit reached)`);
              debugInfo = {
                method: "place_details",
                place_id: placeId,
                found: false,
                fallback: "skipped_due_to_limit",
                apiKey_present: !!apiKey,
                apiKey_length: apiKey ? apiKey.length : 0,
                error: "Too many subrequests (Cloudflare limit)"
              };
              return {
                ...r,
                rating: null,
                reviews: null,
                google: null,
                _debug: debugInfo
              };
            }
            console.error(`   - Falling back to text search`);
            debugInfo = {
              method: "place_details",
              place_id: placeId,
              found: false,
              fallback: "text_search",
              apiKey_present: !!apiKey,
              apiKey_length: apiKey ? apiKey.length : 0,
              error: isSubrequestLimit ? "Too many subrequests (Cloudflare limit)" : "Unknown"
            };
          }
        }
        if (subrequestLimitHit && !placeId) {
          console.log(`Skipping text search for "${r.name}" (subrequest limit reached)`);
          return {
            ...r,
            rating: null,
            reviews: null,
            google: null,
            _debug: { method: "text_search", found: false, skipped: "subrequest_limit" }
          };
        }
        const queries = [
          `${r.name} ${mallQueryName}`,
          `${r.name} Sunway Square`,
          r.name
          // Just the restaurant name
        ];
        let candidates = [];
        for (const query of queries) {
          try {
            const results = await fetchPlacesForQuery(query, apiKey);
            candidates = candidates.concat(results);
            if (results.length > 0) break;
          } catch (e) {
            continue;
          }
        }
        const uniqueCandidates = [];
        const seenPlaceIds = /* @__PURE__ */ new Set();
        for (const candidate of candidates) {
          const pid = candidate.place_id;
          if (pid && !seenPlaceIds.has(pid)) {
            seenPlaceIds.add(pid);
            uniqueCandidates.push(candidate);
          } else if (!pid) {
            uniqueCandidates.push(candidate);
          }
        }
        match2 = pickBestMatch(r.name, uniqueCandidates);
        if (match2) {
          successCount++;
        } else {
          errorCount++;
          if (errorCount <= 3) {
            console.log(`No match found for "${r.name}" - found ${candidates.length} candidates`);
          }
        }
        return {
          ...r,
          rating: typeof match2?.rating === "number" ? match2.rating : null,
          reviews: typeof match2?.user_ratings_total === "number" ? match2.user_ratings_total : null,
          google: match2 ? {
            place_id: match2.place_id || null,
            name: match2.name || null
          } : null,
          _debug: debugInfo || (placeId ? { method: "place_details", place_id: placeId, found: false } : { method: "text_search", found: match2 !== null })
        };
      } catch (e) {
        errorCount++;
        const errorMsg = e.message || String(e);
        errors.push({ restaurant: r.name, error: errorMsg });
        if (errorMsg.includes("Too many subrequests")) {
          console.error(`\u26A0\uFE0F Cloudflare subrequest limit reached for "${r.name}". This is a Cloudflare Pages limit (typically 50 subrequests per request).`);
          console.error(`   Consider reducing concurrency or implementing request batching.`);
        } else {
          if (errors.length <= 3) {
            console.error(`Error fetching Places data for "${r.name}":`, errorMsg);
          }
        }
        return { ...r, rating: null, reviews: null, google: null };
      }
    });
    console.log(`Leaderboard enrichment complete: ${successCount} matched, ${errorCount} failed, ${errors.length} errors`);
    if (errors.length > 0 && errors.length <= 5) {
      console.error("Sample errors:", errors);
    }
    const withRatings = enriched.filter((r) => r.rating !== null).length;
    const total = enriched.length;
    const restaurantsClean = enriched.map(({ _debug, ...rest }) => rest);
    const body = {
      mall: { id: mallId, name: mallInfo?.name, display_name: mallInfo?.display_name },
      source: "google_places_textsearch_per_restaurant",
      cached_ttl_seconds: CACHE_TTL_SECONDS,
      restaurants: restaurantsClean,
      _debug: {
        total_restaurants: total,
        restaurants_with_ratings: withRatings,
        restaurants_without_ratings: total - withRatings,
        // Include debug info for restaurants without ratings (for troubleshooting)
        restaurants_without_ratings_debug: enriched.filter((r) => r.rating === null).map((r) => ({
          name: r.name,
          has_place_id: !!getPlaceId(r.name, mallId),
          place_id: getPlaceId(r.name, mallId),
          debug: r._debug
        }))
      }
    };
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    headers.set("Vary", "Accept-Encoding");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400");
    const response = new Response(JSON.stringify(body), { status: 200, headers });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error("Error in leaderboard endpoint:", error);
    return jsonResponse(
      {
        error: "Internal server error",
        message: error.message
      },
      500
    );
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
async function onRequest5(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  try {
    const malls = [];
    const mallIds = getAvailableMalls();
    for (const mallId of mallIds) {
      const info = getMallInfo(mallId);
      malls.push({
        id: mallId,
        name: info.name,
        display_name: info.display_name
      });
    }
    return jsonResponse({ malls });
  } catch (error) {
    console.error("Error fetching malls:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
async function onRequest6(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get("mall_id") || "sunway_square";
    const dietaryNeed = url.searchParams.get("dietary_need") || "any";
    let restaurants;
    const categoriesParam = url.searchParams.get("categories");
    if (categoriesParam) {
      const categoryList = categoriesParam.split(",").map((c) => c.trim());
      restaurants = getRestaurantsByCategories(categoryList, mallId, dietaryNeed);
    } else {
      const allCategories = getAllCategories(mallId);
      restaurants = getRestaurantsByCategories(allCategories, mallId, dietaryNeed);
    }
    return jsonResponse({
      restaurants,
      count: restaurants.length
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequest6, "onRequest6");
__name2(onRequest6, "onRequest");
async function onRequest7(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return createCORSResponse();
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ detail: "Invalid JSON in request body" }, 400);
    }
    if (!body || !body.selected_categories || body.selected_categories.length === 0) {
      return jsonResponse({ detail: "At least one category must be selected" }, 400);
    }
    const mallId = body.mall_id || "sunway_square";
    const selectedCategories = body.selected_categories;
    const availableRestaurants = getRestaurantsByCategories(selectedCategories, mallId);
    if (availableRestaurants.length === 0) {
      return jsonResponse({ detail: "No restaurants found in selected categories" }, 400);
    }
    const selectedRestaurant = availableRestaurants[Math.floor(Math.random() * availableRestaurants.length)];
    try {
      const db = getD1Database(env);
      const spinId = generateUUID();
      const timestamp = getCurrentTimestamp();
      const result2 = await db.prepare(
        `INSERT INTO spin_logs (
          id, restaurant_name, restaurant_unit, restaurant_floor,
          category, dietary_need, timestamp, mall_id, selected_categories, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        spinId,
        selectedRestaurant.name,
        selectedRestaurant.unit || null,
        selectedRestaurant.floor || null,
        selectedRestaurant.category,
        body.dietary_need || "any",
        timestamp,
        mallId,
        JSON.stringify(selectedCategories),
        timestamp
      ).run();
      if (!result2.success) {
        console.error("Database error:", result2.error);
      }
      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: new Date(timestamp * 1e3).toISOString(),
        spin_id: spinId,
        logo: selectedRestaurant.logo,
        google_maps_link: getGoogleMapsLink(selectedRestaurant.name, mallId)
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return jsonResponse({
        restaurant_name: selectedRestaurant.name,
        restaurant_unit: selectedRestaurant.unit,
        restaurant_floor: selectedRestaurant.floor,
        category: selectedRestaurant.category,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        spin_id: null,
        logo: selectedRestaurant.logo,
        google_maps_link: getGoogleMapsLink(selectedRestaurant.name, mallId)
      });
    }
  } catch (error) {
    console.error("Error in spin endpoint:", error);
    return jsonResponse({
      error: "Internal server error",
      message: error.message
    }, 500);
  }
}
__name(onRequest7, "onRequest7");
__name2(onRequest7, "onRequest");
var routes = [
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/leaderboard",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/malls",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/restaurants",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/spin",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result2 = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result3 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result3 += value2;
    }
    return result3;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result2[result2.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result2.push(path);
        path = "";
      }
      result2.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result2.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result2.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result2;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result2 = handlerIterator.next();
      if (result2.done === false) {
        const { handler, params, path } = result2.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-YhKUjg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-YhKUjg/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.4600929642395343.js.map
