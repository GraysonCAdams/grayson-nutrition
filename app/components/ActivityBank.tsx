import { ActivityCard } from "./ActivityCard";
import type { Activity } from "~/lib/db.server";
import { CATEGORIES, type Category } from "~/lib/constants";

interface ActivityBankProps {
  activities: Activity[];
  isOpen: boolean;
  onToggle: () => void;
}

export function ActivityBank({ activities, isOpen, onToggle }: ActivityBankProps) {
  const grouped = activities.reduce(
    (acc, activity) => {
      const cat = activity.category as Category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(activity);
      return acc;
    },
    {} as Record<Category, Activity[]>
  );

  const categoryOrder: Category[] = ["baseline", "weekly_challenge"];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      {/* Collapse / expand toggle */}
      <div className="flex justify-center">
        <button
          onClick={onToggle}
          className="bg-white border border-gray-200 border-b-white rounded-t-xl px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all flex items-center gap-1.5 -mb-px z-10"
        >
          {isOpen ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Hide Bank
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Activity Bank
            </>
          )}
        </button>
      </div>

      {/* Bank panel */}
      <div
        className={`
          bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-out
          ${isOpen ? "max-h-[45vh] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}
        `}
      >
        <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: "calc(45vh - 12px)" }}>
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const catInfo = CATEGORIES[cat];
            return (
              <div key={cat} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: catInfo.color }}
                  />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {catInfo.label}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      id={`bank-${activity.id}`}
                      name={activity.name}
                      icon={activity.icon}
                      color={activity.color}
                      category={activity.category}
                      baselineWeek={activity.baseline_week}
                      maxPerDay={activity.max_per_day}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
