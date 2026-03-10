import { useState } from "react";
import MonthNavigator from "./MonthNavigator";
import SegmentedControl from "./SegmentedControl";

const VIEW_OPTIONS = ["Month", "Week", "Day", "List"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarHeader() {
  const [viewIndex, setViewIndex] = useState(0);
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2026);

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className="font-actor text-[34px] tracking-[-0.68px] text-black leading-[1.1] m-0">
        Alpine Retreat Meal Planner
      </h1>

      <hr className="w-full border-0 border-t border-border mt-[30px]" />

      <div className="flex items-center justify-between py-[16px]">
        <MonthNavigator onPrev={handlePrev} onNext={handleNext} />

        <span className="font-actor text-[34px] tracking-[-0.68px] text-black leading-[1.1]">
          {MONTHS[month]} {year}
        </span>

        <SegmentedControl
          options={VIEW_OPTIONS}
          activeIndex={viewIndex}
          onChange={setViewIndex}
        />
      </div>

      <hr className="w-full border-0 border-t border-border" />
    </div>
  );
}
