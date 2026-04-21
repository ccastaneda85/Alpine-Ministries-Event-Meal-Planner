import { useState } from 'react'
import type { GroupReservation } from '../../types'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>

interface Props {
  group: GroupReservation
  onClose: () => void
  onSubmit: (id: number, data: UpdatePayload, resetAttendance: boolean) => Promise<void>
}

export default function EditGroupModal({ group, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [resetAttendance, setResetAttendance] = useState(false)
  const [form, setForm] = useState<UpdatePayload>({
    groupName: group.groupName,
    arrivalDate: group.arrivalDate,
    departureDate: group.departureDate,
    defaultAdultCount: group.defaultAdultCount,
    defaultYouthCount: group.defaultYouthCount,
    defaultKidCount: group.defaultKidCount,
    defaultCodeCount: group.defaultCodeCount,
    defaultCustomDietCount: group.defaultCustomDietCount,
    customDietNotes: group.customDietNotes ?? '',
    notes: group.notes ?? '',
  })

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(group.groupReservationId, form, resetAttendance)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Edit Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="edit-warning">
            <strong>Heads up:</strong> Changing headcounts will <em>not</em> automatically update existing meal attendance records. Use the checkbox below to reset all records, or use <strong>Override</strong> in the group view for per-meal adjustments.
          </div>
          <div className="form-group form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={resetAttendance}
                onChange={e => setResetAttendance(e.target.checked)}
              />
              Reset all meal attendance to new default counts
            </label>
            <p className="checkbox-hint">When checked, all existing per-day headcounts will be overwritten with the new defaults below. Leave unchecked to preserve any manual overrides.</p>
          </div>

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
            <input value={form.customDietNotes} onChange={e => set('customDietNotes', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
