export interface CalendarEvent {
  id: string;
  title: string;
  type: "meal" | "shopping" | "prep";
  startTime: Date;
  endTime: Date;
  mealCategory?: "breakfast" | "lunch" | "dinner";
}

export const START_HOUR = 6;
export const END_HOUR = 21;
export const HOUR_HEIGHT = 60;
export const TOTAL_SLOTS = END_HOUR - START_HOUR;

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const startMonth = SHORT_MONTHS[monday.getMonth()];
  const endMonth = SHORT_MONTHS[sunday.getMonth()];

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startMonth} ${monday.getDate()} - ${sunday.getDate()}`;
  }
  return `${startMonth} ${monday.getDate()} - ${endMonth} ${sunday.getDate()}`;
}

export function getDayLabel(dayIndex: number): string {
  return DAY_LABELS[dayIndex];
}

export function formatDayDate(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    if (h === 0) slots.push("12am");
    else if (h < 12) slots.push(`${h}am`);
    else if (h === 12) slots.push("12pm");
    else slots.push(`${h - 12}pm`);
  }
  return slots;
}

export function timeToY(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return (hours - START_HOUR) * HOUR_HEIGHT;
}

export function eventHeight(start: Date, end: Date): number {
  const startY = timeToY(start);
  const endY = timeToY(end);
  return Math.max(endY - startY, 24);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((e) => isSameDay(e.startTime, day));
}
