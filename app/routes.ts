import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("client", "routes/client.tsx"),
  route("nutritionist", "routes/nutritionist.tsx", [
    route("login", "routes/nutritionist.login.tsx"),
    route("settings", "routes/nutritionist.settings.tsx"),
  ]),
  route("api/entries", "routes/api.entries.tsx"),
  route("api/activities", "routes/api.activities.tsx"),
  route("api/review", "routes/api.review.tsx"),
  route("api/release", "routes/api.release.tsx"),
] satisfies RouteConfig;
