import { WeekDot } from "./WeekDot";
import { StarRating } from "./StarRating";

interface ActivityListItemProps {
  name: string;
  icon: string | null;
  color: string;
  baselineWeek: number | null;
  maxPerDay: number;
  notes: string | null;
  rating: number | undefined;
  pendingRating?: number;
  onRate: (rating: number) => void;
}

export function ActivityListItem({
  name,
  icon,
  color,
  baselineWeek,
  maxPerDay,
  notes,
  rating,
  pendingRating,
  onRate,
}: ActivityListItemProps) {
  return (
    <div className="relative rounded-xl bg-white shadow-sm border border-gray-100">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="relative pl-3 pr-3 py-2 sm:py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="text-xl sm:text-2xl leading-none shrink-0" aria-hidden="true">
            {icon || "✨"}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight truncate">
                {name}
              </h3>
              {baselineWeek && <WeekDot week={baselineWeek} />}
              {maxPerDay > 1 && (
                <span
                  className="text-[10px] font-bold text-gray-400 tabular-nums shrink-0"
                  title={`Ideal: ${maxPerDay}× per day`}
                >
                  {maxPerDay >= 99 ? "∞×" : `${maxPerDay}×`}
                </span>
              )}
            </div>
            {notes && (
              <p className="mt-0.5 text-xs sm:text-[13px] text-gray-500 italic leading-snug">
                {notes}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <StarRating
              value={rating}
              pendingValue={pendingRating}
              onChange={onRate}
              size="sm"
              label={`How on top of "${name}" do you feel?`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
