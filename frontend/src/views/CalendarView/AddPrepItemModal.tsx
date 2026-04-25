import { useState } from 'react'
import { Users } from 'lucide-react'
import type { MealPeriod } from '../../types'
import { api } from '../../services/api'

const PERIOD_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

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

export default function AddPrepItemModal({ eventDayId, mealPeriods, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [fillingHeadcount, setFillingHeadcount] = useState(false)
  const [form, setForm] = useState({
    menuItemName: '',
    adultServings: 0,
    youthServings: 0,
    kidServings: 0,
    codeServings: 0,
    notes: '',
    mealPeriodId: '',
  })

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
    setSaving(true)
    try {
      await onSubmit({
        menuItemName: form.menuItemName,
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
        <h2 className="modal-title">Add Prep Item</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name</label>
            <input required value={form.menuItemName} onChange={e => set('menuItemName', e.target.value)} />
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
      </div>
    </div>
  )
}
