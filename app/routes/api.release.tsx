import { createReleaseSession, getActiveReleaseSession, revokeReleaseSessions } from "~/lib/db.server";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/api.release";

export async function loader({ request }: Route.LoaderArgs) {
  const session = getActiveReleaseSession();
  return { active: !!session, expiresAt: session?.expires_at || null };
}

export async function action({ request }: Route.ActionArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (!isAuth) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "release") {
    const duration = parseInt(String(formData.get("duration") || "60"), 10);
    const session = createReleaseSession(duration);
    return { success: true, expiresAt: session.expires_at };
  }

  if (intent === "revoke") {
    revokeReleaseSessions();
    return { success: true };
  }

  return { error: "Unknown intent" };
}
