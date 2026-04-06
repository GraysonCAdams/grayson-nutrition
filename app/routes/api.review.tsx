import { data } from "react-router";
import { markReview } from "~/lib/db.server";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/api.review";

export async function action({ request }: Route.ActionArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (!isAuth) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const notes = formData.get("notes") ? String(formData.get("notes")) : undefined;
  markReview(notes);
  return data({ success: true });
}
