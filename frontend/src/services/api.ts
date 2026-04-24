import type { GroupReservation, EventDay, MealPeriod, Menu, MenuItemSummary, GroupMealAttendance, KitchenPrepList, KitchenPrepListItem, ReservationImpact, DayStatus, AttendanceTotals, GroupAttendanceRow, Ingredient, MenuItemRecipeEntry, MealPlan, MealPlanDetail, PurchaseList, PurchaseListItem } from '../types'

const BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[api] ${options?.method ?? 'GET'} ${url} → ${res.status}`, body)
    throw new Error(`${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

async function fetchVoid(url: string, options?: RequestInit): Promise<void> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[api] ${options?.method ?? 'GET'} ${url} → ${res.status}`, body)
    throw new Error(`${res.status}: ${body.slice(0, 300)}`)
  }
}

export const api = {
  // Group Reservations
  getReservationsByRange: (start: string, end: string) =>
    fetchJson<GroupReservation[]>(`${BASE}/group-reservations/range?start=${start}&end=${end}`),

  getReservation: (id: number) => fetchJson<GroupReservation>(`${BASE}/group-reservations/${id}`),

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

  getReservationDeletionImpact: (id: number) =>
    fetchJson<ReservationImpact>(`${BASE}/group-reservations/${id}/deletion-impact`),

  getReservationShrinkImpact: (id: number, newStart: string, newEnd: string) =>
    fetchJson<ReservationImpact>(`${BASE}/group-reservations/${id}/shrink-impact?newStart=${newStart}&newEnd=${newEnd}`),

  // Meal Plans
  getAllMealPlans: () => fetchJson<MealPlan[]>(`${BASE}/meal-plans`),
  getMealPlan: (id: number) => fetchJson<MealPlan>(`${BASE}/meal-plans/${id}`),
  createMealPlan: (name: string, startDate: string, endDate: string) =>
    fetchJson<MealPlan>(`${BASE}/meal-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    }),
  updateMealPlan: (id: number, name: string, startDate: string, endDate: string) =>
    fetchJson<MealPlan>(`${BASE}/meal-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    }),
  deleteMealPlan: (id: number) => fetchVoid(`${BASE}/meal-plans/${id}`, { method: 'DELETE' }),
  getMealPlanDetail: (id: number) => fetchJson<MealPlanDetail>(`${BASE}/meal-plans/${id}/detail`),

  // Purchase Lists
  getPurchaseListsByMealPlan: (mealPlanId: number) =>
    fetchJson<PurchaseList[]>(`${BASE}/purchase-lists/meal-plan/${mealPlanId}`),
  autoGeneratePurchaseList: (mealPlanId: number) =>
    fetchJson<PurchaseList>(`${BASE}/purchase-lists/generate/${mealPlanId}`, { method: 'POST' }),
  createEmptyPurchaseList: (mealPlanId: number) =>
    fetchJson<PurchaseList>(`${BASE}/purchase-lists/empty/${mealPlanId}`, { method: 'POST' }),
  clearGeneratedPurchaseListItems: (purchaseListId: number) =>
    fetchJson<number>(`${BASE}/purchase-lists/${purchaseListId}/clear-generated`, { method: 'POST' }),
  deletePurchaseList: (id: number) =>
    fetchVoid(`${BASE}/purchase-lists/${id}`, { method: 'DELETE' }),

  // Purchase List Items
  getPurchaseListItems: (purchaseListId: number) =>
    fetchJson<PurchaseListItem[]>(`${BASE}/purchase-list-items/purchase-list/${purchaseListId}`),
  addPurchaseListItem: (
    purchaseListId: number,
    body: { itemName: string; quantity: number; uom: string; notes?: string | null; ingredientId?: number | null }
  ) =>
    fetchJson<PurchaseListItem>(`${BASE}/purchase-list-items/purchase-list/${purchaseListId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        notes: body.notes ?? null,
        ingredientId: body.ingredientId ?? null,
      }),
    }),
  togglePurchaseListItem: (itemId: number) =>
    fetchJson<PurchaseListItem>(`${BASE}/purchase-list-items/${itemId}/toggle-checked`, { method: 'PATCH' }),
  deletePurchaseListItem: (itemId: number) =>
    fetchVoid(`${BASE}/purchase-list-items/${itemId}`, { method: 'DELETE' }),

  getMealPlanDayStatus: (mealPlanId: number) =>
    fetchJson<DayStatus[]>(`${BASE}/meal-plans/${mealPlanId}/day-status`),

  // Event Days
  getEventDayByDate: (date: string) =>
    fetchJson<EventDay>(`${BASE}/event-days/by-date?date=${date}`),

  getEventDaysByRange: (start: string, end: string) =>
    fetchJson<EventDay[]>(`${BASE}/event-days/range?start=${start}&end=${end}`),

  // Meal Periods
  getMealPeriodsByEventDay: (eventDayId: number) =>
    fetchJson<MealPeriod[]>(`${BASE}/meal-periods/event-day/${eventDayId}`),

  getMealPeriodGroupAttendances: (mealPeriodId: number) =>
    fetchJson<GroupAttendanceRow[]>(`${BASE}/meal-periods/${mealPeriodId}/group-attendances`),

  getMealPeriodAttendanceTotals: (mealPeriodId: number) =>
    fetchJson<AttendanceTotals>(`${BASE}/meal-periods/${mealPeriodId}/attendance-totals`),

  getEventDayAttendanceTotals: (eventDayId: number) =>
    fetchJson<AttendanceTotals>(`${BASE}/meal-periods/event-day/${eventDayId}/attendance-totals`),

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

  // Menu Items (catalog)
  getAllMenuItems: () => fetchJson<MenuItemSummary[]>(`${BASE}/menu-items`),

  // Menus
  getAllMenus: () => fetchJson<Menu[]>(`${BASE}/menus`),
  getMenuItems: (menuId: number) => fetchJson<MenuItemSummary[]>(`${BASE}/menus/${menuId}/items`),
  createMenu: (menuName: string) =>
    fetchJson<Menu>(`${BASE}/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuName }),
    }),
  updateMenu: (id: number, menuName: string) =>
    fetchJson<Menu>(`${BASE}/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuName }),
    }),
  deleteMenu: (id: number) => fetchVoid(`${BASE}/menus/${id}`, { method: 'DELETE' }),

  // Menu Entries
  getMenuEntriesByMenu: (menuId: number) =>
    fetchJson<{ menuEntryId: number; menuItemId: number; menuItemName: string; displayOrder: number | null }[]>(`${BASE}/menu-entries/menu/${menuId}`),
  addMenuEntry: (menuId: number, menuItemId: number) =>
    fetchJson<{ menuEntryId: number }>(`${BASE}/menu-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId, menuItemId, displayOrder: null }),
    }),
  removeMenuEntry: (menuEntryId: number) =>
    fetchVoid(`${BASE}/menu-entries/${menuEntryId}`, { method: 'DELETE' }),

  // Menu Items (catalog)
  createMenuItem: (menuItemName: string) =>
    fetchJson<MenuItemSummary>(`${BASE}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemName }),
    }),
  updateMenuItem: (id: number, menuItemName: string) =>
    fetchJson<MenuItemSummary>(`${BASE}/menu-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemName }),
    }),
  deleteMenuItem: (id: number) => fetchVoid(`${BASE}/menu-items/${id}`, { method: 'DELETE' }),

  // Menu Item Recipes
  getMenuItemRecipes: (menuItemId: number) =>
    fetchJson<MenuItemRecipeEntry[]>(`${BASE}/menu-item-recipes/menu-item/${menuItemId}`),
  addMenuItemRecipe: (menuItemId: number, ingredientId: number, adultPortion: number, youthPortion: number, kidPortion: number, codePortion: number, notes?: string | null) =>
    fetchVoid(`${BASE}/menu-item-recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemId, ingredientId, adultPortion, youthPortion, kidPortion, codePortion, notes: notes ?? null }),
    }),
  updateMenuItemRecipe: (id: number, adultPortion: number, youthPortion: number, kidPortion: number, codePortion: number, notes?: string | null) =>
    fetchVoid(`${BASE}/menu-item-recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adultPortion, youthPortion, kidPortion, codePortion, notes: notes ?? null }),
    }),
  deleteMenuItemRecipe: (id: number) => fetchVoid(`${BASE}/menu-item-recipes/${id}`, { method: 'DELETE' }),

  // Ingredients
  getAllIngredients: () => fetchJson<Ingredient[]>(`${BASE}/ingredients`),
  createIngredient: (ingredientName: string, unitOfMeasure: string) =>
    fetchJson<Ingredient>(`${BASE}/ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientName, unitOfMeasure }),
    }),
  updateIngredient: (id: number, ingredientName: string, unitOfMeasure: string) =>
    fetchJson<Ingredient>(`${BASE}/ingredients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientName, unitOfMeasure }),
    }),
  deleteIngredient: (id: number) => fetchVoid(`${BASE}/ingredients/${id}`, { method: 'DELETE' }),

  // Kitchen Prep
  getKitchenPrepByEventDay: (eventDayId: number) =>
    fetchJson<KitchenPrepList>(`${BASE}/kitchen-prep/event-day/${eventDayId}`),

  createKitchenPrepList: (eventDayId: number) =>
    fetchJson<KitchenPrepList>(`${BASE}/kitchen-prep/event-day/${eventDayId}`, { method: 'POST' }),

  updateKitchenPrepStaffInstructions: (id: number, staffInstructions: string) =>
    fetchJson<KitchenPrepList>(`${BASE}/kitchen-prep/${id}/staff-instructions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffInstructions }),
    }),

  getKitchenPrepItems: (prepListId: number) =>
    fetchJson<KitchenPrepListItem[]>(`${BASE}/kitchen-prep/${prepListId}/items`),

  addKitchenPrepItem: (
    prepListId: number,
    body: { menuItemName: string; adultServings: number; youthServings: number; kidServings: number; codeServings: number; notes?: string; mealPeriodId?: number },
  ) =>
    fetchJson<KitchenPrepListItem>(`${BASE}/kitchen-prep/${prepListId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteKitchenPrepItem: (itemId: number) =>
    fetchVoid(`${BASE}/kitchen-prep/items/${itemId}`, { method: 'DELETE' }),

  updateKitchenPrepItem: (
    itemId: number,
    body: { menuItemName: string; adultServings: number; youthServings: number; kidServings: number; codeServings: number },
  ) =>
    fetchJson<KitchenPrepListItem>(`${BASE}/kitchen-prep/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateKitchenPrepItemNotes: (itemId: number, notes: string) =>
    fetchJson<KitchenPrepListItem>(`${BASE}/kitchen-prep/items/${itemId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }),

  deleteKitchenPrepList: (id: number) =>
    fetchVoid(`${BASE}/kitchen-prep/${id}`, { method: 'DELETE' }),

  generateKitchenPrep: (id: number) =>
    fetchVoid(`${BASE}/kitchen-prep/${id}/generate`, { method: 'POST' }),

  clearGeneratedItems: (id: number) =>
    fetchVoid(`${BASE}/kitchen-prep/${id}/clear-generated`, { method: 'POST' }),

  // Preview which prep lists / purchase lists overlap a prospective reservation.
  // Any overlap means the user should regenerate those lists after the group is added.
  getReservationRangeImpact: async (start: string, end: string): Promise<ReservationRangeImpact> => {
    const prepLists: PrepListImpact[] = []
    const purchaseLists: PurchaseListImpact[] = []

    const dates: string[] = []
    {
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
    }

    // Prep lists — one per event day if it exists
    await Promise.all(dates.map(async date => {
      try {
        const ed = await fetchJson<EventDay>(`${BASE}/event-days/by-date?date=${date}`)
        const pl = await fetchJson<KitchenPrepList>(`${BASE}/kitchen-prep/event-day/${ed.eventDayId}`)
        prepLists.push({ date, kitchenPrepListId: pl.kitchenPrepListId })
      } catch {
        // 404 or network — no prep list for this date
      }
    }))

    // Purchase lists — any meal plan overlapping [start, end] with at least one generated list
    try {
      const plans = await fetchJson<MealPlan[]>(`${BASE}/meal-plans`)
      const overlapping = plans.filter(p => p.startDate <= end && p.endDate >= start)
      await Promise.all(overlapping.map(async mp => {
        try {
          const lists = await fetchJson<PurchaseList[]>(`${BASE}/purchase-lists/meal-plan/${mp.mealPlanId}`)
          for (const pl of lists) {
            purchaseLists.push({
              purchaseListId: pl.purchaseListId,
              mealPlanId: mp.mealPlanId,
              mealPlanName: mp.name,
              startDate: mp.startDate,
              endDate: mp.endDate,
              status: pl.status,
            })
          }
        } catch {
          // skip
        }
      }))
    } catch {
      // skip
    }

    prepLists.sort((a, b) => a.date.localeCompare(b.date))
    purchaseLists.sort((a, b) => a.startDate.localeCompare(b.startDate))
    return { prepLists, purchaseLists }
  },
}

export interface PrepListImpact {
  date: string
  kitchenPrepListId: number
}

export interface PurchaseListImpact {
  purchaseListId: number
  mealPlanId: number
  mealPlanName: string
  startDate: string
  endDate: string
  status: string
}

export interface ReservationRangeImpact {
  prepLists: PrepListImpact[]
  purchaseLists: PurchaseListImpact[]
}
