import { data } from "react-router";
import { getCurrentRatings, setRating } from "~/lib/db.server";
import { today } from "~/lib/dates";
import type { Route } from "./+types/api.ratings";

export async function loader(_: Route.LoaderArgs) {
  return data({ current: getCurrentRatings() });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "set") {
    const activityId = Number(formData.get("activityId"));
    const rating = Number(formData.get("rating"));
    if (!activityId || !rating) {
      return data({ error: "Missing activityId or rating" }, { status: 400 });
    }
    const result = setRating(activityId, rating, today());
    if (!result.success) {
      return data({ error: result.error }, { status: 400 });
    }
    return data(result);
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}
