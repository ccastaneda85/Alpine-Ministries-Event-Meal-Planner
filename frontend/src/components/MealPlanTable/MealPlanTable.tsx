import eyeIcon from "../../assets/icons/eye.svg";
import editIcon from "../../assets/icons/edit.svg";
import trashIcon from "../../assets/icons/trash.svg";

interface MealPlan {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  days: number;
  meals: number;
}

const MOCK_MEAL_PLANS: MealPlan[] = [
  { id: 1, name: "Test", startDate: "Feb 28, 2026", endDate: "Mar 1, 2026", days: 2, meals: 6 },
  { id: 2, name: "Spring Retreat", startDate: "Apr 10, 2026", endDate: "Apr 13, 2026", days: 4, meals: 12 },
  { id: 3, name: "Summer Camp", startDate: "Jun 15, 2026", endDate: "Jun 20, 2026", days: 6, meals: 18 },
];

const COLUMNS = ["ID", "Name", "Start Date", "End Date", "Days", "Meals", "Actions"];

export default function MealPlanTable() {
  return (
    <div className="border border-table-border rounded-[15px] overflow-hidden">
      <div className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.5fr_0.8fr_0.8fr_1fr] bg-table-header border-b border-table-border px-[35px] py-[12px]">
        {COLUMNS.map((col) => (
          <span
            key={col}
            className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]"
          >
            {col}
          </span>
        ))}
      </div>

      <div className="max-h-[355px] overflow-y-auto">
        {MOCK_MEAL_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.5fr_0.8fr_0.8fr_1fr] items-center px-[35px] py-[12px] border-b border-table-border last:border-b-0"
          >
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.id}
            </span>
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.name}
            </span>
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.startDate}
            </span>
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.endDate}
            </span>
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.days}
            </span>
            <span className="font-actor text-[20px] tracking-[-0.4px] text-black leading-[1.1]">
              {plan.meals}
            </span>
            <div className="flex gap-[10px]">
              <button className="w-[40px] h-[40px] rounded-[10px] bg-white border border-table-border flex items-center justify-center cursor-pointer hover:bg-table-border/50 transition-colors">
                <img src={eyeIcon} alt="View" className="w-[20px] h-[20px]" />
              </button>
              <button className="w-[40px] h-[40px] rounded-[10px] bg-white border border-table-border flex items-center justify-center cursor-pointer hover:bg-table-border/50 transition-colors">
                <img src={editIcon} alt="Edit" className="w-[20px] h-[20px]" />
              </button>
              <button className="w-[40px] h-[40px] rounded-[10px] bg-danger border-none flex items-center justify-center cursor-pointer hover:brightness-110 transition-all">
                <img src={trashIcon} alt="Delete" className="w-[20px] h-[20px] [filter:brightness(0)_invert(1)]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
