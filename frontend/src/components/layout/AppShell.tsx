import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { BreadcrumbProvider, useBreadcrumbContext } from './BreadcrumbContext'

function TitleBar() {
  const { trail } = useBreadcrumbContext()
  return (
    <header className="title-bar">
      <h1 className="title-bar-brand">Alpine Retreat Meal Planner</h1>
      {trail.length > 0 && (
        <nav className="title-bar-crumbs" aria-label="Breadcrumb">
          {trail.map((label, i) => (
            <span key={i} className="title-bar-crumb">
              <span className="title-bar-sep" aria-hidden="true">›</span>
              <span className={i === trail.length - 1 ? 'title-bar-crumb-last' : ''}>{label}</span>
            </span>
          ))}
        </nav>
      )}
    </header>
  )
}

export default function AppShell() {
  // Escape closes the topmost modal. Every modal in the app uses
  // `onClick={e => e.target === e.currentTarget && onClose()}` on its
  // .modal-overlay, so clicking the overlay element itself triggers its close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      const overlays = document.querySelectorAll<HTMLElement>('.modal-overlay')
      const last = overlays[overlays.length - 1]
      if (last) {
        e.preventDefault()
        last.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <BreadcrumbProvider>
      <div className="shell">
        <Navbar />
        <div className="main-area">
          <TitleBar />
          <main className="view-content">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
