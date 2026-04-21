import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CalendarView from './views/CalendarView'
import MealPlanView from './views/MealPlanView'
import PurchasingView from './views/PurchasingView'
import KitchenPrepView from './views/KitchenPrepView'
import MenuCatalogView from './views/MenuCatalogView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/meal-plan" element={<MealPlanView />} />
          <Route path="/purchasing" element={<PurchasingView />} />
          <Route path="/kitchen-prep" element={<KitchenPrepView />} />
          <Route path="/catalog" element={<MenuCatalogView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
