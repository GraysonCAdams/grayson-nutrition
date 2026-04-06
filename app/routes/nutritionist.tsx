import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, Outlet, useLocation } from "react-router";
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
import { getAllActivities, getEntriesForDateRange, getLatestReview, type Activity, type EntryWithActivity } from "~/lib/db.server";
import { getWeekDates, today, formatMonthYear } from "~/lib/dates";
import { getRandomPhrase, CATEGORIES, ACTIVITY_COLORS, type Category } from "~/lib/constants";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import { WeekStrip } from "~/components/WeekStrip";
import { CalendarDay } from "~/components/CalendarDay";
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
    return { authenticated: false, activities: [], entries: [], weekDates: [], today: today(), lastReview: null };
  }

  // Settings page handles its own auth
  if (url.pathname === "/nutritionist/settings") {
    return { authenticated: true, activities: [], entries: [], weekDates: [], today: today(), lastReview: null };
  }

  if (!isAuth) {
    throw redirect("/nutritionist/login");
  }

  const todayStr = today();
  const weekDates = getWeekDates(todayStr);

  return {
    authenticated: true,
    activities: getAllActivities(),
    entries: getEntriesForDateRange(weekDates[0], weekDates[6]),
    weekDates,
    today: todayStr,
    lastReview: getLatestReview(),
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
  const { activities, entries, weekDates, today: todayStr, lastReview } = loaderData;
  const fetcher = useFetcher();
  const reviewFetcher = useFetcher();
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

  const entriesByDate = weekDates.reduce(
    (acc: Record<string, EntryWithActivity[]>, date: string) => {
      acc[date] = entries.filter((e: EntryWithActivity) => e.date === date);
      return acc;
    },
    {} as Record<string, EntryWithActivity[]>
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <ToastContainer toasts={toasts} />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            Nutrition Tracker
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
        </div>

        {/* Activity Manager */}
        {showManager && (
          <ActivityManager activities={activities} />
        )}

        {/* Month label */}
        <div className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {formatMonthYear(todayStr)}
        </div>

        {/* Week strip */}
        <WeekStrip
          dates={weekDates}
          currentDate={selectedDate}
          onDateSelect={setSelectedDate}
          blurOtherDays={false}
        />

        {/* Main content */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Calendar area */}
          <div className="mt-4 pb-16">
            {/* Mobile: show selected day */}
            <div className="lg:hidden">
              <CalendarDay
                date={selectedDate}
                entries={entriesByDate[selectedDate] || []}
                isSelected={true}
              />
            </div>

            {/* Desktop: full week grid */}
            <div className="hidden lg:grid lg:grid-cols-7 gap-2">
              {weekDates.map((date: string) => (
                <CalendarDay
                  key={date}
                  date={date}
                  entries={entriesByDate[date] || []}
                  isSelected={date === selectedDate}
                  onSelect={() => setSelectedDate(date)}
                />
              ))}
            </div>
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
