import type { CalendarEvent } from "./calendarUtils";
import { timeToY, eventHeight } from "./calendarUtils";

const TYPE_STYLES: Record<
  CalendarEvent["type"],
  { border: string; bg: string }
> = {
  meal: { border: "border-l-[#8B6F47]", bg: "bg-[#faf5ee]" },
  shopping: { border: "border-l-danger", bg: "bg-[#fdf0f0]" },
  prep: { border: "border-l-gold", bg: "bg-[#fdf8ec]" },
};

interface EventBlockProps {
  event: CalendarEvent;
}

export default function EventBlock({ event }: EventBlockProps) {
  const top = timeToY(event.startTime);
  const height = eventHeight(event.startTime, event.endTime);
  const styles = TYPE_STYLES[event.type];

  return (
    <div
      className={`absolute left-0 right-1 rounded-[4px] border-l-4 ${styles.border} ${styles.bg} px-2 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-[filter]`}
      style={{ top, height }}
      title={event.title}
    >
      <span className="text-[12px] font-inter font-medium leading-tight line-clamp-3 text-gray-800">
        {event.title}
      </span>
    </div>
  );
}
