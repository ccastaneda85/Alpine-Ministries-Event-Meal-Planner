export interface GroupReservation {
  groupReservationId: number
  groupName: string
  defaultAdultCount: number
  defaultYouthCount: number
  defaultKidCount: number
  defaultCodeCount: number
  defaultCustomDietCount: number
  arrivalDate: string
  departureDate: string
  customDietNotes?: string
  notes?: string
}

export interface KitchenPrepList {
  kitchenPrepListId: number
  notes?: string
}

export interface EventDay {
  eventDayId: number
  date: string
  notes?: string
  kitchenPrepList?: KitchenPrepList
}

export interface Menu {
  menuId: number
  menuName: string
}

export interface MenuItemSummary {
  menuItemId: number
  menuItemName: string
  displayOrder: number | null
}

export interface MealPeriod {
  mealPeriodId: number
  mealPeriodType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  menu?: Menu
  eventDay?: { eventDayId: number; date: string }
}

export interface GroupMealAttendance {
  groupMealAttendanceId: number
  adultCount: number
  youthCount: number
  kidCount: number
  codeCount: number
  customDietCount: number
  mealPeriod: {
    mealPeriodId: number
    mealPeriodType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
    eventDay: { eventDayId: number; date: string }
  }
}

export type MealTab = 'groups' | 'meals'
