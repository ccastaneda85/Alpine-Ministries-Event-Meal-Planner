import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppShell() {
  return (
    <div className="shell">
      <Navbar />
      <div className="main-area">
        <header className="title-bar">
          <h1>Alpine Retreat Meal Planner</h1>
        </header>
        <main className="view-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
