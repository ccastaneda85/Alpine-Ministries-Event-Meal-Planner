import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CalendarView from './views/CalendarView'
import MealPlanView from './views/MealPlanView'
import PurchasingView from './views/PurchasingView'
import KitchenPrepView from './views/KitchenPrepView'
import MenuCatalogView from './views/MenuCatalogView'
import GroupsView from './views/GroupsView'
import VendorsView from './views/VendorsView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/groups" element={<GroupsView />} />
          <Route path="/meal-plan" element={<MealPlanView />} />
          <Route path="/purchasing" element={<PurchasingView />} />
          <Route path="/kitchen-prep" element={<KitchenPrepView />} />
          <Route path="/catalog" element={<MenuCatalogView />} />
          <Route path="/vendors" element={<VendorsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
