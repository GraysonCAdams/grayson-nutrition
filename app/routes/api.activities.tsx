import { data } from "react-router";
import { getAllActivities, createActivity, updateActivity, deleteActivity } from "~/lib/db.server";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/api.activities";

export async function loader(_: Route.LoaderArgs) {
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
    const baseline_week = formData.get("baseline_week") ? Number(formData.get("baseline_week")) : undefined;
    const max_per_day = formData.get("max_per_day") ? Number(formData.get("max_per_day")) : undefined;
    const notesRaw = formData.get("notes");
    const notes = notesRaw === null ? undefined : (String(notesRaw).trim() === "" ? null : String(notesRaw));
    if (!name || !category || !color) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }
    const id = createActivity({ name, category, color, icon, baseline_week, max_per_day, notes });
    return data({ success: true, id });
  }

  if (intent === "update") {
    const id = Number(formData.get("id"));
    const updates: any = {};
    for (const field of ["name", "category", "color", "icon"]) {
      const val = formData.get(field);
      if (val !== null) updates[field] = String(val);
    }
    for (const field of ["baseline_week", "max_per_day", "sort_order"]) {
      const val = formData.get(field);
      if (val !== null) updates[field] = Number(val);
    }
    const notesVal = formData.get("notes");
    if (notesVal !== null) {
      const trimmed = String(notesVal);
      updates.notes = trimmed.trim() === "" ? null : trimmed;
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
