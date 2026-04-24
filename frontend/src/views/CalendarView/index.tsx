import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarGrid from './CalendarGrid'
import DateDetailPanel from './DateDetailPanel'
import AddGroupModal from './AddGroupModal'
import ViewGroupModal from './ViewGroupModal'
import { api } from '../../services/api'
import type { GroupReservation, EventDay, MealPeriod, Menu, MealTab } from '../../types'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function eachDateIso(start: string, end: string) {
  const dates: string[] = []
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cur = new Date(Date.UTC(sy, sm - 1, sd))
  const endUtc = Date.UTC(ey, em - 1, ed)
  while (cur.getTime() <= endUtc) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

const STORAGE_KEY_SELECTED_DATE = 'calendar:selectedDate'

export default function CalendarView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const storedDate = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SELECTED_DATE) : null
  const initialDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam
    : storedDate && /^\d{4}-\d{2}-\d{2}$/.test(storedDate) ? storedDate
    : todayIso()
  const [initialYear, initialMonth] = (() => {
    const [y, m] = initialDate.split('-').map(Number)
    return [y, m - 1]
  })()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState(initialDate)

  // Consume date + tab query params on first load, then strip them.
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'groups' || tabParam === 'meals' || tabParam === 'kitchen-prep') {
      setActiveTab(tabParam)
      // Give React a tick to render the selected tab, then scroll the detail panel into view.
      setTimeout(() => {
        document.getElementById('date-detail-panel')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 80)
    }
    if (dateParam || tabParam) {
      const next = new URLSearchParams(searchParams)
      next.delete('date')
      next.delete('tab')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist the selected date so page reloads return the user to where they were.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SELECTED_DATE, selectedDate)
  }, [selectedDate])
  const [reservations, setReservations] = useState<GroupReservation[]>([])
  const [eventDay, setEventDay] = useState<EventDay | null>(null)
  const [mealPeriods, setMealPeriods] = useState<MealPeriod[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [activeTab, setActiveTab] = useState<MealTab>('groups')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewGroupTarget, setViewGroupTarget] = useState<GroupReservation | null>(null)
  const [dayIndicators, setDayIndicators] = useState<Record<string, { hasPrep: boolean; hasPurchase: boolean; purchaseMealPlanId: number | null }>>({})

  // Fetch reservations for visible month
  useEffect(() => {
    const { start, end } = monthRange(year, month)
    api.getReservationsByRange(start, end).then(setReservations).catch(console.error)
  }, [year, month])

  async function refreshDayIndicators() {
    const { start, end } = monthRange(year, month)
    try {
      const [eventDays, mealPlans] = await Promise.all([
        api.getEventDaysByRange(start, end),
        api.getAllMealPlans(),
      ])
      const map: Record<string, { hasPrep: boolean; hasPurchase: boolean; purchaseMealPlanId: number | null }> = {}
      for (const ed of eventDays) {
        map[ed.date] = { hasPrep: !!ed.kitchenPrepList, hasPurchase: false, purchaseMealPlanId: null }
      }
      const overlapping = mealPlans.filter(p => p.startDate <= end && p.endDate >= start)
      const listsPerPlan = await Promise.all(
        overlapping.map(p => api.getPurchaseListsByMealPlan(p.mealPlanId).catch(() => [])),
      )
      overlapping.forEach((plan, i) => {
        if (listsPerPlan[i].length === 0) return
        for (const date of eachDateIso(plan.startDate, plan.endDate)) {
          if (date < start || date > end) continue
          if (!map[date]) map[date] = { hasPrep: false, hasPurchase: false, purchaseMealPlanId: null }
          map[date].hasPurchase = true
          if (map[date].purchaseMealPlanId === null) {
            map[date].purchaseMealPlanId = plan.mealPlanId
          }
        }
      })
      setDayIndicators(map)
    } catch (err) {
      console.error('[calendar] failed to load day indicators', err)
    }
  }

  // Refresh indicators when the visible month changes
  useEffect(() => {
    refreshDayIndicators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  // Fetch event day + meal periods for selected date
  useEffect(() => {
    setEventDay(null)
    setMealPeriods([])
    api.getEventDayByDate(selectedDate)
      .then(async ed => {
        setEventDay(ed)
        const periods = await api.getMealPeriodsByEventDay(ed.eventDayId)
        setMealPeriods(periods)
      })
      .catch(() => {
        setEventDay(null)
        setMealPeriods([])
      })
  }, [selectedDate])

  // Fetch menus once
  useEffect(() => {
    api.getAllMenus().then(setMenus).catch(console.error)
  }, [])

  const reservationsOnDate = reservations.filter(
    r => r.arrivalDate <= selectedDate && selectedDate <= r.departureDate,
  )

  async function refreshReservations() {
    const { start, end } = monthRange(year, month)
    const updated = await api.getReservationsByRange(start, end)
    setReservations(updated)
  }

  async function refreshMealPeriods() {
    if (!eventDay) return
    const periods = await api.getMealPeriodsByEventDay(eventDay.eventDayId)
    setMealPeriods(periods)
  }

  async function refreshEventDay() {
    try {
      const ed = await api.getEventDayByDate(selectedDate)
      setEventDay(ed)
      const periods = await api.getMealPeriodsByEventDay(ed.eventDayId)
      setMealPeriods(periods)
    } catch {
      setEventDay(null)
      setMealPeriods([])
    }
    // Keep the month's indicator icons in sync with per-day changes
    // (create/delete prep list, menu assignment side effects, etc.)
    refreshDayIndicators()
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    const t = todayIso()
    const d = new Date(t)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelectedDate(t)
  }

  async function handleAddGroup(data: Omit<GroupReservation, 'groupReservationId'>) {
    await api.createReservation(data)
    await Promise.all([refreshReservations(), refreshEventDay(), refreshDayIndicators()])
  }

  async function handleUpdateGroup(
    id: number,
    data: Omit<GroupReservation, 'groupReservationId'>,
    resetAttendance = false,
  ) {
    await api.updateReservation(id, data, resetAttendance)
    await Promise.all([refreshReservations(), refreshEventDay(), refreshDayIndicators()])
  }

  async function handleDeleteGroup(id: number) {
    await api.deleteReservation(id)
    await Promise.all([refreshReservations(), refreshEventDay(), refreshDayIndicators()])
  }

  async function handleAssignMenu(mealPeriodId: number, menuId: number) {
    await api.assignMenu(mealPeriodId, menuId)
    await refreshMealPeriods()
  }

  async function handleClearMenu(mealPeriodId: number) {
    await api.clearMenu(mealPeriodId)
    await refreshMealPeriods()
  }

  return (
    <div className="calendar-view">
      <CalendarGrid
        year={year}
        month={month}
        selectedDate={selectedDate}
        reservations={reservations}
        dayIndicators={dayIndicators}
        onDateSelect={setSelectedDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={goToday}
        onAddGroup={() => setShowAddModal(true)}
        onViewGroup={setViewGroupTarget}
        onOpenKitchenPrep={date => {
          setSelectedDate(date)
          setActiveTab('kitchen-prep')
          // Wait a tick for the panel to render with the new date before scrolling.
          setTimeout(() => {
            document.getElementById('date-detail-panel')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }, 50)
        }}
      />
      <DateDetailPanel
        selectedDate={selectedDate}
        reservationsOnDate={reservationsOnDate}
        eventDay={eventDay}
        mealPeriods={mealPeriods}
        menus={menus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onRefresh={refreshReservations}
        onRefreshEventDay={refreshEventDay}
        onAssignMenu={handleAssignMenu}
        onClearMenu={handleClearMenu}
      />
      {showAddModal && (
        <AddGroupModal
          defaultArrival={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddGroup}
        />
      )}
      {viewGroupTarget && (
        <ViewGroupModal
          group={viewGroupTarget}
          onClose={() => setViewGroupTarget(null)}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
    </div>
  )
}
