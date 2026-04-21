import { useState, useEffect } from 'react'
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

export default function CalendarView() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [reservations, setReservations] = useState<GroupReservation[]>([])
  const [eventDay, setEventDay] = useState<EventDay | null>(null)
  const [mealPeriods, setMealPeriods] = useState<MealPeriod[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [activeTab, setActiveTab] = useState<MealTab>('groups')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewGroupTarget, setViewGroupTarget] = useState<GroupReservation | null>(null)

  // Fetch reservations for visible month
  useEffect(() => {
    const { start, end } = monthRange(year, month)
    api.getReservationsByRange(start, end).then(setReservations).catch(console.error)
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
    await refreshReservations()
  }

  async function handleUpdateGroup(
    id: number,
    data: Omit<GroupReservation, 'groupReservationId'>,
    resetAttendance = false,
  ) {
    await api.updateReservation(id, data, resetAttendance)
    await refreshReservations()
  }

  async function handleDeleteGroup(id: number) {
    await api.deleteReservation(id)
    await refreshReservations()
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
        onDateSelect={setSelectedDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={goToday}
        onAddGroup={() => setShowAddModal(true)}
        onViewGroup={setViewGroupTarget}
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
