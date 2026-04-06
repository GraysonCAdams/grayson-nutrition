import { daysSince } from "~/lib/dates";

interface DaysSinceReviewProps {
  lastReviewDate?: string | null;
}

export function DaysSinceReview({ lastReviewDate }: DaysSinceReviewProps) {
  if (!lastReviewDate) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs sm:text-sm font-medium">
        <span>📋</span>
        <span>No check-ins yet</span>
      </div>
    );
  }

  const days = daysSince(lastReviewDate);

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium">
      <span>📋</span>
      <span>
        {days === 0
          ? "Checked in today!"
          : days === 1
            ? "1 day since check-in"
            : `${days} days since check-in`}
      </span>
    </div>
  );
}
