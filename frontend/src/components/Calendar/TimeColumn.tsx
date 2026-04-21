import { generateTimeSlots, HOUR_HEIGHT } from "./calendarUtils";

const slots = generateTimeSlots();

export default function TimeColumn() {
  return (
    <div className="relative" style={{ width: 60 }}>
      {slots.map((label, i) => (
        <div
          key={label}
          className="absolute right-2 -translate-y-1/2 text-[12px] font-inter text-gray-400 select-none"
          style={{ top: i * HOUR_HEIGHT }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
