import { createCookieSessionStorage } from "react-router";
import { getSetting, setSetting } from "./db.server";
import crypto from "crypto";

function getSessionSecret(): string {
  let secret = getSetting("session_secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    setSetting("session_secret", secret);
  }
  return secret;
}

let sessionStorage: ReturnType<typeof createCookieSessionStorage>;

export function getSessionStorage() {
  if (!sessionStorage) {
    sessionStorage = createCookieSessionStorage({
      cookie: {
        name: "__nutrition_session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets: [getSessionSecret()],
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    });
  }
  return sessionStorage;
}

export async function getNutritionistSession(request: Request) {
  const storage = getSessionStorage();
  return storage.getSession(request.headers.get("Cookie"));
}

export async function isNutritionistAuthenticated(request: Request): Promise<boolean> {
  const session = await getNutritionistSession(request);
  return session.get("role") === "nutritionist";
}

export async function commitSession(session: any) {
  return getSessionStorage().commitSession(session);
}

export async function destroySession(session: any) {
  return getSessionStorage().destroySession(session);
}
