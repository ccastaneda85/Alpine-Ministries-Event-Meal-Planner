import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import type { MealPlan } from '../../types'
import { api } from '../../services/api'

function extractApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/^\d+:\s*(.*)$/s)
  return match ? match[1] : raw
}

interface Props {
  editing: MealPlan | null
  defaultStartDate?: string
  defaultEndDate?: string
  onClose: () => void
  onSaved: (saved: MealPlan) => void
}

export default function PurchasingListFormModal({ editing, defaultStartDate, defaultEndDate, onClose, onSaved }: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [startDate, setStartDate] = useState(editing?.startDate ?? defaultStartDate ?? '')
  const [endDate, setEndDate] = useState(editing?.endDate ?? defaultEndDate ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = editing !== null
  const canSubmit = name.trim().length > 0 && startDate && endDate && startDate <= endDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const saved = isEdit && editing
        ? await api.updateMealPlan(editing.mealPlanId, name.trim(), startDate, endDate)
        : await api.createMealPlan(name.trim(), startDate, endDate)
      onSaved(saved)
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <h2 className="modal-title"><ShoppingBasket size={20} /> {isEdit ? 'Edit Purchasing List' : 'New Purchasing List'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              autoFocus
              placeholder="e.g. Winter Week 5"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || undefined}
                required
              />
            </div>
          </div>

          {startDate && endDate && startDate > endDate && (
            <p className="field-error" style={{ marginBottom: '0.75rem' }}>End date must be on or after start date.</p>
          )}

          {error && (
            <p className="field-error" style={{ marginBottom: '0.75rem' }}>{error}</p>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={!canSubmit || saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
