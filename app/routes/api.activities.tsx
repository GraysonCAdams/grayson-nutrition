import { data } from "react-router";
import { getAllActivities, createActivity, updateActivity, deleteActivity } from "~/lib/db.server";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/api.activities";

export async function loader({ request }: Route.LoaderArgs) {
  return data({ activities: getAllActivities() });
}

export async function action({ request }: Route.ActionArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (!isAuth) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = String(formData.get("name"));
    const category = String(formData.get("category"));
    const color = String(formData.get("color"));
    const icon = formData.get("icon") ? String(formData.get("icon")) : undefined;
    if (!name || !category || !color) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }
    const id = createActivity({ name, category, color, icon });
    return data({ success: true, id });
  }

  if (intent === "update") {
    const id = Number(formData.get("id"));
    const updates: any = {};
    for (const field of ["name", "category", "color", "icon"]) {
      const val = formData.get(field);
      if (val !== null) updates[field] = String(val);
    }
    updateActivity(id, updates);
    return data({ success: true });
  }

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    deleteActivity(id);
    return data({ success: true });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}
