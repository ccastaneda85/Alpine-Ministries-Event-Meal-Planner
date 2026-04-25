import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Calendar, Users, UtensilsCrossed } from 'lucide-react'
import type { EventDay, GroupReservation, MealPeriod } from '../types'
import { api } from '../services/api'
import { useBreadcrumb } from '../components/layout/BreadcrumbContext'

const PERIOD_ORDER: ('BREAKFAST' | 'LUNCH' | 'DINNER')[] = ['BREAKFAST', 'LUNCH', 'DINNER']
const PERIOD_LABEL: Record<string, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner' }

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusFor(date: string, today: string): 'upcoming' | 'current' | 'past' {
  if (date < today) return 'past'
  if (date > today) return 'upcoming'
  return 'current'
}

export default function KitchenPrepView() {
  useBreadcrumb(['Kitchen Prep'])
  const navigate = useNavigate()
  const [eventDays, setEventDays] = useState<EventDay[]>([])
  const [reservations, setReservations] = useState<GroupReservation[]>([])
  const [periodsByDayId, setPeriodsByDayId] = useState<Record<number, MealPeriod[]>>({})
  const [loading, setLoading] = useState(true)
  const today = todayIso()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [allDays, allRes] = await Promise.all([
          api.getAllEventDays(),
          api.getAllReservations(),
        ])
        const withPrep = allDays.filter(d => d.kitchenPrepList)
        const periodLists = await Promise.all(
          withPrep.map(d => api.getMealPeriodsByEventDay(d.eventDayId).catch(() => [] as MealPeriod[])),
        )
        if (cancelled) return
        const map: Record<number, MealPeriod[]> = {}
        withPrep.forEach((d, i) => { map[d.eventDayId] = periodLists[i] })
        setEventDays(withPrep)
        setReservations(allRes)
        setPeriodsByDayId(map)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const sorted = useMemo(() => {
    const upcomingOrCurrent = eventDays
      .filter(d => d.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    const past = eventDays
      .filter(d => d.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))
    return [...upcomingOrCurrent, ...past]
  }, [eventDays, today])

  function groupsOnDate(date: string) {
    return reservations.filter(r => r.arrivalDate <= date && date <= r.departureDate)
  }

  function menusForDay(eventDayId: number) {
    const periods = periodsByDayId[eventDayId] ?? []
    return PERIOD_ORDER
      .map(type => {
        const mp = periods.find(p => p.mealPeriodType === type)
        return mp?.menu ? { type, menuName: mp.menu.menuName } : null
      })
      .filter(Boolean) as { type: string; menuName: string }[]
  }

  return (
    <div className="groups-view">
      <div className="groups-header">
        <div>
          <h1 className="groups-title"><ChefHat size={20} /> Kitchen Prep Lists</h1>
          <p className="groups-subtitle">All days with an active prep list, upcoming first. Click a card to open its prep tab on the calendar.</p>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Loading prep lists...</p>
      ) : sorted.length === 0 ? (
        <p className="empty-state">No kitchen prep lists have been created yet.</p>
      ) : (
        <div className="groups-list">
          {sorted.map(day => {
            const status = statusFor(day.date, today)
            const groups = groupsOnDate(day.date)
            const menus = menusForDay(day.eventDayId)
            return (
              <button
                key={day.eventDayId}
                type="button"
                className={`group-card group-card--${status}`}
                onClick={() => navigate(`/calendar?date=${day.date}&tab=kitchen-prep`)}
              >
                <div className="group-card-main">
                  <div className="group-card-name">
                    <Calendar size={15} />
                    {formatDate(day.date)}
                    <span className={`status-badge status-badge--${status === 'current' ? 'gold' : status === 'upcoming' ? 'info' : 'neutral'}`}>
                      {status === 'current' ? 'Today'
                        : status === 'upcoming' ? 'Upcoming'
                        : 'Past'}
                    </span>
                  </div>

                  <div className="kp-card-row">
                    <span className="kp-card-label"><Users size={12} /> Groups</span>
                    <span className="kp-card-value">
                      {groups.length === 0
                        ? <span className="kp-card-none">None</span>
                        : groups.map(g => g.groupName).join(', ')}
                    </span>
                  </div>

                  <div className="kp-card-row">
                    <span className="kp-card-label"><UtensilsCrossed size={12} /> Menus</span>
                    <span className="kp-card-value">
                      {menus.length === 0
                        ? <span className="kp-card-none">No menus assigned</span>
                        : menus.map(m => (
                            <span key={m.type} className="kp-card-menu">
                              <span className="kp-card-menu-period">{PERIOD_LABEL[m.type]}</span>
                              {m.menuName}
                            </span>
                          ))}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
