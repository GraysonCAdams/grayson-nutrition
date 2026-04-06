import { formatDayName, formatDayNumber, today } from "~/lib/dates";

interface WeekStripProps {
  dates: string[];
  currentDate: string;
  onDateSelect?: (date: string) => void;
  blurOtherDays?: boolean;
}

export function WeekStrip({ dates, currentDate, onDateSelect, blurOtherDays }: WeekStripProps) {
  const todayStr = today();

  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center px-2 py-3">
      {dates.map((date) => {
        const isToday = date === todayStr;
        const isSelected = date === currentDate;
        const isBlurred = blurOtherDays && !isToday;
        const isPast = date < todayStr;
        const isFuture = date > todayStr;

        return (
          <button
            key={date}
            onClick={() => onDateSelect?.(date)}
            disabled={isFuture}
            className={`
              flex flex-col items-center justify-center w-11 h-14 sm:w-13 sm:h-16 rounded-2xl transition-all
              ${isSelected
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-110"
                : isToday
                  ? "bg-indigo-100 text-indigo-700 font-bold"
                  : isPast
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }
              ${isBlurred && !isSelected ? "opacity-40 blur-[1px]" : ""}
            `}
          >
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
              {formatDayName(date)}
            </span>
            <span className={`text-lg sm:text-xl font-bold ${isSelected ? "" : ""}`}>
              {formatDayNumber(date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
