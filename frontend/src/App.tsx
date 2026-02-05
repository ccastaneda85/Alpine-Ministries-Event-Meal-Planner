import './index.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <a href="/">Alpine Meal Planner</a>
        </div>
        <ul className="nav-links">
          <li className="nav-dropdown">
            <span>Planning</span>
            <ul className="dropdown-menu">
              <li><a href="/meal-plans">Meal Plans</a></li>
              <li><a href="/event-days">Event Days</a></li>
              <li><a href="/kitchen-prep">Kitchen Prep</a></li>
            </ul>
          </li>
          <li className="nav-dropdown">
            <span>Catalog</span>
            <ul className="dropdown-menu">
              <li><a href="/menus">Menus</a></li>
              <li><a href="/menu-items">Menu Items</a></li>
              <li><a href="/ingredients">Ingredients</a></li>
            </ul>
          </li>
          <li className="nav-dropdown">
            <span>Reservations</span>
            <ul className="dropdown-menu">
              <li><a href="/group-reservations">Group Reservations</a></li>
              <li><a href="/attendance">Meal Attendance</a></li>
            </ul>
          </li>
          <li><a href="/purchase-lists">Purchasing</a></li>
          <li><a href="/dashboard">Dashboard</a></li>
        </ul>
      </nav>

      <main className="container">
        <div className="hero">
          <div className="hero-content">
            <h1>Alpine Meal Planner</h1>
            <p className="tagline">Streamlined meal planning for Alpine Ministries events</p>
          </div>
        </div>

        <div className="module-grid">
          <div className="module-card">
            <div className="card-icon">📋</div>
            <h2>Planning</h2>
            <p>Create and manage meal plans, event days, and kitchen prep lists for your events.</p>
            <ul className="card-links">
              <li><a href="/meal-plans">Meal Plans</a></li>
              <li><a href="/event-days">Event Days</a></li>
              <li><a href="/kitchen-prep">Kitchen Prep</a></li>
            </ul>
            <a href="/meal-plans" className="btn btn-primary">Manage Plans</a>
          </div>

          <div className="module-card">
            <div className="card-icon">🍽️</div>
            <h2>Menu Catalog</h2>
            <p>Maintain your collection of menus, menu items, ingredients, and recipes.</p>
            <ul className="card-links">
              <li><a href="/menus">Menus</a></li>
              <li><a href="/menu-items">Menu Items</a></li>
              <li><a href="/ingredients">Ingredients</a></li>
            </ul>
            <a href="/menus" className="btn btn-primary">Manage Catalog</a>
          </div>

          <div className="module-card">
            <div className="card-icon">👥</div>
            <h2>Reservations</h2>
            <p>Manage group reservations and track meal attendance for accurate planning.</p>
            <ul className="card-links">
              <li><a href="/group-reservations">Group Reservations</a></li>
              <li><a href="/attendance">Meal Attendance</a></li>
            </ul>
            <a href="/group-reservations" className="btn btn-primary">Manage Groups</a>
          </div>

          <div className="module-card">
            <div className="card-icon">🛒</div>
            <h2>Purchasing</h2>
            <p>Generate and manage purchase lists automatically from your meal plans.</p>
            <ul className="card-links">
              <li><a href="/purchase-lists">Purchase Lists</a></li>
            </ul>
            <a href="/purchase-lists" className="btn btn-primary">View Lists</a>
          </div>
        </div>

        <section className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Auto-Generated Days</h3>
              <p>Event days are automatically created when you set up a meal plan date range.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Portion Scaling</h3>
              <p>Recipes scale automatically based on attendance counts for adults, youth, and kids.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">✅</div>
              <h3>Kitchen Prep Tracking</h3>
              <p>Track preparation status with TODO, In Progress, and Done status updates.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔗</div>
              <h3>REST API</h3>
              <p>Full REST API available for integration with other systems and tools.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Alpine Ministries Event Meal Planner</p>
      </footer>
    </div>
  )
}

export default App
