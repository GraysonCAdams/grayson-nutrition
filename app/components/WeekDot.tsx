import { useState } from "react";
import { getWeekColor, WEEK_COLORS } from "~/lib/constants";

interface WeekDotProps {
  week: number;
}

export function WeekDot({ week }: WeekDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = getWeekColor(week);
  const label = WEEK_COLORS[week]?.label || `Week ${week}`;

  return (
    <div
      className="relative flex items-center z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={(e) => {
        e.stopPropagation();
        setShowTooltip(true);
      }}
      onTouchEnd={() => setTimeout(() => setShowTooltip(false), 1500)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm cursor-help"
        style={{ backgroundColor: color }}
      />
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-1.5 pointer-events-none">
          <div
            className="px-2.5 py-1 rounded-lg text-white text-xs font-bold whitespace-nowrap shadow-lg"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          <div
            className="absolute top-full right-2 w-0 h-0 border-x-4 border-x-transparent border-t-4"
            style={{ borderTopColor: color }}
          />
        </div>
      )}
    </div>
  );
}
