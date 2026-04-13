import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, Outlet, useLocation, useNavigate } from "react-router";
import { redirect } from "react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { getAllActivities, getEntriesForDateRange, getLatestReview, getActiveReleaseSession, type Activity, type EntryWithActivity } from "~/lib/db.server";
import { today, formatMonthYearFromParts, getMonthCalendarGrid, getMonthCalendarRange } from "~/lib/dates";
import { getRandomPhrase, CATEGORIES, ACTIVITY_COLORS, type Category } from "~/lib/constants";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import { MonthCalendar } from "~/components/MonthCalendar";
import { ActivityBank } from "~/components/ActivityBank";
import { ActivityCardStatic } from "~/components/ActivityCard";
import { DaysSinceReview } from "~/components/DaysSinceReview";
import { TabNav } from "~/components/TabNav";
import { ToastContainer, usePositiveFeedback } from "~/components/PositiveFeedback";
import type { Route } from "./+types/nutritionist";

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  const url = new URL(request.url);

  // Allow access to login page without auth
  if (url.pathname === "/nutritionist/login") {
    return { authenticated: false, activities: [], entries: [], weeks: [] as string[][], month: 0, year: 0, today: today(), lastReview: null, releaseActive: false, releaseExpiresAt: null };
  }

  // Settings page handles its own auth
  if (url.pathname === "/nutritionist/settings") {
    return { authenticated: true, activities: [], entries: [], weeks: [] as string[][], month: 0, year: 0, today: today(), lastReview: null, releaseActive: false, releaseExpiresAt: null };
  }

  if (!isAuth) {
    throw redirect("/nutritionist/login");
  }

  const todayStr = today();
  const todayDate = new Date(todayStr + "T12:00:00");
  const monthParam = url.searchParams.get("month"); // format: YYYY-MM
  let year: number, month: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1; // JS months are 0-indexed
  } else {
    year = todayDate.getFullYear();
    month = todayDate.getMonth();
  }

  const weeks = getMonthCalendarGrid(year, month);
  const [rangeStart, rangeEnd] = getMonthCalendarRange(weeks);

  const releaseSession = getActiveReleaseSession();

  return {
    authenticated: true,
    activities: getAllActivities(),
    entries: getEntriesForDateRange(rangeStart, rangeEnd),
    weeks,
    month,
    year,
    today: todayStr,
    lastReview: getLatestReview(),
    releaseActive: !!releaseSession,
    releaseExpiresAt: releaseSession?.expires_at || null,
  };
}

export default function NutritionistLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();

  // Child routes (login, settings) render themselves
  if (location.pathname !== "/nutritionist") {
    return <Outlet />;
  }

  if (!loaderData.authenticated) {
    return <Outlet />;
  }

  return <NutritionistView data={loaderData} />;
}

