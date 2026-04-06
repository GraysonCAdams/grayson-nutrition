export const CATEGORIES = {
  baseline: { label: "Baseline", color: "#86EFAC" },
  weekly_challenge: { label: "New Weekly Challenges", color: "#93C5FD" },
} as const;

export type Category = keyof typeof CATEGORIES;

export const ACTIVITY_COLORS: Record<string, string> = {
  green: "#86EFAC",
  amber: "#FCD34D",
  coral: "#F87171",
  sky: "#38BDF8",
  violet: "#A78BFA",
  pink: "#F472B6",
  teal: "#2DD4BF",
  orange: "#FB923C",
};

// Colors assigned to week numbers for baseline_week dots
export const WEEK_COLORS: Record<number, { color: string; label: string }> = {
  1: { color: "#F87171", label: "Week 1" },
  2: { color: "#FB923C", label: "Week 2" },
  3: { color: "#FBBF24", label: "Week 3" },
  4: { color: "#34D399", label: "Week 4" },
  5: { color: "#38BDF8", label: "Week 5" },
  6: { color: "#A78BFA", label: "Week 6" },
  7: { color: "#F472B6", label: "Week 7" },
  8: { color: "#2DD4BF", label: "Week 8" },
  9: { color: "#818CF8", label: "Week 9" },
  10: { color: "#E879F9", label: "Week 10" },
};

export function getWeekColor(week: number): string {
  return WEEK_COLORS[week]?.color || WEEK_COLORS[((week - 1) % 10) + 1]?.color || "#94A3B8";
}

export const POSITIVE_PHRASES = [
  "Nice one!",
  "You're doing great!",
  "Keep it up!",
  "Way to go!",
  "Awesome!",
  "Look at you go!",
  "Nailed it!",
  "That's the spirit!",
  "Crushing it!",
  "Heck yeah!",
];

export function getRandomPhrase() {
  return POSITIVE_PHRASES[Math.floor(Math.random() * POSITIVE_PHRASES.length)];
}

export const SEED_ACTIVITIES = [
  { name: "Eat breakfast", category: "baseline", color: "#86EFAC", icon: "🍳", sort_order: 0, baseline_week: 1, max_per_day: 1 },
  { name: "Eat lunch", category: "baseline", color: "#86EFAC", icon: "🥗", sort_order: 1, baseline_week: null, max_per_day: 1 },
  { name: "Eat dinner", category: "baseline", color: "#86EFAC", icon: "🍽️", sort_order: 2, baseline_week: null, max_per_day: 1 },
  { name: "Drink water before coffee", category: "weekly_challenge", color: "#38BDF8", icon: "💧", sort_order: 0, baseline_week: 3, max_per_day: 1 },
  { name: "Have a fruit", category: "weekly_challenge", color: "#F87171", icon: "🍎", sort_order: 1, baseline_week: 3, max_per_day: 5 },
  { name: "Protein food with breakfast", category: "weekly_challenge", color: "#A78BFA", icon: "🥚", sort_order: 2, baseline_week: 3, max_per_day: 1 },
  { name: "Protein snack before workout", category: "weekly_challenge", color: "#FB923C", icon: "🍌", sort_order: 3, baseline_week: 3, max_per_day: 3 },
  { name: "Work out at office", category: "weekly_challenge", color: "#2DD4BF", icon: "🏢", sort_order: 4, baseline_week: 3, max_per_day: 1 },
  { name: "Work out at home", category: "weekly_challenge", color: "#F472B6", icon: "🏠", sort_order: 5, baseline_week: 3, max_per_day: 1 },
];
