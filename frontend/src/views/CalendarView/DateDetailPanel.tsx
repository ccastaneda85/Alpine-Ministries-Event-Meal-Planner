import { Calendar, Users, UtensilsCrossed } from 'lucide-react'
import type { EventDay, GroupReservation, MealPeriod, Menu, MealTab } from '../../types'
import GroupsTab from './GroupsTab'
import MealsTab from './MealsTab'

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
  activeTab, onTabChange, onUpdateGroup, onDeleteGroup, onRefresh,
  onAssignMenu, onClearMenu,
}: Props) {
  return (
    <div className="detail-panel">
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
          <UtensilsCrossed size={15} /> Meal Planning
        </button>
      </div>

      <div className="detail-tab-content">
        {activeTab === 'groups' ? (
          <GroupsTab
            groups={reservationsOnDate}
            selectedDate={selectedDate}
            onUpdateGroup={onUpdateGroup}
            onDeleteGroup={onDeleteGroup}
            onRefresh={onRefresh}
          />
        ) : (
          <MealsTab
            eventDay={eventDay}
            mealPeriods={mealPeriods}
            menus={menus}
            onAssignMenu={onAssignMenu}
            onClearMenu={onClearMenu}
          />
        )}
      </div>
    </div>
  )
}
