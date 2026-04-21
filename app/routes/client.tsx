import { useMemo } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { getAllActivities, getCurrentRatings, type Activity } from "~/lib/db.server";
import { CATEGORIES, type Category } from "~/lib/constants";
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
    const g: Record<Category, Activity[]> = { baseline: [], weekly_challenge: [] };
    for (const a of activities) {
      const cat = a.category as Category;
      if (!g[cat]) g[cat] = [];
      g[cat].push(a);
    }
    return g;
  }, [activities]);

  const categoryOrder: Category[] = ["baseline", "weekly_challenge"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12"
        style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
      >
        <header className="mb-5 sm:mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
            Nourish
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your nutrition activity bank — rate how on top of each habit you feel.
          </p>
        </header>

        <main className="space-y-6">
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const info = CATEGORIES[cat];
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                    aria-hidden="true"
                  />
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {info.label}
                  </h2>
                </div>
                <div className="space-y-2">
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

        <footer className="mt-10 pt-6 border-t border-gray-200 text-center">
          <a
            href="/nutritionist"
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
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
