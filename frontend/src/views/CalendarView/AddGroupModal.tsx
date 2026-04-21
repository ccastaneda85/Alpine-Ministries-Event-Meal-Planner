import { useState } from 'react'
import type { GroupReservation } from '../../types'

interface Props {
  defaultArrival: string
  onClose: () => void
  onSubmit: (data: Omit<GroupReservation, 'groupReservationId'>) => Promise<void>
}

export default function AddGroupModal({ defaultArrival, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    groupName: '',
    arrivalDate: defaultArrival,
    departureDate: defaultArrival,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
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
            <input type="number" min={0} value={form.defaultCustomDietCount} onChange={e => set('defaultCustomDietCount', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Custom Diet Notes</label>
            <input value={form.customDietNotes} onChange={e => set('customDietNotes', e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? 'Adding...' : 'Add Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
