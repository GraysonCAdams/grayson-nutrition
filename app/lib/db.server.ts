import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { SEED_ACTIVITIES } from "./constants";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "nutrition.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('baseline','weekly_challenge')),
      color TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      baseline_week INTEGER,
      max_per_day INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL REFERENCES activities(id),
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed activities if empty
  const count = db.prepare("SELECT COUNT(*) as count FROM activities").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(
      "INSERT INTO activities (name, category, color, icon, sort_order, baseline_week, max_per_day) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const seedMany = db.transaction(() => {
      for (const a of SEED_ACTIVITIES) {
        insert.run(a.name, a.category, a.color, a.icon, a.sort_order, a.baseline_week, a.max_per_day);
      }
    });
    seedMany();
  }

  // Week 4 migration: rename water challenge, add new challenges
  const waterChallenge = db.prepare("SELECT id FROM activities WHERE name = 'Drink water before coffee'").get() as { id: number } | undefined;
  if (waterChallenge) {
    db.prepare("UPDATE activities SET name = 'Drink water around coffee time' WHERE id = ?").run(waterChallenge.id);
  }
  const week4Check = db.prepare("SELECT COUNT(*) as count FROM activities WHERE baseline_week = 4").get() as { count: number };
  if (week4Check.count === 0) {
    const insert = db.prepare(
      "INSERT INTO activities (name, category, color, icon, sort_order, baseline_week, max_per_day) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    insert.run("Mid-morning snack", "weekly_challenge", "#FBBF24", "🥜", 6, 4, 1);
    insert.run("More balanced dessert", "weekly_challenge", "#34D399", "🍨", 7, 4, 1);
  }
}

// Activity queries
export function getAllActivities() {
  return getDb().prepare("SELECT * FROM activities WHERE active = 1 ORDER BY category, sort_order").all() as Activity[];
}

export function getActivity(id: number) {
  return getDb().prepare("SELECT * FROM activities WHERE id = ?").get(id) as Activity | undefined;
}

export function findActivityByName(name: string): Activity | undefined {
  return getDb().prepare(
    "SELECT * FROM activities WHERE LOWER(name) = LOWER(?) AND active = 1"
  ).get(name) as Activity | undefined;
}

export function createActivity(data: { name: string; category: string; color: string; icon?: string; sort_order?: number; baseline_week?: number; max_per_day?: number }) {
  const result = getDb().prepare(
    "INSERT INTO activities (name, category, color, icon, sort_order, baseline_week, max_per_day) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(data.name, data.category, data.color, data.icon || null, data.sort_order || 0, data.baseline_week ?? null, data.max_per_day ?? 1);
  return result.lastInsertRowid;
}

export function updateActivity(id: number, data: { name?: string; category?: string; color?: string; icon?: string; sort_order?: number; active?: number }) {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  values.push(id);
  getDb().prepare(`UPDATE activities SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteActivity(id: number) {
  getDb().prepare("UPDATE activities SET active = 0 WHERE id = ?").run(id);
}

// Entry queries
export function getEntriesForDateRange(startDate: string, endDate: string) {
  return getDb().prepare(`
    SELECT e.*, a.name as activity_name, a.category, a.color, a.icon
    FROM entries e
    JOIN activities a ON e.activity_id = a.id
    WHERE e.date >= ? AND e.date <= ?
    ORDER BY e.date, a.category, a.sort_order
  `).all(startDate, endDate) as EntryWithActivity[];
}

export function addEntry(activityId: number, date: string) {
  // Check max_per_day limit
  const activity = getActivity(activityId);
  if (!activity) {
    return { id: null, success: false, error: "Activity not found" };
  }

  const currentCount = getDb().prepare(
    "SELECT COUNT(*) as count FROM entries WHERE activity_id = ? AND date = ?"
  ).get(activityId, date) as { count: number };

  if (currentCount.count >= activity.max_per_day) {
    const label = activity.max_per_day === 1 ? "Already logged for this day" : `Already logged ${activity.max_per_day}x for this day`;
    return { id: null, success: false, error: label };
  }

  const result = getDb().prepare(
    "INSERT INTO entries (activity_id, date) VALUES (?, ?)"
  ).run(activityId, date);
  return { id: result.lastInsertRowid, success: true };
}

export function removeEntry(entryId: number) {
  getDb().prepare("DELETE FROM entries WHERE id = ?").run(entryId);
}

// Review queries
export function getLatestReview() {
  return getDb().prepare("SELECT * FROM reviews ORDER BY reviewed_at DESC LIMIT 1").get() as Review | undefined;
}

export function markReview(notes?: string) {
  getDb().prepare("INSERT INTO reviews (notes) VALUES (?)").run(notes || null);
}

// Release session queries
export function createReleaseSession(durationMinutes: number = 60): ReleaseSession {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const result = getDb().prepare(
    "INSERT INTO release_sessions (expires_at) VALUES (?)"
  ).run(expiresAt);
  return { id: Number(result.lastInsertRowid), expires_at: expiresAt, created_at: new Date().toISOString() };
}

export function getActiveReleaseSession(): ReleaseSession | undefined {
  return getDb().prepare(
    "SELECT * FROM release_sessions WHERE expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).get() as ReleaseSession | undefined;
}

export function revokeReleaseSessions() {
  getDb().prepare("DELETE FROM release_sessions").run();
}

// Settings queries
export function getSetting(key: string): string | undefined {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string) {
  getDb().prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

// Types
export interface Activity {
  id: number;
  name: string;
  category: string;
  color: string;
  icon: string | null;
  sort_order: number;
  active: number;
  baseline_week: number | null;
  max_per_day: number;
  created_at: string;
}

export interface Entry {
  id: number;
  activity_id: number;
  date: string;
  created_at: string;
}

export interface EntryWithActivity extends Entry {
  activity_name: string;
  category: string;
  color: string;
  icon: string | null;
}

export interface Review {
  id: number;
  reviewed_at: string;
  notes: string | null;
}

export interface ReleaseSession {
  id: number;
  expires_at: string;
  created_at: string;
}
