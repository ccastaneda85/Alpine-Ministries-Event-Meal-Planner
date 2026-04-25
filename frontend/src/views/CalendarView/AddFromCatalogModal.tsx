import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import type { MealPeriod, MenuItemSummary } from '../../types'
import { api } from '../../services/api'

interface Props {
  eventDayId: number
  mealPeriods: MealPeriod[]
  onClose: () => void
  onSubmit: (data: {
    menuItemName: string
    adultServings: number
    youthServings: number
    kidServings: number
    codeServings: number
    notes?: string
    mealPeriodId?: number
  }) => Promise<void>
}

const PERIOD_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

export default function AddFromCatalogModal({ eventDayId, mealPeriods, onClose, onSubmit }: Props) {
  const [allItems, setAllItems] = useState<MenuItemSummary[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MenuItemSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [fillingHeadcount, setFillingHeadcount] = useState(false)
  const [form, setForm] = useState({
    adultServings: 0,
    youthServings: 0,
    kidServings: 0,
    codeServings: 0,
    notes: '',
    mealPeriodId: '',
  })

  useEffect(() => {
    api.getAllMenuItems().then(setAllItems).catch(console.error)
  }, [])

  const trimmed = query.trim()
  const filtered = trimmed
    ? allItems.filter(i => i.menuItemName.toLowerCase().includes(trimmed.toLowerCase()))
    : []

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function fillFromHeadcount() {
    setFillingHeadcount(true)
    try {
      const totals = form.mealPeriodId
        ? await api.getMealPeriodAttendanceTotals(Number(form.mealPeriodId))
        : await api.getEventDayAttendanceTotals(eventDayId)
      setForm(f => ({
        ...f,
        adultServings: totals.adultCount,
        youthServings: totals.youthCount,
        kidServings: totals.kidCount,
        codeServings: totals.codeCount,
      }))
    } finally {
      setFillingHeadcount(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await onSubmit({
        menuItemName: selected.menuItemName,
        adultServings: Number(form.adultServings),
        youthServings: Number(form.youthServings),
        kidServings: Number(form.kidServings),
        codeServings: Number(form.codeServings),
        notes: form.notes || undefined,
        mealPeriodId: form.mealPeriodId ? Number(form.mealPeriodId) : undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Add from Catalog</h2>

        {!selected ? (
          <>
            <div className="catalog-search-box">
              <input
                className="catalog-search-input"
                placeholder="Search menu items..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="catalog-list">
              {!trimmed && (
                <p className="empty-state" style={{ padding: '1rem' }}>Type to search the catalog.</p>
              )}
              {trimmed && filtered.length === 0 && (
                <p className="empty-state" style={{ padding: '1rem' }}>No items found.</p>
              )}
              {filtered.map(item => (
                <button
                  key={item.menuItemId}
                  type="button"
                  className="catalog-list-item"
                  onClick={() => setSelected(item)}
                >
                  {item.menuItemName}
                </button>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="catalog-selected-name">
              {selected.menuItemName}
              <button type="button" className="catalog-change-btn" onClick={() => setSelected(null)}>
                Change
              </button>
            </div>
            <div className="form-group">
              <label>Meal Period</label>
              <select value={form.mealPeriodId} onChange={e => set('mealPeriodId', e.target.value)}>
                <option value="">-- Unassigned --</option>
                {mealPeriods.map(p => (
                  <option key={p.mealPeriodId} value={p.mealPeriodId}>
                    {PERIOD_LABEL[p.mealPeriodType] ?? p.mealPeriodType}
                  </option>
                ))}
              </select>
            </div>
            <div className="headcount-fill-row">
              <button type="button" className="btn-outline btn-sm headcount-fill-btn" disabled={fillingHeadcount} onClick={fillFromHeadcount}>
                <Users size={13} />
                {fillingHeadcount ? 'Filling...' : form.mealPeriodId ? 'Fill from period headcount' : 'Fill from day headcount'}
              </button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Adults</label>
                <input type="number" min={0} value={form.adultServings} onChange={e => set('adultServings', +e.target.value)} />
              </div>
              <div className="form-group">
                <label>Youth</label>
                <input type="number" min={0} value={form.youthServings} onChange={e => set('youthServings', +e.target.value)} />
              </div>
              <div className="form-group">
                <label>Kids</label>
                <input type="number" min={0} value={form.kidServings} onChange={e => set('kidServings', +e.target.value)} />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input type="number" min={0} value={form.codeServings} onChange={e => set('codeServings', +e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-gold" disabled={saving}>
                {saving ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
