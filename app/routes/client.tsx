import { useState, useCallback } from "react";
import { useLoaderData, useFetcher } from "react-router";
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
import { getAllActivities, getEntriesForDateRange, getLatestReview, type EntryWithActivity } from "~/lib/db.server";
import { getWeekDates, today, formatMonthYear } from "~/lib/dates";
import { getRandomPhrase } from "~/lib/constants";
import { WeekStrip } from "~/components/WeekStrip";
import { CalendarDay } from "~/components/CalendarDay";
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

  return {
    activities: getAllActivities(),
    entries: getEntriesForDateRange(startDate, endDate),
    weekDates,
    today: todayStr,
    lastReview: getLatestReview(),
  };
}

export default function ClientView() {
  const { activities, entries, weekDates, today: todayStr, lastReview } = useLoaderData<typeof loader>();
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
    (acc, date) => {
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
            Nutrition Tracker
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
              {weekDates.map((date) => (
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
