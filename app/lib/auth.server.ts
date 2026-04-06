import bcrypt from "bcryptjs";
import { getSetting, setSetting } from "./db.server";

const PASSWORD_KEY = "nutritionist_password_hash";

export function isPasswordSet(): boolean {
  return !!getSetting(PASSWORD_KEY);
}

export async function setPassword(password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  setSetting(PASSWORD_KEY, hash);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = getSetting(PASSWORD_KEY);
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}
