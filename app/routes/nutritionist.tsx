import { useState, useMemo, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, Outlet, useLocation } from "react-router";
import {
  getAllActivities,
  getAllRatingHistory,
  type Activity,
  type ActivityRating,
} from "~/lib/db.server";
import { today } from "~/lib/dates";
import {
  CATEGORIES,
  ACTIVITY_COLORS,
  WEEK_COLORS,
  TIMES_OF_DAY,
  TIME_OF_DAY_ORDER,
  type Category,
  type TimeOfDay,
} from "~/lib/constants";
import { ActivityListItem } from "~/components/ActivityListItem";
import type { Route } from "./+types/nutritionist";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  if (url.pathname === "/nutritionist/login" || url.pathname === "/nutritionist/settings") {
    return {
      activities: [] as Activity[],
      history: {} as Record<number, ActivityRating[]>,
      today: today(),
    };
  }

  return {
    activities: getAllActivities(),
    history: getAllRatingHistory(),
    today: today(),
  };
}

export default function NutritionistLayout() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();

  if (location.pathname !== "/nutritionist") {
    return <Outlet />;
  }

  return <NutritionistView data={data} />;
}

type View = "rate" | "history" | "manage";

function NutritionistView({ data }: { data: any }) {
  const { activities, history, today: todayStr } = data as {
    activities: Activity[];
    history: Record<number, ActivityRating[]>;
    today: string;
  };

  const [view, setView] = useState<View>("rate");

  const ratingsByDate = useMemo(() => {
    const m: Record<string, Record<number, ActivityRating>> = {};
    for (const ratings of Object.values(history)) {
      for (const r of ratings) {
        if (!m[r.rated_on]) m[r.rated_on] = {};
        m[r.rated_on][r.activity_id] = r;
      }
    }
    return m;
  }, [history]);

  const todayRatings: Record<number, number> = useMemo(() => {
    const out: Record<number, number> = {};
    const day = ratingsByDate[todayStr] ?? {};
    for (const [k, r] of Object.entries(day)) out[Number(k)] = r.rating;
    return out;
  }, [ratingsByDate, todayStr]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layered atmospheric background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#FFF7ED_0%,#FEF3F2_35%,#EEF2FF_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.5] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 20% 0%, rgba(252,211,77,0.18), transparent 60%), radial-gradient(50% 35% at 100% 30%, rgba(244,114,182,0.16), transparent 60%), radial-gradient(70% 50% at 50% 100%, rgba(129,140,248,0.18), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div
        className="relative max-w-3xl mx-auto px-3 sm:px-6 pt-5 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <Header view={view} setView={setView} />

        <TabBar view={view} setView={setView} />

        <main className="mt-5 sm:mt-6">
          {view === "rate" && (
            <RatePanel activities={activities} todayRatings={todayRatings} />
          )}
          {view === "history" && (
            <HistoryPanel
              activities={activities}
              ratingsByDate={ratingsByDate}
              today={todayStr}
            />
          )}
          {view === "manage" && (
            <ManagePanel
              activities={activities}
              onClose={() => setView("rate")}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ───────────────────── Header ───────────────────── */

function Header({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <header className="relative flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span aria-hidden className="text-2xl leading-none">🌱</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight leading-none">
          Nourish
        </h1>
        <span
          className="hidden sm:inline text-xs text-stone-500"
          style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 400 }}
        >
          a quiet little journal
        </span>
      </div>
      <button
        type="button"
        onClick={() => setView(view === "manage" ? "rate" : "manage")}
        aria-label={view === "manage" ? "Close manage" : "Manage activities"}
        title={view === "manage" ? "Close" : "Manage activities"}
        className={`shrink-0 w-9 h-9 grid place-items-center rounded-full border transition-all active:scale-95
          ${
            view === "manage"
              ? "bg-stone-800 text-white border-stone-800 shadow-sm"
              : "bg-white/70 backdrop-blur text-stone-500 border-stone-200 hover:text-stone-800 hover:border-stone-300"
          }`}
      >
        {view === "manage" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )}
      </button>
    </header>
  );
}

/* ───────────────────── Tabs ───────────────────── */

function TabBar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const isManage = view === "manage";
  const activeIndex = view === "history" ? 1 : 0;

  return (
    <div className="relative mt-5 sm:mt-7">
      <div
        className={`relative grid grid-cols-2 items-end gap-1 sm:gap-3 transition-opacity duration-300 ${
          isManage ? "opacity-40" : "opacity-100"
        }`}
      >
        <TabButton
          label="Rate"
          active={view === "rate"}
          onClick={() => setView("rate")}
          align="left"
        />
        <TabButton
          label="History"
          active={view === "history"}
          onClick={() => setView("history")}
          align="right"
        />

        {/* Sliding marker — a hand-drawn-feeling underline */}
        <div className="absolute left-0 right-0 -bottom-[6px] h-[3px] pointer-events-none">
          <div
            className="absolute top-0 h-full rounded-full transition-all duration-500"
            style={{
              left: `${activeIndex * 50 + 8}%`,
              width: "34%",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              background:
                "linear-gradient(90deg, transparent 0%, #F59E0B 18%, #F59E0B 82%, transparent 100%)",
              boxShadow: "0 1px 0 rgba(245,158,11,0.25)",
            }}
          />
        </div>
        {/* Hairline separator */}
        <div className="absolute left-0 right-0 -bottom-[6px] h-px bg-stone-200/70 pointer-events-none" />
      </div>
      {isManage && (
        <p
          className="mt-3 text-center text-stone-500 text-sm"
          style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}
        >
          tending to the activity bank…
        </p>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  align,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative pb-3 transition-all ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      <span
        className={`block text-3xl sm:text-5xl leading-none tracking-tight transition-colors`}
        style={{
          fontFamily: "Fraunces, serif",
          fontStyle: "italic",
          fontWeight: active ? 500 : 400,
          color: active ? "#1C1917" : "#A8A29E",
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ───────────────────── Rate Panel ───────────────────── */

function RatePanel({
  activities,
  todayRatings,
}: {
  activities: Activity[];
  todayRatings: Record<number, number>;
}) {
  const grouped = useMemo(() => {
    const g: Record<TimeOfDay, Activity[]> = { morning: [], midday: [], evening: [], anytime: [] };
    for (const a of activities) {
      const t = (a.time_of_day as TimeOfDay) || "anytime";
      if (!g[t]) g[t] = [];
      g[t].push(a);
    }
    for (const key of TIME_OF_DAY_ORDER) g[key].sort((x, y) => x.sort_order - y.sort_order);
    return g;
  }, [activities]);

  return (
    <section className="space-y-4 sm:space-y-5">
      <p
        className="text-stone-500 text-sm sm:text-[15px]"
        style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 300 }}
      >
        How on top of each habit do you feel today?
      </p>

      {TIME_OF_DAY_ORDER.map((key) => {
        const items = grouped[key];
        if (!items?.length) return null;
        const info = TIMES_OF_DAY[key];
        return (
          <div key={key}>
            <SectionLabel icon={info.icon} label={info.label} accent={info.color} />
            <div className="space-y-1.5">
              {items.map((a) => (
                <RateRow key={a.id} activity={a} currentRating={todayRatings[a.id]} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function RateRow({ activity, currentRating }: { activity: Activity; currentRating: number | undefined }) {
  const fetcher = useFetcher();
  const pendingRating = fetcher.formData ? Number(fetcher.formData.get("rating")) : undefined;
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
      onRate={(rating) =>
        fetcher.submit(
          { intent: "set", activityId: String(activity.id), rating: String(rating) },
          { method: "post", action: "/api/ratings" },
        )
      }
    />
  );
}

function SectionLabel({ icon, label, accent }: { icon: string; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-0.5">
      <span aria-hidden className="text-base leading-none">{icon}</span>
      <h2
        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500"
      >
        {label}
      </h2>
      <div
        aria-hidden
        className="flex-1 h-px"
        style={{ background: `linear-gradient(to right, ${accent}88, transparent)` }}
      />
    </div>
  );
}

/* ───────────────────── History Panel ───────────────────── */

function HistoryPanel({
  activities,
  ratingsByDate,
  today: todayStr,
}: {
  activities: Activity[];
  ratingsByDate: Record<string, Record<number, ActivityRating>>;
  today: string;
}) {
  const dates = useMemo(() => {
    const set = new Set<string>([todayStr]);
    for (const d of Object.keys(ratingsByDate)) set.add(d);
    return Array.from(set).sort().reverse();
  }, [ratingsByDate, todayStr]);

  const [selected, setSelected] = useState<string>(todayStr);

  // If today drops off the list (data refresh), keep selection valid
  useEffect(() => {
    if (!dates.includes(selected)) setSelected(dates[0] ?? todayStr);
  }, [dates, selected, todayStr]);

  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && stripRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selected]);

  return (
    <section>
      {/* Date strip */}
      <div className="relative">
        <div
          ref={stripRef}
          className="flex items-end gap-2 overflow-x-auto pb-3 -mx-3 px-3 sm:-mx-6 sm:px-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {dates.map((d) => {
            const count = Object.keys(ratingsByDate[d] ?? {}).length;
            const isSelected = d === selected;
            const isToday = d === todayStr;
            return (
              <DateChip
                key={d}
                ref={isSelected ? activeRef : undefined}
                date={d}
                count={count}
                isSelected={isSelected}
                isToday={isToday}
                onClick={() => setSelected(d)}
              />
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-rose-50/90 via-rose-50/40 to-transparent"
        />
      </div>

      <DiaryEntry
        date={selected}
        activities={activities}
        ratings={ratingsByDate[selected] ?? {}}
        isToday={selected === todayStr}
      />
    </section>
  );
}

const DateChip = ({
  ref,
  date,
  count,
  isSelected,
  isToday,
  onClick,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  date: string;
  count: number;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}) => {
  const d = new Date(date + "T12:00:00");
  const dow = d.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
  const dayNum = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toLowerCase();

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${dow} ${month} ${dayNum}, ${count} ${count === 1 ? "rating" : "ratings"}`}
      className={`relative shrink-0 snap-center px-3 py-2 rounded-2xl border transition-all duration-300 active:scale-95
        ${
          isSelected
            ? "bg-stone-900 text-white border-stone-900 shadow-md shadow-stone-900/15 scale-105"
            : "bg-white/70 backdrop-blur text-stone-700 border-stone-200/80 hover:border-stone-400 hover:bg-white"
        }`}
      style={{ minWidth: 64 }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
            isSelected ? "text-amber-300" : "text-stone-400"
          }`}
          style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", letterSpacing: "0.08em" }}
        >
          {dow}
        </span>
        <span className="text-2xl leading-none font-extrabold tabular-nums">
          {dayNum}
        </span>
        <span
          className={`text-[9px] uppercase tracking-[0.12em] ${
            isSelected ? "text-stone-300" : "text-stone-400"
          }`}
        >
          {month}
        </span>
      </div>

      {/* Rating count indicator */}
      {count > 0 && (
        <span
          className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold tabular-nums shadow-sm
            ${isSelected ? "bg-amber-400 text-stone-900" : "bg-amber-300 text-stone-800"}`}
        >
          {count}
        </span>
      )}
      {isToday && !isSelected && (
        <span
          aria-hidden
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-400"
        />
      )}
    </button>
  );
};

function DiaryEntry({
  date,
  activities,
  ratings,
  isToday,
}: {
  date: string;
  activities: Activity[];
  ratings: Record<number, ActivityRating>;
  isToday: boolean;
}) {
  const d = new Date(date + "T12:00:00");
  const longDate = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const year = d.getFullYear();

  const grouped = useMemo(() => {
    const g: Record<TimeOfDay, Activity[]> = { morning: [], midday: [], evening: [], anytime: [] };
    for (const a of activities) {
      const t = (a.time_of_day as TimeOfDay) || "anytime";
      g[t].push(a);
    }
    for (const key of TIME_OF_DAY_ORDER) g[key].sort((x, y) => x.sort_order - y.sort_order);
    return g;
  }, [activities]);

  const totalRated = Object.keys(ratings).length;
  const avg =
    totalRated > 0
      ? Object.values(ratings).reduce((s, r) => s + r.rating, 0) / totalRated
      : 0;

  return (
    <article
      className="relative mt-2 rounded-3xl bg-[#FFFBF4]/95 backdrop-blur border border-stone-200/80 shadow-[0_30px_60px_-30px_rgba(120,53,15,0.18)] overflow-hidden"
    >
      {/* Decorative top ribbon */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background:
            "linear-gradient(90deg, #FBBF24 0%, #F472B6 35%, #818CF8 70%, #34D399 100%)",
        }}
      />
      {/* Subtle paper rule lines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(120,53,15,0.05) 32px)",
        }}
      />

      <div className="relative px-4 sm:px-7 pt-6 sm:pt-7 pb-5 sm:pb-7">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3
              className="text-2xl sm:text-3xl text-stone-900 leading-tight"
              style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 500 }}
            >
              {longDate}
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5 tabular-nums">
              {year} {isToday && <span className="text-rose-500 font-semibold">· today</span>}
            </p>
          </div>
          <DayStat totalRated={totalRated} avg={avg} />
        </div>

        <div className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
          {totalRated === 0 && (
            <p
              className="text-stone-400 text-base"
              style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 300 }}
            >
              {isToday ? "no notes yet — head to Rate to begin the day." : "nothing was logged on this day."}
            </p>
          )}
          {totalRated > 0 &&
            TIME_OF_DAY_ORDER.map((key) => {
              const items = grouped[key].filter((a) => ratings[a.id]);
              if (!items.length) return null;
              const info = TIMES_OF_DAY[key];
              return (
                <div key={key}>
                  <SectionLabel icon={info.icon} label={info.label} accent={info.color} />
                  <ul className="space-y-1.5">
                    {items.map((a) => (
                      <DiaryRow key={a.id} activity={a} rating={ratings[a.id]} />
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </div>
    </article>
  );
}

function DayStat({ totalRated, avg }: { totalRated: number; avg: number }) {
  if (totalRated === 0) {
    return (
      <span
        className="text-stone-400 text-xs uppercase tracking-[0.18em]"
      >
        empty page
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-semibold"
        >
          avg
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = avg >= n - 0.25;
            const half = !filled && avg >= n - 0.75;
            return (
              <span
                key={n}
                aria-hidden
                className={`text-sm leading-none ${filled || half ? "text-amber-400" : "text-stone-300"}`}
              >
                {filled ? "★" : half ? "⯨" : "☆"}
              </span>
            );
          })}
        </div>
      </div>
      <div className="w-px h-7 bg-stone-200" />
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-semibold">
          rated
        </span>
        <span className="text-base font-extrabold text-stone-800 tabular-nums leading-none">
          {totalRated}
        </span>
      </div>
    </div>
  );
}

function DiaryRow({ activity, rating }: { activity: Activity; rating: ActivityRating }) {
  return (
    <li
      className="relative flex items-center gap-3 rounded-xl bg-white/60 border border-stone-200/70 pl-3 pr-3 py-2"
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: activity.color }}
      />
      <span aria-hidden className="text-xl leading-none shrink-0">
        {activity.icon || "✨"}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-stone-800 text-sm sm:text-[15px] leading-tight truncate">
          {activity.name}
        </h4>
        {activity.notes && (
          <p className="mt-0.5 text-[12px] text-stone-500 italic leading-snug truncate">
            {activity.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            aria-hidden
            className={`text-sm leading-none ${n <= rating.rating ? "text-amber-400 drop-shadow-sm" : "text-stone-300"}`}
          >
            {n <= rating.rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    </li>
  );
}

/* ───────────────────── Manage Panel ───────────────────── */

function ManagePanel({
  activities,
  onClose,
}: {
  activities: Activity[];
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("weekly_challenge");
  const [newColor, setNewColor] = useState("#38BDF8");
  const [newIcon, setNewIcon] = useState("");
  const [newBaselineWeek, setNewBaselineWeek] = useState<string>("");
  const [newMaxPerDay, setNewMaxPerDay] = useState("1");
  const [newNotes, setNewNotes] = useState("");
  const [newTimeOfDay, setNewTimeOfDay] = useState<TimeOfDay>("anytime");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const fd: Record<string, string> = {
      intent: "create",
      name: newName.trim(),
      category: newCategory,
      color: newColor,
      max_per_day: newMaxPerDay || "1",
      time_of_day: newTimeOfDay,
    };
    if (newIcon) fd.icon = newIcon;
    if (newBaselineWeek) fd.baseline_week = newBaselineWeek;
    if (newNotes.trim()) fd.notes = newNotes.trim();
    fetcher.submit(fd, { method: "post", action: "/api/activities" });
    setNewName("");
    setNewIcon("");
    setNewBaselineWeek("");
    setNewMaxPerDay("1");
    setNewNotes("");
    setNewTimeOfDay("anytime");
    setShowAdd(false);
  };

  const handleDelete = (id: number) => {
    fetcher.submit({ intent: "delete", id: String(id) }, { method: "post", action: "/api/activities" });
  };

  const grouped: Record<TimeOfDay, Activity[]> = { morning: [], midday: [], evening: [], anytime: [] };
  for (const a of activities) grouped[(a.time_of_day as TimeOfDay) || "anytime"].push(a);
  for (const key of TIME_OF_DAY_ORDER) grouped[key].sort((x, y) => x.sort_order - y.sort_order);

  return (
    <div className="space-y-3">
      <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm border border-stone-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">Add activity</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-full hover:bg-indigo-200 active:scale-95 transition-all"
            >
              {showAdd ? "Cancel" : "New"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-stone-100 text-stone-700 text-[11px] font-bold rounded-full hover:bg-stone-200 active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Activity name"
                className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🍎"
                className="w-14 px-2 py-1.5 rounded-lg border border-stone-200 text-sm text-center focus:border-indigo-400 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <TimeOfDayPicker value={newTimeOfDay} onChange={setNewTimeOfDay} />
              <label className="flex items-center gap-1">
                <span className="font-semibold text-stone-500">Cat</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Category)}
                  className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none"
                >
                  {(["baseline", "weekly_challenge"] as Category[]).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORIES[cat].label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="font-semibold text-stone-500">Week</span>
                <select
                  value={newBaselineWeek}
                  onChange={(e) => setNewBaselineWeek(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none"
                >
                  <option value="">—</option>
                  {Object.keys(WEEK_COLORS).map((w) => (
                    <option key={w} value={w}>W{w}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="font-semibold text-stone-500">/day</span>
                <input
                  type="number"
                  min={1}
                  value={newMaxPerDay}
                  onChange={(e) => setNewMaxPerDay(e.target.value)}
                  className="w-12 px-1.5 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none"
                />
              </label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>

            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes"
              rows={2}
              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-3 py-1.5 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {TIME_OF_DAY_ORDER.map((key) => {
        const items = grouped[key];
        if (!items?.length) return null;
        const info = TIMES_OF_DAY[key];
        return (
          <section key={key}>
            <SectionLabel icon={info.icon} label={info.label} accent={info.color} />
            <div className="space-y-1.5">
              {items.map((a) => (
                <ActivityAdminRow
                  key={a.id}
                  activity={a}
                  isEditing={editingId === a.id}
                  onToggleEdit={() => setEditingId(editingId === a.id ? null : a.id)}
                  onDelete={() => handleDelete(a.id)}
                  onSaved={() => setEditingId(null)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TimeOfDayPicker({ value, onChange }: { value: TimeOfDay; onChange: (v: TimeOfDay) => void }) {
  return (
    <label className="flex items-center gap-1">
      <span className="font-semibold text-stone-500">Time</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeOfDay)}
        className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none"
      >
        {TIME_OF_DAY_ORDER.map((k) => (
          <option key={k} value={k}>{TIMES_OF_DAY[k].icon} {TIMES_OF_DAY[k].label}</option>
        ))}
      </select>
    </label>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Object.entries(ACTIVITY_COLORS).map(([name, hex]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(hex)}
          aria-label={name}
          className={`w-5 h-5 rounded-full transition-all ${
            value === hex ? "ring-2 ring-offset-1 ring-indigo-400 scale-110" : "hover:scale-110"
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

function ActivityAdminRow({
  activity,
  isEditing,
  onToggleEdit,
  onDelete,
  onSaved,
}: {
  activity: Activity;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  if (isEditing) {
    return <ActivityEditForm activity={activity} onCancel={onToggleEdit} onSaved={onSaved} />;
  }

  return (
    <div className="relative rounded-xl bg-white/80 backdrop-blur shadow-sm border border-stone-200">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: activity.color }}
        aria-hidden
      />
      <div className="relative pl-3 pr-2.5 py-2 sm:py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg sm:text-xl leading-none shrink-0" aria-hidden>
            {activity.icon || "✨"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-stone-800 text-sm sm:text-[15px] leading-tight truncate">
                {activity.name}
              </h3>
              {activity.baseline_week && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-stone-50 border border-stone-200 text-[10px] font-bold text-stone-600 tabular-nums leading-none shrink-0">
                  W{activity.baseline_week}
                </span>
              )}
              {activity.max_per_day > 1 && (
                <span className="text-[10px] font-bold text-stone-400 tabular-nums shrink-0">
                  {activity.max_per_day >= 99 ? "∞×" : `${activity.max_per_day}×`}
                </span>
              )}
            </div>
            {activity.notes && (
              <p className="mt-0.5 text-[12px] text-stone-500 italic leading-snug truncate">
                {activity.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onToggleEdit}
              className="px-2 py-1 text-[11px] font-bold text-stone-600 bg-stone-100 rounded-full hover:bg-stone-200 active:scale-95 transition-all"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete activity"
              className="p-1.5 text-stone-400 hover:text-red-500 active:scale-95 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityEditForm({
  activity,
  onCancel,
  onSaved,
}: {
  activity: Activity;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const fetcher = useFetcher();
  const [name, setName] = useState(activity.name);
  const [icon, setIcon] = useState(activity.icon ?? "");
  const [category, setCategory] = useState<Category>(activity.category as Category);
  const [color, setColor] = useState(activity.color);
  const [baselineWeek, setBaselineWeek] = useState<string>(
    activity.baseline_week != null ? String(activity.baseline_week) : ""
  );
  const [maxPerDay, setMaxPerDay] = useState(String(activity.max_per_day));
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>((activity.time_of_day as TimeOfDay) || "anytime");

  const handleSave = () => {
    fetcher.submit(
      {
        intent: "update",
        id: String(activity.id),
        name,
        icon,
        category,
        color,
        baseline_week: baselineWeek || "",
        max_per_day: maxPerDay || "1",
        notes,
        time_of_day: timeOfDay,
      } as Record<string, string>,
      { method: "post", action: "/api/activities" }
    );
    onSaved();
  };

  return (
    <div className="relative rounded-xl bg-white/90 backdrop-blur shadow-sm border-2 border-indigo-200">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} aria-hidden />
      <div className="relative pl-3 pr-3 py-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍎"
            className="w-14 px-2 py-1.5 rounded-lg border border-stone-200 text-sm text-center focus:border-indigo-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <TimeOfDayPicker value={timeOfDay} onChange={setTimeOfDay} />
          <label className="flex items-center gap-1">
            <span className="font-semibold text-stone-500">Cat</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
              className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none">
              {(["baseline", "weekly_challenge"] as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORIES[c].label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="font-semibold text-stone-500">Week</span>
            <select value={baselineWeek} onChange={(e) => setBaselineWeek(e.target.value)}
              className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none">
              <option value="">—</option>
              {Object.keys(WEEK_COLORS).map((w) => (
                <option key={w} value={w}>W{w}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="font-semibold text-stone-500">/day</span>
            <input type="number" min={1} value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)}
              className="w-12 px-1.5 py-1 rounded-lg border border-stone-200 text-[11px] focus:border-indigo-400 outline-none" />
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
        />

        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={onCancel}
            className="px-2.5 py-1 text-[11px] font-bold text-stone-600 bg-stone-100 rounded-full hover:bg-stone-200 active:scale-95 transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!name.trim()}
            className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-500 rounded-full hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
