import { formatWeekRange } from "./calendarUtils";

interface WeekNavigationProps {
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function WeekNavigation({
  monday,
  onPrev,
  onNext,
}: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-actor text-[20px] tracking-[-0.4px] text-black">
        {formatWeekRange(monday)}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-[14px] font-inter font-medium text-gray-600">
          Week
        </span>

        <div className="flex items-center bg-control-bg rounded-[8px] p-[4px]">
          <button
            onClick={onPrev}
            className="flex items-center justify-center h-[28px] w-[30px] rounded-l-[4px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-none cursor-pointer font-inter font-medium text-[14px] text-black"
          >
            &lt;
          </button>
          <button
            onClick={onNext}
            className="flex items-center justify-center h-[28px] w-[30px] rounded-r-[4px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-none cursor-pointer font-inter font-medium text-[14px] text-black"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
