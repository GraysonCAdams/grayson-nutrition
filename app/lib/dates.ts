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

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
