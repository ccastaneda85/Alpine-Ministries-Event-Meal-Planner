import { useEffect, useMemo, useState } from 'react'
import { Users, Calendar, ArrowRight } from 'lucide-react'
import type { GroupReservation } from '../types'
import { api } from '../services/api'
import { useBreadcrumb } from '../components/layout/BreadcrumbContext'
import ViewGroupModal from './CalendarView/ViewGroupModal'

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

function totalCount(g: GroupReservation) {
  return g.defaultAdultCount + g.defaultYouthCount + g.defaultKidCount + g.defaultCodeCount
}

function statusFor(g: GroupReservation, today: string): 'upcoming' | 'current' | 'past' {
  if (g.departureDate < today) return 'past'
  if (g.arrivalDate > today) return 'upcoming'
  return 'current'
}

export default function GroupsView() {
  useBreadcrumb(['Groups'])
  const [groups, setGroups] = useState<GroupReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<GroupReservation | null>(null)
  const today = todayIso()

  async function load() {
    setLoading(true)
    try {
      const data = await api.getAllReservations()
      setGroups(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sorted = useMemo(() => {
    const upcomingOrCurrent = groups
      .filter(g => g.departureDate >= today)
      .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate))
    const past = groups
      .filter(g => g.departureDate < today)
      .sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate))
    return [...upcomingOrCurrent, ...past]
  }, [groups, today])

  async function handleUpdateGroup(
    id: number,
    data: Omit<GroupReservation, 'groupReservationId'>,
    resetAttendance?: boolean,
  ) {
    await api.updateReservation(id, data, resetAttendance)
    const refreshed = await api.getReservation(id)
    setSelected(refreshed)
    await load()
  }

  async function handleDeleteGroup(id: number) {
    await api.deleteReservation(id)
    setSelected(null)
    await load()
  }

  return (
    <div className="groups-view">
      <div className="groups-header">
        <div>
          <h1 className="groups-title"><Users size={20} /> Group Reservations</h1>
          <p className="groups-subtitle">All groups, upcoming first.</p>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Loading groups...</p>
      ) : sorted.length === 0 ? (
        <p className="empty-state">No group reservations yet.</p>
      ) : (
        <div className="groups-list">
          {sorted.map(g => {
            const status = statusFor(g, today)
            return (
              <button
                key={g.groupReservationId}
                type="button"
                className={`group-card group-card--${status}`}
                onClick={() => setSelected(g)}
              >
                <div className="group-card-main">
                  <div className="group-card-name">
                    {g.groupName}
                    <span className={`status-badge status-badge--${status === 'current' ? 'gold' : status === 'upcoming' ? 'info' : 'neutral'}`}>
                      {status === 'current' ? 'Currently attending'
                        : status === 'upcoming' ? 'Upcoming'
                        : 'Past'}
                    </span>
                  </div>
                  <div className="group-card-dates">
                    <Calendar size={13} />
                    {formatDate(g.arrivalDate)}
                    <ArrowRight size={12} className="group-card-arrow" />
                    {formatDate(g.departureDate)}
                  </div>
                </div>

                <div className="group-card-counts">
                  <div className="group-count-cell">
                    <span className="group-count-value">{g.defaultAdultCount}</span>
                    <span className="group-count-label">Adults</span>
                  </div>
                  <div className="group-count-cell">
                    <span className="group-count-value">{g.defaultYouthCount}</span>
                    <span className="group-count-label">Youth</span>
                  </div>
                  <div className="group-count-cell">
                    <span className="group-count-value">{g.defaultKidCount}</span>
                    <span className="group-count-label">Kids</span>
                  </div>
                  <div className="group-count-cell">
                    <span className="group-count-value">{g.defaultCodeCount}</span>
                    <span className="group-count-label">Code</span>
                  </div>
                  <div className="group-count-cell group-count-cell--total">
                    <span className="group-count-value">{totalCount(g)}</span>
                    <span className="group-count-label">Total</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <ViewGroupModal
          group={selected}
          onClose={() => setSelected(null)}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
    </div>
  )
}
