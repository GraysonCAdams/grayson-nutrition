import { useDroppable } from "@dnd-kit/core";
import { useFetcher } from "react-router";
import type { EntryWithActivity } from "~/lib/db.server";
import { today } from "~/lib/dates";

interface GroupedEntry {
  activityId: number;
  activityName: string;
  color: string;
  icon: string | null;
  count: number;
  latestEntryId: number;
}

function groupEntries(entries: EntryWithActivity[]): GroupedEntry[] {
  const groups = new Map<number, GroupedEntry>();
  for (const entry of entries) {
    const existing = groups.get(entry.activity_id);
    if (existing) {
      existing.count++;
      existing.latestEntryId = Math.max(existing.latestEntryId, entry.id);
    } else {
      groups.set(entry.activity_id, {
        activityId: entry.activity_id,
        activityName: entry.activity_name,
        color: entry.color,
        icon: entry.icon,
        count: 1,
        latestEntryId: entry.id,
      });
    }
  }
  return Array.from(groups.values());
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthCalendarProps {
  weeks: string[][];
  month: number;
  entriesByDate: Record<string, EntryWithActivity[]>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  readOnly?: boolean;
}

export function MonthCalendar({ weeks, month, entriesByDate, selectedDate, onSelectDate, readOnly }: MonthCalendarProps) {
  const todayStr = today();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0">
          {week.map((date) => {
            const dateMonth = new Date(date + "T12:00:00").getMonth();
            const isCurrentMonth = dateMonth === month;
            const isToday = date === todayStr;
            const isSelected = date === selectedDate;
            const entries = entriesByDate[date] || [];

            return (
              <MonthDayCell
                key={date}
                date={date}
                entries={entries}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isSelected={isSelected}
                onSelect={() => onSelectDate(date)}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface MonthDayCellProps {
  date: string;
  entries: EntryWithActivity[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
  readOnly?: boolean;
}

function MonthDayCell({ date, entries, isCurrentMonth, isToday, isSelected, onSelect, readOnly }: MonthDayCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${date}` });
  const fetcher = useFetcher();
  const dayNum = new Date(date + "T12:00:00").getDate();
  const grouped = groupEntries(entries);

  const handleRemove = (entryId: number) => {
    if (readOnly) return;
    fetcher.submit(
      { intent: "remove", entryId: String(entryId) },
      { method: "post", action: "/api/entries" }
    );
  };

  return (
    <div
      ref={readOnly ? undefined : setNodeRef}
      onClick={onSelect}
      className={`
        min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 cursor-pointer transition-all border-r border-gray-50 last:border-r-0
        ${!isCurrentMonth ? "bg-gray-50/50" : ""}
        ${isSelected ? "bg-indigo-50 ring-2 ring-inset ring-indigo-300" : "hover:bg-gray-50"}
        ${isOver ? "bg-indigo-50/80 ring-2 ring-inset ring-indigo-400" : ""}
      `}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
            ${isToday ? "bg-indigo-500 text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}
          `}
        >
          {dayNum}
        </span>
        {entries.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">{entries.length}</span>
        )}
      </div>

      {/* Entry pills */}
      <div className="space-y-0.5">
        {(isSelected ? grouped : grouped.slice(0, 3)).map((group) => (
          <div
            key={group.activityId}
            className="group relative flex items-center gap-1 px-1 py-0.5 rounded text-[10px] sm:text-xs leading-tight"
          >
            <div
              className="absolute inset-0 rounded opacity-15"
              style={{ backgroundColor: group.color }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l"
              style={{ backgroundColor: group.color }}
            />
            <span className="relative">{group.icon || "✨"}</span>
            <span className="relative font-medium text-gray-600 truncate flex-1">
              {group.activityName}
            </span>
            {group.count > 1 && (
              <span className="relative text-[9px] font-bold text-gray-400">x{group.count}</span>
            )}
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(group.latestEntryId);
                }}
                className="relative opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {!isSelected && grouped.length > 3 && (
          <div className="text-[10px] text-indigo-500 font-medium pl-1 cursor-pointer">+{grouped.length - 3} more</div>
        )}
      </div>
    </div>
  );
}
