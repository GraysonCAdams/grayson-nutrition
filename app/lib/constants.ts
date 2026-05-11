export const CATEGORIES = {
  baseline: { label: "Baseline", color: "#86EFAC" },
  weekly_challenge: { label: "New Weekly Challenges", color: "#93C5FD" },
} as const;

export type Category = keyof typeof CATEGORIES;

export const TIMES_OF_DAY = {
  morning: { label: "Morning", icon: "🌅", color: "#FDE68A" },
  midday: { label: "Midday", icon: "🌞", color: "#FCA5A5" },
  evening: { label: "Evening", icon: "🌙", color: "#A5B4FC" },
  anytime: { label: "Anytime", icon: "✨", color: "#D1D5DB" },
} as const;

export type TimeOfDay = keyof typeof TIMES_OF_DAY;

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ["morning", "midday", "evening", "anytime"];

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

export type SeedActivity = {
  name: string;
  category: "baseline" | "weekly_challenge";
  color: string;
  icon: string;
  sort_order: number;
  baseline_week: number | null;
  max_per_day: number;
  notes: string | null;
  time_of_day: TimeOfDay;
};

export const SEED_ACTIVITIES: SeedActivity[] = [
  { name: "Eat breakfast", category: "baseline", color: "#86EFAC", icon: "🍳", sort_order: 0, baseline_week: 1, max_per_day: 1, notes: null, time_of_day: "morning" },
  { name: "Eat lunch", category: "baseline", color: "#86EFAC", icon: "🥗", sort_order: 1, baseline_week: null, max_per_day: 1, notes: null, time_of_day: "midday" },
  { name: "Eat dinner", category: "baseline", color: "#86EFAC", icon: "🍽️", sort_order: 2, baseline_week: null, max_per_day: 1, notes: null, time_of_day: "evening" },
  { name: "Drink water around coffee time", category: "weekly_challenge", color: "#38BDF8", icon: "💧", sort_order: 0, baseline_week: 3, max_per_day: 1, notes: null, time_of_day: "morning" },
  { name: "Have a fruit", category: "weekly_challenge", color: "#F87171", icon: "🍎", sort_order: 1, baseline_week: 3, max_per_day: 5, notes: null, time_of_day: "anytime" },
  { name: "Protein food with breakfast", category: "weekly_challenge", color: "#A78BFA", icon: "🥚", sort_order: 2, baseline_week: 3, max_per_day: 1, notes: null, time_of_day: "morning" },
  { name: "Protein snack before workout", category: "weekly_challenge", color: "#FB923C", icon: "🍌", sort_order: 3, baseline_week: 3, max_per_day: 3, notes: null, time_of_day: "anytime" },
  { name: "Work out at office", category: "weekly_challenge", color: "#2DD4BF", icon: "🏢", sort_order: 4, baseline_week: 3, max_per_day: 1, notes: null, time_of_day: "midday" },
  { name: "Work out at home", category: "weekly_challenge", color: "#F472B6", icon: "🏠", sort_order: 5, baseline_week: 3, max_per_day: 1, notes: null, time_of_day: "evening" },
  // Week 4
  { name: "Mid-morning hunger check-in", category: "weekly_challenge", color: "#FBBF24", icon: "🥜", sort_order: 6, baseline_week: 4, max_per_day: 1, notes: null, time_of_day: "morning" },
  { name: "More balanced dessert", category: "weekly_challenge", color: "#34D399", icon: "🍨", sort_order: 7, baseline_week: 4, max_per_day: 1, notes: null, time_of_day: "evening" },
  { name: "Reflect before dessert", category: "weekly_challenge", color: "#F472B6", icon: "🍰", sort_order: 8, baseline_week: 4, max_per_day: 1, notes: "because it tastes good is valid", time_of_day: "evening" },
  { name: "Bring a snack to work", category: "weekly_challenge", color: "#FB923C", icon: "🥨", sort_order: 9, baseline_week: 4, max_per_day: 1, notes: "chomp sticks + fruit, hummus cracker cups, chobani, banana", time_of_day: "morning" },
  { name: "Eat lunch by 12:30 on workdays", category: "weekly_challenge", color: "#FCD34D", icon: "⏰", sort_order: 10, baseline_week: 4, max_per_day: 1, notes: "Mon–Fri", time_of_day: "midday" },
  { name: "Grocery shop by Sunday morning", category: "weekly_challenge", color: "#818CF8", icon: "🛒", sort_order: 11, baseline_week: 4, max_per_day: 1, notes: "weekly", time_of_day: "morning" },
  { name: "Cook by Monday", category: "weekly_challenge", color: "#F87171", icon: "🥘", sort_order: 12, baseline_week: 4, max_per_day: 1, notes: "weekly", time_of_day: "anytime" },
  { name: "Protein with cinnamon rolls", category: "weekly_challenge", color: "#A78BFA", icon: "🍩", sort_order: 13, baseline_week: 4, max_per_day: 1, notes: "Mondays", time_of_day: "morning" },
  { name: "Yogurt in the morning", category: "weekly_challenge", color: "#2DD4BF", icon: "🥣", sort_order: 14, baseline_week: 4, max_per_day: 1, notes: null, time_of_day: "morning" },
];
