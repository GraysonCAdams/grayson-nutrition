export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function getWeekDates(referenceDate?: string): string[] {
  const d = referenceDate ? new Date(referenceDate + "T12:00:00") : new Date();
  const day = d.getDay(); // 0 = Sunday
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Returns a grid of weeks (array of 7-date arrays) covering the full month calendar view */
export function getMonthCalendarGrid(year: number, month: number): string[][] {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun

  // Start from the Sunday at or before the 1st
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startDow);

  const weeks: string[][] = [];
  const cursor = new Date(gridStart);

  // Generate enough weeks to cover the whole month (typically 4-6 weeks)
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Stop if we've passed the end of the month
    if (cursor.getMonth() !== month && cursor.getDay() === 0) break;
  }

  return weeks;
}

/** Returns the first and last date strings from a month calendar grid */
export function getMonthCalendarRange(grid: string[][]): [string, string] {
  return [grid[0][0], grid[grid.length - 1][6]];
}

export function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayNumber(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate().toString();
}

export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatMonthYearFromParts(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function shiftWeek(referenceDate: string, offset: number): string {
  const d = new Date(referenceDate + "T12:00:00");
  d.setDate(d.getDate() + offset * 7);
  return d.toISOString().split("T")[0];
}

export function formatWeekRange(dates: string[]): string {
  if (dates.length === 0) return "";
  const start = new Date(dates[0] + "T12:00:00");
  const end = new Date(dates[dates.length - 1] + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
