import { Calendar, Users, UtensilsCrossed, ChefHat } from 'lucide-react'
import type { EventDay, GroupReservation, MealPeriod, Menu, MealTab } from '../../types'
import GroupsTab from './GroupsTab'
import MealsTab from './MealsTab'
import KitchenPrepTab from './KitchenPrepTab'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>

interface Props {
  selectedDate: string
  reservationsOnDate: GroupReservation[]
  eventDay: EventDay | null
  mealPeriods: MealPeriod[]
  menus: Menu[]
  activeTab: MealTab
  onTabChange: (tab: MealTab) => void
  onUpdateGroup: (id: number, data: UpdatePayload, resetAttendance?: boolean) => Promise<void>
  onDeleteGroup: (id: number) => Promise<void>
  onRefresh: () => Promise<void>
  onRefreshEventDay: () => void
  onAssignMenu: (mealPeriodId: number, menuId: number) => Promise<void>
  onClearMenu: (mealPeriodId: number) => Promise<void>
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function DateDetailPanel({
  selectedDate, reservationsOnDate, eventDay, mealPeriods, menus,
  activeTab, onTabChange, onUpdateGroup, onDeleteGroup, onRefresh, onRefreshEventDay,
  onAssignMenu, onClearMenu,
}: Props) {
  return (
    <div className="detail-panel" id="date-detail-panel">
      <div className="detail-panel-header">
        <div className="detail-date-label">
          <Calendar size={18} />
          {formatDate(selectedDate)}
          <span className="detail-date-suffix">Details</span>
        </div>
      </div>

      <div className="detail-tabs">
        <button
          type="button"
          className={`detail-tab${activeTab === 'groups' ? ' active' : ''}`}
          onClick={() => onTabChange('groups')}
        >
          <Users size={15} /> Attendance
        </button>
        <button
          type="button"
          className={`detail-tab${activeTab === 'meals' ? ' active' : ''}`}
          onClick={() => onTabChange('meals')}
        >
          <UtensilsCrossed size={15} /> Menu Selection
        </button>
        <button
          type="button"
          className={`detail-tab${activeTab === 'kitchen-prep' ? ' active' : ''}`}
          onClick={() => onTabChange('kitchen-prep')}
        >
          <ChefHat size={15} /> Kitchen Prep
        </button>
      </div>

      <div className="detail-tab-content">
        {activeTab === 'groups' && (
          <GroupsTab
            groups={reservationsOnDate}
            selectedDate={selectedDate}
            onUpdateGroup={onUpdateGroup}
            onDeleteGroup={onDeleteGroup}
            onRefresh={onRefresh}
          />
        )}
        {activeTab === 'meals' && (
          <MealsTab
            eventDay={eventDay}
            mealPeriods={mealPeriods}
            menus={menus}
            onAssignMenu={onAssignMenu}
            onClearMenu={onClearMenu}
          />
        )}
        {activeTab === 'kitchen-prep' && (
          <KitchenPrepTab
            eventDay={eventDay}
            mealPeriods={mealPeriods}
            onRefresh={onRefreshEventDay}
          />
        )}
      </div>
    </div>
  )
}
