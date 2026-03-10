interface SegmentedControlProps {
  options: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ options, activeIndex, onChange }: SegmentedControlProps) {
  return (
    <div className="flex items-start bg-control-bg rounded-[8px] p-[4px]">
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => onChange(index)}
          className={`
            flex items-center h-[32px] px-[12px] rounded-[4px] border-none cursor-pointer
            font-inter font-medium text-[16px] text-black whitespace-nowrap
            ${index === activeIndex
              ? "bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
              : "bg-transparent"
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
