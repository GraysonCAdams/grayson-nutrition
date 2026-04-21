import { getWeekColor, WEEK_COLORS } from "~/lib/constants";

interface WeekDotProps {
  week: number;
}

export function WeekDot({ week }: WeekDotProps) {
  const color = getWeekColor(week);
  const label = WEEK_COLORS[week]?.label || `Week ${week}`;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-600 tabular-nums leading-none"
      title={label}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      W{week}
    </span>
  );
}
