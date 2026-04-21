import { NavLink } from 'react-router-dom'
import { Calendar, UtensilsCrossed, ShoppingBasket, ChefHat, BookOpen, UserCircle } from 'lucide-react'
import logo from '../../assets/AlpineMainLogo.png'

const navItems = [
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meal-plan', icon: UtensilsCrossed, label: 'Meal Plan' },
  { to: '/purchasing', icon: ShoppingBasket, label: 'Purchasing' },
  { to: '/kitchen-prep', icon: ChefHat, label: 'Kitchen Prep' },
  { to: '/catalog', icon: BookOpen, label: 'Menu Catalog' },
]

export default function Navbar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Alpine" />
      </div>

      <div className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            <Icon size={26} />
            <span className="sidebar-tooltip">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-user">
        <button className="sidebar-item" type="button">
          <UserCircle size={26} />
          <span className="sidebar-tooltip">Profile</span>
        </button>
      </div>
    </nav>
  )
}
