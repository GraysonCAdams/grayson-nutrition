import { data } from "react-router";
import { addEntry, findActivityByName, removeEntry } from "~/lib/db.server";
import type { Route } from "./+types/api.entries";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add") {
    const activityId = Number(formData.get("activityId"));
    const date = String(formData.get("date"));
    if (!activityId || !date) {
      return data({ error: "Missing activityId or date" }, { status: 400 });
    }
    const result = addEntry(activityId, date);
    return data(result);
  }

  if (intent === "add-by-name") {
    const activityName = String(formData.get("activityName"));
    const date = String(formData.get("date"));
    if (!activityName || !date) {
      return data({ error: "Missing activityName or date" }, { status: 400 });
    }
    const activity = findActivityByName(activityName);
    if (!activity) {
      return data({ error: "Activity not found" }, { status: 404 });
    }
    const result = addEntry(activity.id, date);
    return data(result);
  }

  if (intent === "remove") {
    const entryId = Number(formData.get("entryId"));
    if (!entryId) {
      return data({ error: "Missing entryId" }, { status: 400 });
    }
    removeEntry(entryId);
    return data({ success: true });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}
