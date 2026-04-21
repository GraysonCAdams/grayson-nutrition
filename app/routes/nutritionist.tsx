import { useState } from "react";
import { useLoaderData, useFetcher, Outlet, useLocation } from "react-router";
import { redirect } from "react-router";
import {
  getAllActivities,
  getCurrentRatings,
  getAllRatingHistory,
  type Activity,
  type ActivityRating,
} from "~/lib/db.server";
import { today } from "~/lib/dates";
import {
  CATEGORIES,
  ACTIVITY_COLORS,
  WEEK_COLORS,
  TIMES_OF_DAY,
  TIME_OF_DAY_ORDER,
  type Category,
  type TimeOfDay,
} from "~/lib/constants";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import { RatingHistoryStrip } from "~/components/RatingHistoryStrip";
import type { Route } from "./+types/nutritionist";

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  const url = new URL(request.url);

  if (url.pathname === "/nutritionist/login") {
    return {
      authenticated: false,
      activities: [] as Activity[],
      currentRatings: {} as Record<number, number>,
      history: {} as Record<number, ActivityRating[]>,
      today: today(),
    };
  }

  if (url.pathname === "/nutritionist/settings") {
    return {
      authenticated: true,
      activities: [] as Activity[],
      currentRatings: {} as Record<number, number>,
      history: {} as Record<number, ActivityRating[]>,
      today: today(),
    };
  }

  if (!isAuth) {
    throw redirect("/nutritionist/login");
  }

  return {
    authenticated: true,
    activities: getAllActivities(),
    currentRatings: getCurrentRatings(),
    history: getAllRatingHistory(),
    today: today(),
  };
}

export default function NutritionistLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();

  if (location.pathname !== "/nutritionist") {
    return <Outlet />;
  }

  if (!loaderData.authenticated) {
    return <Outlet />;
  }

  return <NutritionistView data={loaderData} />;
}

function NutritionistView({ data }: { data: any }) {
  const { activities, currentRatings, history } = data as {
    activities: Activity[];
    currentRatings: Record<number, number>;
    history: Record<number, ActivityRating[]>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div
        className="max-w-4xl mx-auto px-3 sm:px-5 pt-4 pb-8"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <header className="mb-3 sm:mb-4 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">
              Nourish
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Nutritionist
            </span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <a
              href="/client"
              className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              View Client
            </a>
            <a
              href="/nutritionist/settings"
              className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              Password
            </a>
          </div>
        </header>

        <ActivityManager
          activities={activities}
          currentRatings={currentRatings}
          history={history}
        />
      </div>
    </div>
  );
}

