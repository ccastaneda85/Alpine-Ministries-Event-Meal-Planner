import MealPlanHeader from "../components/MealPlanHeader/MealPlanHeader";
import MealPlanTable from "../components/MealPlanTable/MealPlanTable";

export default function MealsPage() {
  return (
    <div className="flex flex-col gap-[12px] pt-[10px]">
      <MealPlanHeader />
      <MealPlanTable />
    </div>
  );
}
