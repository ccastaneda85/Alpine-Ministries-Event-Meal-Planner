import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import CalendarPage from "./pages/CalendarPage";
import MealsPage from "./pages/MealsPage";
import ShoppingPage from "./pages/ShoppingPage";
import KitchenPage from "./pages/KitchenPage";
import RecipesPage from "./pages/RecipesPage";

export default function App() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="ml-[256px] flex-1 px-[36px] pt-[35px]">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
        </Routes>
      </main>
    </div>
  );
}
