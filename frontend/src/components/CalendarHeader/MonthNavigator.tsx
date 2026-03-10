interface MonthNavigatorProps {
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ onPrev, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-start bg-control-bg rounded-[8px] p-[4px]">
      <button
        onClick={onPrev}
        className="flex items-center justify-center h-[32px] w-[35px] rounded-l-[4px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-none cursor-pointer font-inter font-medium text-[16px] text-black"
      >
        &lt;
      </button>
      <button
        onClick={onNext}
        className="flex items-center justify-center h-[32px] px-[12px] rounded-r-[4px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-none cursor-pointer font-inter font-medium text-[16px] text-black"
      >
        &gt;
      </button>
    </div>
  );
}
