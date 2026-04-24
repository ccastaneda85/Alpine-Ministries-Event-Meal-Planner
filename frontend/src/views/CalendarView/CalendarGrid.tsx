import { ChevronLeft, ChevronRight, Calendar, User, ChefHat, ShoppingBasket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { GroupReservation } from '../../types'

interface DayIndicator {
  hasPrep: boolean
  hasPurchase: boolean
  purchaseMealPlanId: number | null
}

interface Props {
  year: number
  month: number
  selectedDate: string
  reservations: GroupReservation[]
  dayIndicators?: Record<string, DayIndicator>
  onDateSelect: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onAddGroup: () => void
  onViewGroup: (group: GroupReservation) => void
  onOpenKitchenPrep: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function groupsOnDate(reservations: GroupReservation[], date: string) {
  return reservations.filter(r => r.arrivalDate <= date && date <= r.departureDate)
}

function GroupBadge({ g, date, onViewGroup, onDateSelect }: {
  g: GroupReservation
  date: string
  onViewGroup: (g: GroupReservation) => void
  onDateSelect: (date: string) => void
}) {
  const total = g.defaultAdultCount + g.defaultYouthCount + g.defaultKidCount + g.defaultCodeCount
  return (
    <div className="cal-group-badge">
      <span className="cal-group-dot" />
      <button
        type="button"
        className="cal-group-name cal-group-name-btn"
        onClick={e => { e.stopPropagation(); onDateSelect(date); onViewGroup(g) }}
      >
        {g.groupName}
      </button>
      <span className="cal-group-headcount">
        <User size={9} />{total}
      </span>
    </div>
  )
}

export default function CalendarGrid({
  year, month, selectedDate, reservations, dayIndicators,
  onDateSelect, onPrevMonth, onNextMonth, onToday, onAddGroup, onViewGroup, onOpenKitchenPrep,
}: Props) {
  const navigate = useNavigate()
  const d = new Date()
  const todayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  type Cell = { date: string; day: number; current: boolean }
  const cells: Cell[] = []

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ date: toIso(y, m, d), day: d, current: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toIso(year, month, d), day: d, current: true })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ date: toIso(y, m, d), day: d, current: false })
  }

  return (
    <div className="calendar-card">
      <div className="calendar-card-header">
        <span className="calendar-card-title">Calendar</span>
        <div className="calendar-nav">
          <button className="btn-gold" onClick={onAddGroup} type="button">
            + Add Group Reservation
          </button>
          <button className="cal-today-btn" onClick={onToday} type="button">
            <Calendar size={14} /> Today
          </button>
          <button className="cal-nav-btn" onClick={onPrevMonth} type="button">
            <ChevronLeft size={16} />
          </button>
          <span className="cal-month-label">{MONTHS[month]} {year}</span>
          <button className="cal-nav-btn" onClick={onNextMonth} type="button">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-weekdays">
          {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>
        <div className="cal-days">
          {cells.map(({ date, day, current }) => {
            const groups = groupsOnDate(reservations, date)
            const isToday = date === todayIso
            const isSelected = date === selectedDate
            const overflow = groups.length > 3
            const grandTotal = groups.reduce((sum, g) =>
              sum + g.defaultAdultCount + g.defaultYouthCount + g.defaultKidCount + g.defaultCodeCount, 0)

            return (
              <div
                key={date}
                className={[
                  'cal-day',
                  !current ? 'other-month' : '',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : '',
                  overflow ? 'has-overflow' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onDateSelect(date)}
              >
                <div className="cal-day-inner">
                  <div className="cal-day-num">{day}</div>
                  {groups.length > 0 && (
                    <div className="cal-day-groups">
                      {groups.slice(0, 3).map(g => (
                        <GroupBadge key={g.groupReservationId} g={g} date={date} onViewGroup={onViewGroup} onDateSelect={onDateSelect} />
                      ))}
                      {overflow && <div className="cal-group-more">+{groups.length - 3} more</div>}
                    </div>
                  )}
                  {(grandTotal > 0 || dayIndicators?.[date]?.hasPrep || dayIndicators?.[date]?.hasPurchase) && (
                    <div className="cal-day-total">
                      {dayIndicators?.[date]?.hasPrep && (
                        <button
                          type="button"
                          className="cal-day-indicator cal-indicator-prep cal-indicator-btn"
                          title="Open kitchen prep list"
                          onClick={e => {
                            e.stopPropagation()
                            onOpenKitchenPrep(date)
                          }}
                        >
                          <ChefHat size={10} />
                        </button>
                      )}
                      {dayIndicators?.[date]?.hasPurchase && (
                        <button
                          type="button"
                          className="cal-day-indicator cal-indicator-purchase cal-indicator-btn"
                          title="Open purchase list"
                          onClick={e => {
                            e.stopPropagation()
                            const mpId = dayIndicators?.[date]?.purchaseMealPlanId
                            navigate(mpId != null ? `/purchasing?mealPlanId=${mpId}` : '/purchasing')
                          }}
                        >
                          <ShoppingBasket size={10} />
                        </button>
                      )}
                      {grandTotal > 0 && (
                        <span className="cal-day-headcount-total">
                          <User size={9} />{grandTotal}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {overflow && (
                  <div className="cal-day-popover">
                    <div className="cal-day-num">{day}</div>
                    {groups.map(g => (
                      <GroupBadge key={g.groupReservationId} g={g} date={date} onViewGroup={onViewGroup} onDateSelect={onDateSelect} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
