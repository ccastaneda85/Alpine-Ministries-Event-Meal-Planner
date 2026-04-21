export default function MealPlanHeader() {
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between py-[20px]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="font-actor text-[36px] tracking-[-0.72px] text-black leading-[1.1] m-0">
            Meals Plan
          </h2>
          <p className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1] m-0">
            Create and manage meal plans.
          </p>
        </div>

        <button className="bg-gold text-white font-actor text-[20px] tracking-[-0.4px] leading-[1.1] px-[28px] py-[10px] rounded-[10px] border-none cursor-pointer hover:brightness-110 transition-all">
          + New Meal Plan
        </button>
      </div>
    </div>
  );
}