function ActivityManager({
  activities,
  currentRatings,
  history,
}: {
  activities: Activity[];
  currentRatings: Record<number, number>;
  history: Record<number, ActivityRating[]>;
}) {
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("weekly_challenge");
  const [newColor, setNewColor] = useState("#38BDF8");
  const [newIcon, setNewIcon] = useState("");
  const [newBaselineWeek, setNewBaselineWeek] = useState<string>("");
  const [newMaxPerDay, setNewMaxPerDay] = useState("1");
  const [newNotes, setNewNotes] = useState("");
  const [newTimeOfDay, setNewTimeOfDay] = useState<TimeOfDay>("anytime");

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const fd: Record<string, string> = {
      intent: "create",
      name: newName.trim(),
      category: newCategory,
      color: newColor,
      max_per_day: newMaxPerDay || "1",
      time_of_day: newTimeOfDay,
    };
    if (newIcon) fd.icon = newIcon;
    if (newBaselineWeek) fd.baseline_week = newBaselineWeek;
    if (newNotes.trim()) fd.notes = newNotes.trim();
    fetcher.submit(fd, { method: "post", action: "/api/activities" });
    setNewName("");
    setNewIcon("");
    setNewBaselineWeek("");
    setNewMaxPerDay("1");
    setNewNotes("");
    setNewTimeOfDay("anytime");
    setShowAdd(false);
  };

  const handleDelete = (id: number) => {
    fetcher.submit(
      { intent: "delete", id: String(id) },
      { method: "post", action: "/api/activities" }
    );
  };

  const grouped: Record<TimeOfDay, Activity[]> = { morning: [], midday: [], evening: [], anytime: [] };
  for (const a of activities) {
    const t = (a.time_of_day as TimeOfDay) || "anytime";
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(a);
  }
  for (const key of TIME_OF_DAY_ORDER) {
    grouped[key].sort((x, y) => x.sort_order - y.sort_order);
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Add activity</h2>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-full hover:bg-indigo-200 active:scale-95 transition-all"
          >
            {showAdd ? "Cancel" : "New"}
          </button>
        </div>

        {showAdd && (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Activity name"
                className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🍎"
                className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:border-indigo-400 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <TimeOfDayPicker value={newTimeOfDay} onChange={setNewTimeOfDay} />
              <label className="flex items-center gap-1">
                <span className="font-semibold text-gray-500">Cat</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Category)}
                  className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
                >
                  {(["baseline", "weekly_challenge"] as Category[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIES[cat].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="font-semibold text-gray-500">Week</span>
                <select
                  value={newBaselineWeek}
                  onChange={(e) => setNewBaselineWeek(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
                >
                  <option value="">—</option>
                  {Object.keys(WEEK_COLORS).map((w) => (
                    <option key={w} value={w}>W{w}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="font-semibold text-gray-500">/day</span>
                <input
                  type="number"
                  min={1}
                  value={newMaxPerDay}
                  onChange={(e) => setNewMaxPerDay(e.target.value)}
                  className="w-12 px-1.5 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
                />
              </label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>

            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (shown under activity name)"
              rows={2}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-3 py-1.5 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {TIME_OF_DAY_ORDER.map((key) => {
        const items = grouped[key];
        if (!items?.length) return null;
        const info = TIMES_OF_DAY[key];
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-1.5 px-0.5">
              <span className="text-base leading-none" aria-hidden="true">{info.icon}</span>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {info.label}
              </h2>
              <div
                className="flex-1 h-px"
                style={{ background: `linear-gradient(to right, ${info.color}66, transparent)` }}
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              {items.map((a) => (
                <ActivityAdminRow
                  key={a.id}
                  activity={a}
                  currentRating={currentRatings[a.id]}
                  history={history[a.id] || []}
                  isEditing={editingId === a.id}
                  onToggleEdit={() => setEditingId(editingId === a.id ? null : a.id)}
                  onDelete={() => handleDelete(a.id)}
                  onSaved={() => setEditingId(null)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TimeOfDayPicker({ value, onChange }: { value: TimeOfDay; onChange: (v: TimeOfDay) => void }) {
  return (
    <label className="flex items-center gap-1">
      <span className="font-semibold text-gray-500">Time</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeOfDay)}
        className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
      >
        {TIME_OF_DAY_ORDER.map((k) => (
          <option key={k} value={k}>
            {TIMES_OF_DAY[k].icon} {TIMES_OF_DAY[k].label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Object.entries(ACTIVITY_COLORS).map(([name, hex]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(hex)}
          aria-label={name}
          className={`w-5 h-5 rounded-full transition-all ${
            value === hex ? "ring-2 ring-offset-1 ring-indigo-400 scale-110" : "hover:scale-110"
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

function ActivityAdminRow({
  activity,
  currentRating,
  history,
  isEditing,
  onToggleEdit,
  onDelete,
  onSaved,
}: {
  activity: Activity;
  currentRating: number | undefined;
  history: ActivityRating[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  if (isEditing) {
    return (
      <ActivityEditForm
        activity={activity}
        onCancel={onToggleEdit}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="relative rounded-xl bg-white shadow-sm border border-gray-100">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: activity.color }}
        aria-hidden="true"
      />
      <div className="relative pl-3 pr-2.5 py-2 sm:py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg sm:text-xl leading-none shrink-0" aria-hidden="true">
            {activity.icon || "✨"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-[15px] leading-tight truncate">
                {activity.name}
              </h3>
              {activity.baseline_week && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-600 tabular-nums leading-none shrink-0">
                  W{activity.baseline_week}
                </span>
              )}
              {activity.max_per_day > 1 && (
                <span className="text-[10px] font-bold text-gray-400 tabular-nums shrink-0">
                  {activity.max_per_day >= 99 ? "∞×" : `${activity.max_per_day}×`}
                </span>
              )}
            </div>
            {activity.notes && (
              <p className="mt-0.5 text-[12px] text-gray-500 italic leading-snug truncate">
                {activity.notes}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Now
                </span>
                {currentRating ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`text-xs leading-none ${n <= currentRating ? "text-amber-400" : "text-gray-300"}`}
                        aria-hidden="true"
                      >
                        {n <= currentRating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">—</span>
                )}
              </div>
              <RatingHistoryStrip history={history} />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onToggleEdit}
              className="px-2 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete activity"
              className="p-1.5 text-gray-400 hover:text-red-500 active:scale-95 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityEditForm({
  activity,
  onCancel,
  onSaved,
}: {
  activity: Activity;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const fetcher = useFetcher();
  const [name, setName] = useState(activity.name);
  const [icon, setIcon] = useState(activity.icon ?? "");
  const [category, setCategory] = useState<Category>(activity.category as Category);
  const [color, setColor] = useState(activity.color);
  const [baselineWeek, setBaselineWeek] = useState<string>(
    activity.baseline_week != null ? String(activity.baseline_week) : ""
  );
  const [maxPerDay, setMaxPerDay] = useState(String(activity.max_per_day));
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>((activity.time_of_day as TimeOfDay) || "anytime");

  const handleSave = () => {
    fetcher.submit(
      {
        intent: "update",
        id: String(activity.id),
        name,
        icon,
        category,
        color,
        baseline_week: baselineWeek || "",
        max_per_day: maxPerDay || "1",
        notes,
        time_of_day: timeOfDay,
      } as Record<string, string>,
      { method: "post", action: "/api/activities" }
    );
    onSaved();
  };

  return (
    <div className="relative rounded-xl bg-white shadow-sm border-2 border-indigo-200">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="relative pl-3 pr-3 py-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍎"
            className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:border-indigo-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <TimeOfDayPicker value={timeOfDay} onChange={setTimeOfDay} />
          <label className="flex items-center gap-1">
            <span className="font-semibold text-gray-500">Cat</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
            >
              {(["baseline", "weekly_challenge"] as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="font-semibold text-gray-500">Week</span>
            <select
              value={baselineWeek}
              onChange={(e) => setBaselineWeek(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
            >
              <option value="">—</option>
              {Object.keys(WEEK_COLORS).map((w) => (
                <option key={w} value={w}>W{w}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="font-semibold text-gray-500">/day</span>
            <input
              type="number"
              min={1}
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(e.target.value)}
              className="w-12 px-1.5 py-1 rounded-lg border border-gray-200 text-[11px] focus:border-indigo-400 outline-none"
            />
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
        />

        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-500 rounded-full hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
