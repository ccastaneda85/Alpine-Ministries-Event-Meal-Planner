import type { GroupReservation, EventDay, MealPeriod, Menu, MenuItemSummary, GroupMealAttendance } from '../types'

const BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json() as Promise<T>
}

async function fetchVoid(url: string, options?: RequestInit): Promise<void> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${res.status}`)
}

export const api = {
  // Group Reservations
  getReservationsByRange: (start: string, end: string) =>
    fetchJson<GroupReservation[]>(`${BASE}/group-reservations/range?start=${start}&end=${end}`),

  createReservation: (body: Omit<GroupReservation, 'groupReservationId'>) =>
    fetchJson<GroupReservation>(`${BASE}/group-reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateReservation: (
    id: number,
    body: Omit<GroupReservation, 'groupReservationId'>,
    resetAttendance = false,
  ) =>
    fetchJson<GroupReservation>(`${BASE}/group-reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, resetAttendance }),
    }),

  deleteReservation: (id: number) =>
    fetchVoid(`${BASE}/group-reservations/${id}`, { method: 'DELETE' }),

  // Event Days
  getEventDayByDate: (date: string) =>
    fetchJson<EventDay>(`${BASE}/event-days/by-date?date=${date}`),

  // Meal Periods
  getMealPeriodsByEventDay: (eventDayId: number) =>
    fetchJson<MealPeriod[]>(`${BASE}/meal-periods/event-day/${eventDayId}`),

  assignMenu: (mealPeriodId: number, menuId: number) =>
    fetchJson<MealPeriod>(`${BASE}/meal-periods/${mealPeriodId}/menu`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId }),
    }),

  clearMenu: (mealPeriodId: number) =>
    fetchJson<MealPeriod>(`${BASE}/meal-periods/${mealPeriodId}/menu`, {
      method: 'DELETE',
    }),

  // Group Meal Attendance
  getAttendanceByReservation: (groupReservationId: number) =>
    fetchJson<GroupMealAttendance[]>(`${BASE}/group-meal-attendances/group-reservation/${groupReservationId}`),

  updateAttendance: (
    id: number,
    body: { adultCount: number; youthCount: number; kidCount: number; codeCount: number; customDietCount: number },
  ) =>
    fetchJson<GroupMealAttendance>(`${BASE}/group-meal-attendances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getAttendanceByReservationAndDate: (groupReservationId: number, date: string) =>
    fetchJson<GroupMealAttendance[]>(`${BASE}/group-meal-attendances/group-reservation/${groupReservationId}`)
      .then(records => records.filter(r => r.mealPeriod.eventDay.date === date)),

  deleteAttendanceForDate: (groupReservationId: number, date: string) =>
    fetchVoid(`${BASE}/group-meal-attendances/group-reservation/${groupReservationId}/date/${date}`, { method: 'DELETE' }),

  // Menus
  getAllMenus: () => fetchJson<Menu[]>(`${BASE}/menus`),
  getMenuItems: (menuId: number) => fetchJson<MenuItemSummary[]>(`${BASE}/menus/${menuId}/items`),
}
