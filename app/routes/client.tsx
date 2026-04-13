import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
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
import { getAllActivities, getEntriesForDateRange, getLatestReview, getActiveReleaseSession, type EntryWithActivity } from "~/lib/db.server";
import { getWeekDates, today, formatMonthYear, getMonthCalendarGrid, getMonthCalendarRange, formatMonthYearFromParts } from "~/lib/dates";
import { getRandomPhrase } from "~/lib/constants";
import { WeekStrip } from "~/components/WeekStrip";
import { CalendarDay } from "~/components/CalendarDay";
import { MonthCalendar } from "~/components/MonthCalendar";
import { ActivityBank } from "~/components/ActivityBank";
import { ActivityCardStatic } from "~/components/ActivityCard";
import { DaysSinceReview } from "~/components/DaysSinceReview";
import { TabNav } from "~/components/TabNav";
import { ToastContainer, usePositiveFeedback } from "~/components/PositiveFeedback";
import type { Route } from "./+types/client";

export function loader({ request }: Route.LoaderArgs) {
  const todayStr = today();
  const weekDates = getWeekDates(todayStr);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const releaseSession = getActiveReleaseSession();

  // If released, also load month data
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const todayDate = new Date(todayStr + "T12:00:00");

  let reviewYear: number, reviewMonth: number, reviewWeeks: string[][] | null = null, reviewEntries: EntryWithActivity[] = [];

  if (releaseSession) {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      reviewYear = y;
      reviewMonth = m - 1;
    } else {
      reviewYear = todayDate.getFullYear();
      reviewMonth = todayDate.getMonth();
    }
    reviewWeeks = getMonthCalendarGrid(reviewYear, reviewMonth);
    const [rangeStart, rangeEnd] = getMonthCalendarRange(reviewWeeks);
    reviewEntries = getEntriesForDateRange(rangeStart, rangeEnd);
  } else {
    reviewYear = todayDate.getFullYear();
    reviewMonth = todayDate.getMonth();
  }

  return {
    activities: getAllActivities(),
    entries: getEntriesForDateRange(startDate, endDate),
    weekDates,
    today: todayStr,
    lastReview: getLatestReview(),
    releaseActive: !!releaseSession,
    releaseExpiresAt: releaseSession?.expires_at || null,
    reviewWeeks,
    reviewMonth,
    reviewYear,
    reviewEntries,
  };
}

export default function ClientView() {
  const loaderData = useLoaderData<typeof loader>();
  const { releaseActive } = loaderData;

  if (releaseActive && loaderData.reviewWeeks) {
    return <ClientReviewView data={loaderData} />;
  }

  return <ClientWeekView data={loaderData} />;
}

function ClientReviewView({ data }: { data: any }) {
  const { reviewWeeks, reviewMonth, reviewYear, reviewEntries, today: todayStr, lastReview, releaseExpiresAt } = data;
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const entriesByDate: Record<string, EntryWithActivity[]> = {};
  for (const entry of reviewEntries) {
    if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
    entriesByDate[entry.date].push(entry);
  }

  const todayDate = new Date(todayStr + "T12:00:00");
  const isCurrentMonth = todayDate.getFullYear() === reviewYear && todayDate.getMonth() === reviewMonth;

  const prevMonth = () => {
    const m = reviewMonth === 0 ? 11 : reviewMonth - 1;
    const y = reviewMonth === 0 ? reviewYear - 1 : reviewYear;
    navigate(`/client?month=${y}-${String(m + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const m = reviewMonth === 11 ? 0 : reviewMonth + 1;
    const y = reviewMonth === 11 ? reviewYear + 1 : reviewYear;
    navigate(`/client?month=${y}-${String(m + 1).padStart(2, "0")}`);
  };
  const goToday = () => navigate("/client");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            Nourish
          </h1>
          <TabNav />
          <div className="flex items-center gap-3">
            <DaysSinceReview lastReviewDate={lastReview?.reviewed_at} />
          </div>
          <div className="text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Review Mode
            {releaseExpiresAt && ` — expires ${new Date(releaseExpiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center min-w-[160px]">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              {formatMonthYearFromParts(reviewYear, reviewMonth)}
            </div>
            {!isCurrentMonth && (
              <button onClick={goToday} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Read-only month calendar */}
        <MonthCalendar
          weeks={reviewWeeks}
          month={reviewMonth}
          entriesByDate={entriesByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          readOnly={true}
        />
      </div>
    </div>
  );
}

function ClientWeekView({ data }: { data: any }) {
  const { activities, entries, weekDates, today: todayStr, lastReview } = data;
  const fetcher = useFetcher();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [bankOpen, setBankOpen] = useState(true);
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
    const { active } = event;
    const data = active.data.current;
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
      if (date > todayStr) return;

      const activityId = String(active.id).replace("bank-", "");

      fetcher.submit(
        { intent: "add", activityId, date },
        { method: "post", action: "/api/entries" }
      );

      showToast(getRandomPhrase());

    },
    [fetcher, todayStr, showToast]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <ToastContainer toasts={toasts} />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            Nourish
          </h1>
          <TabNav />
          <div className="flex items-center gap-3">
            <DaysSinceReview lastReviewDate={lastReview?.reviewed_at} />
          </div>
        </div>

        {/* Month label */}
        <div className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {formatMonthYear(todayStr)}
        </div>

        {/* Week strip */}
        <WeekStrip
          dates={weekDates}
          currentDate={selectedDate}
          onDateSelect={(date) => date <= todayStr && setSelectedDate(date)}
          blurOtherDays={true}
        />

        {/* Main content */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Calendar area */}
          <div className="mt-4 pb-16">
            {/* Mobile: show selected day only */}
            <div className="lg:hidden">
              <CalendarDay
                date={selectedDate}
                entries={entriesByDate[selectedDate] || []}
                isSelected={true}
              />
            </div>

            {/* Desktop: show full week grid */}
            <div className="hidden lg:grid lg:grid-cols-7 gap-2">
              {weekDates.map((date: string) => (
                <CalendarDay
                  key={date}
                  date={date}
                  entries={entriesByDate[date] || []}
                  isBlurred={date !== todayStr && date !== selectedDate}
                  isSelected={date === selectedDate}
                  onSelect={() => date <= todayStr && setSelectedDate(date)}
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
