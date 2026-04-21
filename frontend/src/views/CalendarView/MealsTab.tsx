import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import type { EventDay, MealPeriod, Menu, MenuItemSummary } from '../../types'
import { api } from '../../services/api'

const PERIOD_ORDER: MealPeriod['mealPeriodType'][] = ['BREAKFAST', 'LUNCH', 'DINNER']
const PERIOD_LABEL: Record<MealPeriod['mealPeriodType'], string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

interface Props {
  eventDay: EventDay | null
  mealPeriods: MealPeriod[]
  menus: Menu[]
  onAssignMenu: (mealPeriodId: number, menuId: number) => Promise<void>
  onClearMenu: (mealPeriodId: number) => Promise<void>
}

export default function MealsTab({ eventDay, mealPeriods, menus, onAssignMenu, onClearMenu }: Props) {
  const [pendingMenuId, setPendingMenuId] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [changing, setChanging] = useState<Record<number, boolean>>({})
  const [menuItems, setMenuItems] = useState<Record<number, MenuItemSummary[]>>({})

  // Fetch items for any assigned menus whenever mealPeriods changes
  useEffect(() => {
    mealPeriods.forEach(p => {
      if (p.menu) {
        api.getMenuItems(p.menu.menuId)
          .then(items => setMenuItems(prev => ({ ...prev, [p.mealPeriodId]: items })))
          .catch(console.error)
      }
    })
  }, [mealPeriods])

  if (!eventDay) {
    return <p className="empty-state">No event day configured for this date. Create a Meal Plan that includes this date to enable meal period management.</p>
  }

  async function handleAssign(period: MealPeriod) {
    const selectedId = pendingMenuId[period.mealPeriodId]
    if (!selectedId) return
    setSaving(period.mealPeriodId)
    try {
      await onAssignMenu(period.mealPeriodId, Number(selectedId))
      setPendingMenuId(prev => { const n = { ...prev }; delete n[period.mealPeriodId]; return n })
      setChanging(prev => { const n = { ...prev }; delete n[period.mealPeriodId]; return n })
    } finally {
      setSaving(null)
    }
  }

  async function handleClear(periodId: number) {
    setSaving(periodId)
    try {
      await onClearMenu(periodId)
      setMenuItems(prev => { const n = { ...prev }; delete n[periodId]; return n })
      setChanging(prev => { const n = { ...prev }; delete n[periodId]; return n })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <p className="groups-title">Meal Periods</p>
      <div className="meals-grid">
        {PERIOD_ORDER.map(type => {
          const period = mealPeriods.find(p => p.mealPeriodType === type)
          if (!period) {
            return (
              <div key={type} className="meal-card">
                <div className="meal-card-title">{PERIOD_LABEL[type]}</div>
                <p className="meal-assigned-label">No meal period found</p>
              </div>
            )
          }

          const isSaving = saving === period.mealPeriodId
          const isChanging = changing[period.mealPeriodId]
          const hasMenu = !!period.menu
          const items = menuItems[period.mealPeriodId] ?? []
          const showDropdown = !hasMenu || isChanging

          return (
            <div key={type} className="meal-card">
              <div className="meal-card-title">{PERIOD_LABEL[type]}</div>

              {hasMenu && !isChanging ? (
                <div className="meal-assigned-block">
                  <div className="meal-assigned-name-large">{period.menu!.menuName}</div>
                  {items.length > 0 && (
                    <ul className="meal-items-list">
                      {items.map(item => (
                        <li key={item.menuItemId}>{item.menuItemName}</li>
                      ))}
                    </ul>
                  )}
                  <div className="meal-actions">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      disabled={isSaving}
                      onClick={() => setChanging(prev => ({ ...prev, [period.mealPeriodId]: true }))}
                    >
                      Change Menu
                    </button>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      disabled={isSaving}
                      onClick={() => handleClear(period.mealPeriodId)}
                    >
                      {isSaving ? 'Clearing...' : 'Clear'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    className="meal-select"
                    value={pendingMenuId[period.mealPeriodId] ?? ''}
                    onChange={e => setPendingMenuId(prev => ({ ...prev, [period.mealPeriodId]: e.target.value }))}
                  >
                    <option value="">-- Select Menu --</option>
                    {menus.map(m => (
                      <option key={m.menuId} value={m.menuId}>{m.menuName}</option>
                    ))}
                  </select>
                  <div className="meal-actions">
                    <button
                      type="button"
                      className="btn-gold"
                      disabled={!pendingMenuId[period.mealPeriodId] || isSaving}
                      onClick={() => handleAssign(period)}
                    >
                      {isSaving ? 'Saving...' : 'Assign Menu'}
                    </button>
                    {isChanging && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setChanging(prev => { const n = { ...prev }; delete n[period.mealPeriodId]; return n })}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {eventDay.kitchenPrepList && (
        <div className="kitchen-prep-section">
          <p className="kitchen-prep-title">Kitchen Prep</p>
          <div className="kitchen-prep-info">
            <span>Prep List ID: {eventDay.kitchenPrepList.kitchenPrepListId}</span>
            <a
              href={`/kitchen-prep/${eventDay.kitchenPrepList.kitchenPrepListId}/view`}
              className="btn-gold"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> View Prep List
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
