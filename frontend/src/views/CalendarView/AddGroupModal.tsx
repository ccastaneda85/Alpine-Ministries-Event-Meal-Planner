import { useState } from 'react'
import type { GroupReservation } from '../../types'
import { api, type ReservationRangeImpact } from '../../services/api'

interface Props {
  defaultArrival: string
  defaultDeparture?: string
  onClose: () => void
  onSubmit: (data: Omit<GroupReservation, 'groupReservationId'>) => Promise<void>
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function AddGroupModal({ defaultArrival, defaultDeparture, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [impact, setImpact] = useState<ReservationRangeImpact | null>(null)
  const [dietNotesError, setDietNotesError] = useState(false)
  const [form, setForm] = useState({
    groupName: '',
    arrivalDate: defaultArrival,
    departureDate: defaultDeparture ?? defaultArrival,
    defaultAdultCount: 0,
    defaultYouthCount: 0,
    defaultKidCount: 0,
    defaultCodeCount: 0,
    defaultCustomDietCount: 0,
    customDietNotes: '',
    notes: '',
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function doSubmit() {
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.defaultCustomDietCount > 0 && !form.customDietNotes.trim()) {
      setDietNotesError(true)
      return
    }
    if (form.departureDate < form.arrivalDate) return

    setChecking(true)
    try {
      const result = await api.getReservationRangeImpact(form.arrivalDate, form.departureDate)
      if (result.prepLists.length === 0 && result.purchaseLists.length === 0) {
        await doSubmit()
      } else {
        setImpact(result)
      }
    } finally {
      setChecking(false)
    }
  }

  if (impact) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <h2 className="modal-title">Existing lists will be affected</h2>
          <p className="modal-intro">
            Adding <strong>{form.groupName || 'this group'}</strong> for{' '}
            <strong>{formatDate(form.arrivalDate)}</strong>
            {form.arrivalDate !== form.departureDate && <> – <strong>{formatDate(form.departureDate)}</strong></>}
            {' '}overlaps lists that have already been generated. You will need to regenerate them after adding the group so quantities reflect the new headcount.
          </p>

          {impact.prepLists.length > 0 && (
            <div className="impact-section">
              <h3 className="impact-heading">Kitchen Prep Lists</h3>
              <ul className="impact-list">
                {impact.prepLists.map(p => (
                  <li key={p.kitchenPrepListId}>{formatDate(p.date)}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.purchaseLists.length > 0 && (
            <div className="impact-section">
              <h3 className="impact-heading">Purchase Lists</h3>
              <ul className="impact-list">
                {impact.purchaseLists.map(p => (
                  <li key={p.purchaseListId}>
                    <strong>{p.mealPlanName}</strong>
                    {' '}({formatDate(p.startDate)} – {formatDate(p.endDate)})
                    {' '}<span className="impact-status">[{p.status}]</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-outline" disabled={saving} onClick={() => setImpact(null)}>
              Back
            </button>
            <button type="button" className="btn-gold" disabled={saving} onClick={doSubmit}>
              {saving ? 'Adding...' : 'Add Anyway'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Add Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name</label>
            <input required value={form.groupName} onChange={e => set('groupName', e.target.value)} />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Arrival Date</label>
              <input type="date" required value={form.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Departure Date</label>
              <input type="date" required value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Adults</label>
              <input type="number" min={0} value={form.defaultAdultCount} onChange={e => set('defaultAdultCount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Youth</label>
              <input type="number" min={0} value={form.defaultYouthCount} onChange={e => set('defaultYouthCount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Kids</label>
              <input type="number" min={0} value={form.defaultKidCount} onChange={e => set('defaultKidCount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Code</label>
              <input type="number" min={0} value={form.defaultCodeCount} onChange={e => set('defaultCodeCount', +e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Custom Diet Count</label>
            <input
              type="number"
              min={0}
              value={form.defaultCustomDietCount}
              onChange={e => { set('defaultCustomDietCount', +e.target.value); setDietNotesError(false) }}
            />
          </div>
          <div className="form-group">
            <label>
              Custom Diet Notes
              {form.defaultCustomDietCount > 0 && <span className="field-required"> *</span>}
            </label>
            <input
              value={form.customDietNotes}
              onChange={e => { set('customDietNotes', e.target.value); setDietNotesError(false) }}
              placeholder={form.defaultCustomDietCount > 0 ? 'Required when custom diet count is set' : 'Optional'}
              className={dietNotesError ? 'input-error' : ''}
            />
            {dietNotesError && (
              <p className="field-error">Custom diet notes are required when custom diet count is greater than 0.</p>
            )}
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={saving || checking}>
              {checking ? 'Checking...' : saving ? 'Adding...' : 'Add Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