function NutritionistView({ data: loaderData }: { data: any }) {
  const { activities, entries, weeks, month, year, today: todayStr, lastReview, releaseActive, releaseExpiresAt } = loaderData;
  const fetcher = useFetcher();
  const releaseFetcher = useFetcher();
  const reviewFetcher = useFetcher();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [bankOpen, setBankOpen] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [activeItem, setActiveItem] = useState<{ name: string; icon: string | null; color: string } | null>(null);
  const { toasts, showToast } = usePositiveFeedback();

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const entriesByDate: Record<string, EntryWithActivity[]> = {};
  for (const entry of entries) {
    if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
    entriesByDate[entry.date].push(entry);
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data) {
      setActiveItem({ name: data.name, icon: data.icon, color: data.color });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;

      const overId = String(over.id);
      if (!overId.startsWith("day-")) return;

      const date = overId.replace("day-", "");
      const activityId = String(active.id).replace("bank-", "");

      fetcher.submit(
        { intent: "add", activityId, date },
        { method: "post", action: "/api/entries" }
      );

      showToast(getRandomPhrase());
    },
    [fetcher, showToast]
  );

  const handleMarkReview = () => {
    reviewFetcher.submit({}, { method: "post", action: "/api/review" });
    showToast("Review logged!");
  };

  const handleRelease = () => {
    releaseFetcher.submit(
      { intent: "release", duration: "60" },
      { method: "post", action: "/api/release" }
    );
    showToast("Released for review!");
  };

  const handleRevoke = () => {
    releaseFetcher.submit(
      { intent: "revoke" },
      { method: "post", action: "/api/release" }
    );
  };

  // Month navigation
  const prevMonth = () => {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    navigate(`/nutritionist?month=${y}-${String(m + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    navigate(`/nutritionist?month=${y}-${String(m + 1).padStart(2, "0")}`);
  };
  const goToday = () => navigate("/nutritionist");

  const todayDate = new Date(todayStr + "T12:00:00");
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;

  // Check if release is pending from fetcher
  const isReleaseActive = releaseActive || releaseFetcher.data?.success;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <ToastContainer toasts={toasts} />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            Nourish
          </h1>
          <TabNav />
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <DaysSinceReview lastReviewDate={lastReview?.reviewed_at} />
            <button
              onClick={handleMarkReview}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-full hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
            >
              Mark Reviewed
            </button>
            {isReleaseActive ? (
              <button
                onClick={handleRevoke}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs sm:text-sm font-bold rounded-full hover:bg-red-200 active:scale-95 transition-all"
              >
                Revoke Access
              </button>
            ) : (
              <button
                onClick={handleRelease}
                className="px-3 py-1.5 bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-full hover:bg-indigo-600 active:scale-95 transition-all shadow-sm"
              >
                Review Together
              </button>
            )}
            <button
              onClick={() => setShowManager(!showManager)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              {showManager ? "Hide Manager" : "Manage Activities"}
            </button>
            <a
              href="/nutritionist/settings"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold rounded-full hover:bg-gray-200 active:scale-95 transition-all"
            >
              Change Password
            </a>
          </div>
          {isReleaseActive && (
            <div className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
              Client view unlocked
              {releaseExpiresAt && ` until ${new Date(releaseExpiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
            </div>
          )}
        </div>

        {/* Activity Manager */}
        {showManager && (
          <ActivityManager activities={activities} />
        )}

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-400 hover:text-gray-600"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center min-w-[160px]">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              {formatMonthYearFromParts(year, month)}
            </div>
            {!isCurrentMonth && (
              <button
                onClick={goToday}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
              >
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-400 hover:text-gray-600"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Month calendar + drag context */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="pb-16">
            <MonthCalendar
              weeks={weeks}
              month={month}
              entriesByDate={entriesByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Bottom bank */}
          <ActivityBank
            activities={activities}
            isOpen={bankOpen}
            onToggle={() => setBankOpen(!bankOpen)}
          />

          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <ActivityCardStatic
                name={activeItem.name}
                icon={activeItem.icon}
                color={activeItem.color}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function ActivityManager({ activities }: { activities: Activity[] }) {
  const fetcher = useFetcher();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("weekly_challenge");
  const [newColor, setNewColor] = useState("#38BDF8");
  const [newIcon, setNewIcon] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    fetcher.submit(
      {
        intent: "create",
        name: newName,
        category: newCategory,
        color: newColor,
        icon: newIcon || undefined,
      } as any,
      { method: "post", action: "/api/activities" }
    );
    setNewName("");
    setNewIcon("");
  };

  const handleDelete = (id: number) => {
    fetcher.submit(
      { intent: "delete", id: String(id) },
      { method: "post", action: "/api/activities" }
    );
  };

  const categoryOrder: Category[] = ["baseline", "weekly_challenge"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Manage Activities</h3>

      {/* Add new activity */}
      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Activity name"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
        />
        <input
          type="text"
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          placeholder="Emoji"
          className="w-16 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:border-indigo-400 outline-none"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as Category)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none"
        >
          {categoryOrder.map((cat) => (
            <option key={cat} value={cat}>{CATEGORIES[cat].label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {Object.entries(ACTIVITY_COLORS).map(([name, hex]) => (
            <button
              key={name}
              onClick={() => setNewColor(hex)}
              className={`w-6 h-6 rounded-full transition-all ${newColor === hex ? "ring-2 ring-offset-1 ring-indigo-400 scale-110" : "hover:scale-110"}`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all"
        >
          Add
        </button>
      </div>

      {/* Existing activities */}
      <div className="space-y-1">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.color }} />
            <span className="text-sm">{activity.icon}</span>
            <span className="text-sm font-medium text-gray-700 flex-1">{activity.name}</span>
            <span className="text-xs text-gray-400">{CATEGORIES[activity.category as Category]?.label}</span>
            <button
              onClick={() => handleDelete(activity.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
