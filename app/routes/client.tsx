import { useMemo } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { getAllActivities, getCurrentRatings, type Activity } from "~/lib/db.server";
import { TIMES_OF_DAY, TIME_OF_DAY_ORDER, type TimeOfDay } from "~/lib/constants";
import { ActivityListItem } from "~/components/ActivityListItem";
import type { Route } from "./+types/client";

export function loader(_: Route.LoaderArgs) {
  return {
    activities: getAllActivities(),
    currentRatings: getCurrentRatings(),
  };
}

export default function ClientView() {
  const { activities, currentRatings } = useLoaderData<typeof loader>();

  const grouped = useMemo(() => {
    const g: Record<TimeOfDay, Activity[]> = { morning: [], midday: [], evening: [], anytime: [] };
    for (const a of activities) {
      const t = (a.time_of_day as TimeOfDay) || "anytime";
      if (!g[t]) g[t] = [];
      g[t].push(a);
    }
    for (const key of TIME_OF_DAY_ORDER) {
      g[key].sort((x, y) => x.sort_order - y.sort_order);
    }
    return g;
  }, [activities]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div
        className="max-w-3xl mx-auto px-3 sm:px-5 pt-4 pb-8"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <header className="mb-3 sm:mb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            Nourish
          </h1>
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">
            Rate how on top of each habit you feel.
          </p>
        </header>

        <main className="space-y-3 sm:space-y-4">
          {TIME_OF_DAY_ORDER.map((key) => {
            const items = grouped[key];
            if (!items?.length) return null;
            const info = TIMES_OF_DAY[key];
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-1.5 px-0.5">
                  <span className="text-base leading-none" aria-hidden="true">
                    {info.icon}
                  </span>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {info.label}
                  </h2>
                  <div
                    className="flex-1 h-px"
                    style={{ background: `linear-gradient(to right, ${info.color}66, transparent)` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1.5">
                  {items.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      currentRating={currentRatings[a.id]}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        <footer className="mt-6 pt-4 border-t border-gray-200 text-center">
          <a
            href="/nutritionist"
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Manage
          </a>
        </footer>
      </div>
    </div>
  );
}

function ActivityRow({ activity, currentRating }: { activity: Activity; currentRating: number | undefined }) {
  const fetcher = useFetcher();

  const pendingRating = fetcher.formData
    ? Number(fetcher.formData.get("rating"))
    : undefined;

  const handleRate = (rating: number) => {
    fetcher.submit(
      { intent: "set", activityId: String(activity.id), rating: String(rating) },
      { method: "post", action: "/api/ratings" }
    );
  };

  return (
    <ActivityListItem
      name={activity.name}
      icon={activity.icon}
      color={activity.color}
      baselineWeek={activity.baseline_week}
      maxPerDay={activity.max_per_day}
      notes={activity.notes}
      rating={currentRating}
      pendingRating={pendingRating || undefined}
      onRate={handleRate}
    />
  );
}
