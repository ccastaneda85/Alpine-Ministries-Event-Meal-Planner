import type { CalendarEvent } from "./calendarUtils";
import {
  HOUR_HEIGHT,
  TOTAL_SLOTS,
  getEventsForDay,
  getDayLabel,
  formatDayDate,
} from "./calendarUtils";
import EventBlock from "./EventBlock";

interface DayColumnProps {
  day: Date;
  dayIndex: number;
  events: CalendarEvent[];
  isToday: boolean;
}

export default function DayColumn({
  day,
  dayIndex,
  events,
  isToday,
}: DayColumnProps) {
  const dayEvents = getEventsForDay(events, day);
  const totalHeight = TOTAL_SLOTS * HOUR_HEIGHT;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Day header */}
      <div
        className={`flex flex-col items-center py-2 border-b border-border ${
          isToday ? "bg-table-header" : ""
        }`}
      >
        <span className="text-[13px] font-inter font-semibold text-gray-600">
          {getDayLabel(dayIndex)}
        </span>
        <span className="text-[12px] font-inter text-gray-400">
          {formatDayDate(day)}
        </span>
      </div>

      {/* Time grid body */}
      <div
        className="relative border-r border-border"
        style={{ height: totalHeight }}
      >
        {/* Horizontal hour lines */}
        {Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}

        {/* Events */}
        {dayEvents.map((event) => (
          <EventBlock key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
