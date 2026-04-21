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
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="relative px-4 py-3 sm:px-5 sm:py-4 pl-5 sm:pl-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl sm:text-3xl leading-none shrink-0 mt-0.5" aria-hidden="true">
            {icon || "✨"}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-snug">
                {name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                {maxPerDay > 1 && (
                  <span
                    className="text-[10px] font-semibold text-gray-400 tabular-nums"
                    title={`Ideal: ${maxPerDay}× per day`}
                  >
                    {maxPerDay >= 99 ? "∞×" : `${maxPerDay}×`}
                  </span>
                )}
                {baselineWeek && <WeekDot week={baselineWeek} />}
              </div>
            </div>

            {notes && (
              <p className="mt-1 text-sm text-gray-500 italic leading-relaxed">
                {notes}
              </p>
            )}

            <div className="mt-2 -mx-1">
              <StarRating
                value={rating}
                pendingValue={pendingRating}
                onChange={onRate}
                size="md"
                label={`How on top of "${name}" do you feel?`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
