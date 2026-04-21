import type { ActivityRating } from "~/lib/db.server";

interface RatingHistoryStripProps {
  history: ActivityRating[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RatingHistoryStrip({ history }: RatingHistoryStripProps) {
  if (!history.length) {
    return (
      <span className="text-xs text-gray-400 italic">no ratings yet</span>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-1 px-1">
        {history.map((row, i) => (
          <div key={row.id} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`text-[10px] leading-none ${n <= row.rating ? "text-amber-400" : "text-gray-300"}`}
                    aria-hidden="true"
                  >
                    {n <= row.rating ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-gray-500 tabular-nums">
                {formatShortDate(row.rated_on)}
              </span>
            </div>
            {i < history.length - 1 && (
              <span className="text-gray-300 text-xs" aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
