import { onRequestGet as __api_users_js_onRequestGet } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\users.js"
import { onRequestPost as __api_users_js_onRequestPost } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\users.js"
import { onRequest as __api_categories_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\categories.js"
import { onRequest as __api_health_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\health.js"
import { onRequest as __api_leaderboard_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\leaderboard.js"
import { onRequest as __api_malls_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\malls.js"
import { onRequest as __api_restaurants_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\restaurants.js"
import { onRequest as __api_spin_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\spin.js"
import { onRequest as __api_users_js_onRequest } from "D:\\WheelEatNew\\WheelEat\\functions\\api\\users.js"

export const routes = [
    {
      routePath: "/api/users",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_users_js_onRequestGet],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_users_js_onRequestPost],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_categories_js_onRequest],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_health_js_onRequest],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_leaderboard_js_onRequest],
    },
  {
      routePath: "/api/malls",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_malls_js_onRequest],
    },
  {
      routePath: "/api/restaurants",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_restaurants_js_onRequest],
    },
  {
      routePath: "/api/spin",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_spin_js_onRequest],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_users_js_onRequest],
    },
  ]