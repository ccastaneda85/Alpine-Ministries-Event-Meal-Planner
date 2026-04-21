import CalendarHeader from "../components/CalendarHeader/CalendarHeader";
import WeeklyCalendar from "../components/Calendar/WeeklyCalendar";

export default function CalendarPage() {
  return (
    <div className="flex flex-col">
      <CalendarHeader />
      <WeeklyCalendar />
    </div>
  );
}
