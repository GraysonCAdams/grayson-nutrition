import { useDroppable } from "@dnd-kit/core";
import { useFetcher } from "react-router";
import type { EntryWithActivity } from "~/lib/db.server";
import { formatDayName, formatDayNumber, today } from "~/lib/dates";

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

interface CalendarDayProps {
  date: string;
  entries: EntryWithActivity[];
  isBlurred?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  allowFuture?: boolean;
}

export function CalendarDay({ date, entries, isBlurred, isSelected, onSelect, allowFuture }: CalendarDayProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${date}` });
  const fetcher = useFetcher();
  const todayStr = today();
  const isToday = date === todayStr;
  const isFuture = date > todayStr && !allowFuture;

  const handleRemove = (entryId: number) => {
    fetcher.submit(
      { intent: "remove", entryId: String(entryId) },
      { method: "post", action: "/api/entries" }
    );
  };

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        relative rounded-2xl p-3 sm:p-4 min-h-[120px] transition-all
        ${isOver ? "ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/50 scale-[1.02]" : ""}
        ${isSelected ? "bg-white shadow-lg border-2 border-indigo-200" : "bg-white/60 shadow-sm border border-gray-100"}
        ${isBlurred && !isOver ? "blur-[3px] opacity-50 hover:blur-[1px] hover:opacity-70 cursor-pointer" : ""}
        ${isFuture ? "opacity-30 pointer-events-none" : ""}
      `}
    >
      <div className="flex flex-col items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-indigo-600" : "text-gray-400"}`}>
            {formatDayName(date)}
          </span>
          <span className={`text-lg font-bold ${isToday ? "text-indigo-600" : "text-gray-600"}`}>
            {formatDayNumber(date)}
          </span>
        </div>
        {isToday && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-0.5">
            Today
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {groupEntries(entries).map((group) => (
          <div
            key={group.activityId}
            className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all hover:shadow-sm"
          >
            <div
              className="absolute inset-0 rounded-lg opacity-15"
              style={{ backgroundColor: group.color }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
              style={{ backgroundColor: group.color }}
            />
            <span className="relative text-sm">{group.icon || "✨"}</span>
            <span className="relative font-medium text-gray-700 flex-1 text-xs sm:text-sm leading-tight">
              {group.activityName}
            </span>
            {group.count > 1 && (
              <span
                className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: group.color }}
              >
                ×{group.count}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(group.latestEntryId);
              }}
              className="relative opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity p-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {entries.length === 0 && !isBlurred && !isFuture && (
        <div className="flex items-center justify-center h-16 text-gray-300">
          <span className="text-xs italic">Drop activities here</span>
        </div>
      )}
    </div>
  );
}
