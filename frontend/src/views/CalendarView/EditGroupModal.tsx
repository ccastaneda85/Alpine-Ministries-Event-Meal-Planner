import { useState } from 'react'
import type { GroupReservation, ReservationImpact } from '../../types'
import { api, type ReservationRangeImpact } from '../../services/api'
import ConfirmModal from './ConfirmModal'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>

interface Props {
  group: GroupReservation
  onClose: () => void
  onSubmit: (id: number, data: UpdatePayload, resetAttendance: boolean) => Promise<void>
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function EditGroupModal({ group, onClose, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [dietNotesError, setDietNotesError] = useState(false)
  const [resetAttendance, setResetAttendance] = useState(false)
  const [shrinkImpact, setShrinkImpact] = useState<ReservationImpact | null>(null)
  const [rangeImpact, setRangeImpact] = useState<ReservationRangeImpact | null>(null)
  const [checkingImpact, setCheckingImpact] = useState(false)
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

  async function doSubmit() {
    setSaving(true)
    try {
      await onSubmit(group.groupReservationId, form, resetAttendance)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Check if any existing prep/purchase lists overlap the new range.
  // Uses the UNION of old + new range so we catch lists on removed dates too.
  async function runRangeImpactOrSubmit() {
    const start = form.arrivalDate < group.arrivalDate ? form.arrivalDate : group.arrivalDate
    const end = form.departureDate > group.departureDate ? form.departureDate : group.departureDate
    try {
      const result = await api.getReservationRangeImpact(start, end)
      if (result.prepLists.length > 0 || result.purchaseLists.length > 0) {
        setRangeImpact(result)
        return
      }
    } catch {
      // fall through and submit
    }
    await doSubmit()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.defaultCustomDietCount > 0 && !form.customDietNotes.trim()) {
      setDietNotesError(true)
      return
    }

    const listAffectingChange =
      form.arrivalDate !== group.arrivalDate ||
      form.departureDate !== group.departureDate ||
      form.defaultAdultCount !== group.defaultAdultCount ||
      form.defaultYouthCount !== group.defaultYouthCount ||
      form.defaultKidCount !== group.defaultKidCount ||
      form.defaultCodeCount !== group.defaultCodeCount ||
      form.defaultCustomDietCount !== group.defaultCustomDietCount

    if (!listAffectingChange) {
      await doSubmit()
      return
    }

    setCheckingImpact(true)
    try {
      const isShrinking = form.arrivalDate > group.arrivalDate || form.departureDate < group.departureDate
      if (isShrinking) {
        try {
          const impact = await api.getReservationShrinkImpact(
            group.groupReservationId,
            form.arrivalDate,
            form.departureDate,
          )
          if (impact.affectedDates.length > 0) {
            setShrinkImpact(impact)
            return
          }
        } catch {
          // fall through
        }
      }
      await runRangeImpactOrSubmit()
    } finally {
      setCheckingImpact(false)
    }
  }

  function buildShrinkMessage(impact: ReservationImpact) {
    const needsRegen = impact.affectedDates.some(d => d.hasMealPlan || d.hasKitchenPrepList)
    return (
      <div>
        <p>The following dates will be removed from <strong>{group.groupName}</strong>'s reservation:</p>
        <ul className="impact-date-list">
          {impact.affectedDates.map(d => (
            <li key={d.date}>
              <strong>{d.date}</strong>
              {d.isLastGroup && ' — last group, EventDay will be removed'}
              {d.hasMealPlan && <span className="impact-tag"> · MealPlan exists</span>}
              {d.hasKitchenPrepList && <span className="impact-tag"> · KitchenPrepList exists</span>}
            </li>
          ))}
        </ul>
        {needsRegen && (
          <p className="impact-regen-note">Remember to regenerate your PurchaseList and KitchenPrepList for affected dates after confirming.</p>
        )}
      </div>
    )
  }

  if (rangeImpact) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <h2 className="modal-title">Existing lists will be affected</h2>
          <p className="modal-intro">
            Saving changes to <strong>{form.groupName || 'this group'}</strong> will affect lists that have already been generated. You will need to regenerate them so quantities reflect the updated reservation.
          </p>

          {rangeImpact.prepLists.length > 0 && (
            <div className="impact-section">
              <h3 className="impact-heading">Kitchen Prep Lists</h3>
              <ul className="impact-list">
                {rangeImpact.prepLists.map(p => (
                  <li key={p.kitchenPrepListId}>{formatDate(p.date)}</li>
                ))}
              </ul>
            </div>
          )}

          {rangeImpact.purchaseLists.length > 0 && (
            <div className="impact-section">
              <h3 className="impact-heading">Purchase Lists</h3>
              <ul className="impact-list">
                {rangeImpact.purchaseLists.map(p => (
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
            <button type="button" className="btn-outline" disabled={saving} onClick={() => setRangeImpact(null)}>
              Back
            </button>
            <button type="button" className="btn-gold" disabled={saving} onClick={doSubmit}>
              {saving ? 'Saving...' : 'Save Anyway'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
            <input value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={saving || checkingImpact}>
              {checkingImpact ? 'Checking...' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {shrinkImpact && (
      <ConfirmModal
        title="Date range is being shortened"
        message={buildShrinkMessage(shrinkImpact)}
        confirmLabel={saving ? 'Saving...' : 'Continue'}
        disabled={saving}
        onConfirm={async () => { setShrinkImpact(null); await runRangeImpactOrSubmit() }}
        onCancel={() => setShrinkImpact(null)}
      />
    )}
    </>
  )
}
