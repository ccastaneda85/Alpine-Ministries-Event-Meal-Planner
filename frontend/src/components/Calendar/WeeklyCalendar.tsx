import { useState, useMemo } from "react";
import type { CalendarEvent } from "./calendarUtils";
import {
  getMonday,
  addDays,
  getWeekDays,
  isSameDay,
  TOTAL_SLOTS,
  HOUR_HEIGHT,
} from "./calendarUtils";
import WeekNavigation from "./WeekNavigation";
import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";

const SAMPLE_EVENTS: CalendarEvent[] = createSampleEvents();

function createSampleEvents(): CalendarEvent[] {
  const monday = getMonday(new Date());
  const tue = addDays(monday, 1);
  const thu = addDays(monday, 3);
  const fri = addDays(monday, 4);
  const sat = addDays(monday, 5);

  function at(base: Date, h: number, m = 0): Date {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  }

  return [
    {
      id: "1",
      title: "Breakfast: Pancakes",
      type: "meal",
      mealCategory: "breakfast",
      startTime: at(tue, 9),
      endTime: at(tue, 10, 30),
    },
    {
      id: "2",
      title: "Lunch: Grilled Chicken Salad",
      type: "meal",
      mealCategory: "lunch",
      startTime: at(thu, 9),
      endTime: at(thu, 10, 30),
    },
    {
      id: "3",
      title: "Shopping For Breakfast & Lunch",
      type: "shopping",
      startTime: at(thu, 12, 30),
      endTime: at(thu, 14),
    },
    {
      id: "4",
      title: "Dinner: Spaghetti & Meatballs",
      type: "meal",
      mealCategory: "dinner",
      startTime: at(sat, 12, 30),
      endTime: at(sat, 14),
    },
    {
      id: "5",
      title: "Prep: Morning Setup",
      type: "prep",
      startTime: at(tue, 14, 30),
      endTime: at(tue, 16),
    },
    {
      id: "6",
      title: "Chop Vegetables for Stir Fry",
      type: "prep",
      startTime: at(fri, 14, 30),
      endTime: at(fri, 16),
    },
  ];
}

export default function WeeklyCalendar() {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const days = useMemo(() => getWeekDays(monday), [monday]);
  const today = useMemo(() => new Date(), []);

  const handlePrevWeek = () => setMonday((m) => addDays(m, -7));
  const handleNextWeek = () => setMonday((m) => addDays(m, 7));

  return (
    <div className="flex flex-col">
      <WeekNavigation
        monday={monday}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
      />

      <div className="flex border-t border-border overflow-x-auto">
        {/* Time gutter */}
        <div className="flex-shrink-0">
          {/* Spacer aligned with day headers */}
          <div className="h-[52px]" style={{ width: 60 }} />
          <TimeColumn />
        </div>

        {/* Day columns */}
        {days.map((day, i) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            dayIndex={i}
            events={SAMPLE_EVENTS}
            isToday={isSameDay(day, today)}
          />
        ))}
      </div>
    </div>
  );
}
