import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronDown } from 'lucide-react'
import type { GroupReservation, GroupMealAttendance, ReservationImpact } from '../../types'
import { api } from '../../services/api'
import EditGroupModal from './EditGroupModal'
import ConfirmModal from './ConfirmModal'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>
type CountForm = {
  adultCount: number
  youthCount: number
  kidCount: number
  codeCount: number
  customDietCount: number
}

const COUNT_FIELDS: (keyof CountForm)[] = ['adultCount', 'youthCount', 'kidCount', 'codeCount', 'customDietCount']
const COUNT_LABELS = ['Adults', 'Youth', 'Kids', 'Code', 'Custom']
const PERIOD_ORDER: Record<string, number> = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 }

interface Props {
  group: GroupReservation
  onClose: () => void
  onUpdateGroup: (id: number, data: UpdatePayload, resetAttendance?: boolean) => Promise<void>
  onDeleteGroup: (id: number) => Promise<void>
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function areSynced(records: GroupMealAttendance[]) {
  if (records.length <= 1) return true
  const first = records[0]
  return records.every(r =>
    r.adultCount === first.adultCount &&
    r.youthCount === first.youthCount &&
    r.kidCount === first.kidCount &&
    r.codeCount === first.codeCount &&
    r.customDietCount === first.customDietCount
  )
}

export default function ViewGroupModal({ group, onClose, onUpdateGroup, onDeleteGroup }: Props) {
  const [currentGroup, setCurrentGroup] = useState<GroupReservation>(group)
  const [attendance, setAttendance] = useState<GroupMealAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  // Day-level edit
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [dayEditDate, setDayEditDate] = useState<string | null>(null)
  const [dayEditForm, setDayEditForm] = useState<CountForm | null>(null)
  const [savingDay, setSavingDay] = useState(false)

  // Period-level override
  const [periodOverrideId, setPeriodOverrideId] = useState<number | null>(null)
  const [periodOverrideForm, setPeriodOverrideForm] = useState<CountForm | null>(null)
  const [savingPeriod, setSavingPeriod] = useState(false)

  const [dietWarning, setDietWarning] = useState(false)

  // Delete
  const [deleteImpact, setDeleteImpact] = useState<ReservationImpact | null>(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function loadAttendance() {
    setLoading(true)
    api.getAttendanceByReservation(currentGroup.groupReservationId)
      .then(records => setAttendance(records))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAttendance() }, [currentGroup.groupReservationId])

  // Group by date, sorted
  const byDate: Record<string, GroupMealAttendance[]> = {}
  for (const r of attendance) {
    const date = r.mealPeriod.eventDay.date
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(r)
  }
  for (const date in byDate) {
    byDate[date].sort((a, b) =>
      (PERIOD_ORDER[a.mealPeriod.mealPeriodType] ?? 99) - (PERIOD_ORDER[b.mealPeriod.mealPeriodType] ?? 99)
    )
  }
  const sortedDates = Object.keys(byDate).sort()

  function toggleExpand(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  function startDayEdit(date: string) {
    const records = byDate[date]
    if (!records?.length) return
    const r = records[0]
    setDayEditDate(date)
    setDayEditForm({
      adultCount: r.adultCount,
      youthCount: r.youthCount,
      kidCount: r.kidCount,
      codeCount: r.codeCount,
      customDietCount: r.customDietCount,
    })
    setExpandedDates(prev => new Set(prev).add(date))
  }

  async function handleSaveDayEdit(date: string) {
    if (!dayEditForm) return
    if (dayEditForm.customDietCount > 0 && !currentGroup.customDietNotes?.trim()) {
      setDietWarning(true)
      return
    }
    setDietWarning(false)
    setSavingDay(true)
    try {
      const records = byDate[date]
      for (const record of records) {
        await api.updateAttendance(record.groupMealAttendanceId, dayEditForm)
      }
      setAttendance(prev =>
        prev.map(r =>
          r.mealPeriod.eventDay.date === date ? { ...r, ...dayEditForm } : r
        )
      )
      setDayEditDate(null)
      setDayEditForm(null)
    } finally {
      setSavingDay(false)
    }
  }

  function startPeriodOverride(record: GroupMealAttendance) {
    setPeriodOverrideId(record.groupMealAttendanceId)
    setPeriodOverrideForm({
      adultCount: record.adultCount,
      youthCount: record.youthCount,
      kidCount: record.kidCount,
      codeCount: record.codeCount,
      customDietCount: record.customDietCount,
    })
  }

  async function handleSavePeriodOverride(id: number) {
    if (!periodOverrideForm) return
    if (periodOverrideForm.customDietCount > 0 && !currentGroup.customDietNotes?.trim()) {
      setDietWarning(true)
      return
    }
    setDietWarning(false)
    setSavingPeriod(true)
    try {
      const updated = await api.updateAttendance(id, periodOverrideForm)
      setAttendance(prev => prev.map(r => r.groupMealAttendanceId === id ? updated : r))
      setPeriodOverrideId(null)
      setPeriodOverrideForm(null)
    } finally {
      setSavingPeriod(false)
    }
  }

  async function handleEditSave(id: number, data: UpdatePayload, resetAttendance?: boolean) {
    await onUpdateGroup(id, data, resetAttendance)
    setCurrentGroup({ ...currentGroup, ...data })
    loadAttendance()
  }

  async function openDeleteConfirm() {
    setImpactLoading(true)
    try {
      const impact = await api.getReservationDeletionImpact(currentGroup.groupReservationId)
      setDeleteImpact(impact)
    } catch {
      setDeleteImpact({ affectedDates: [] })
    } finally {
      setImpactLoading(false)
    }
  }

  async function handleDeleteGroup() {
    setDeleting(true)
    try {
      await onDeleteGroup(currentGroup.groupReservationId)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  function buildDeleteMessage(impact: ReservationImpact) {
    const warned = impact.affectedDates.filter(d => d.isLastGroup || d.hasMealPlan || d.hasKitchenPrepList)
    const needsRegen = impact.affectedDates.some(d => d.hasMealPlan || d.hasKitchenPrepList)
    return (
      <div>
        <p>Permanently delete <strong>{currentGroup.groupName}</strong> and all meal attendance records?</p>
        {warned.length > 0 && (
          <>
            <p className="impact-warning-header">Affected dates:</p>
            <ul className="impact-date-list">
              {warned.map(d => (
                <li key={d.date}>
                  <strong>{formatDate(d.date)}</strong>
                  {d.isLastGroup && ' — last group, EventDay will be removed'}
                  {d.hasMealPlan && <span className="impact-tag"> · MealPlan exists</span>}
                  {d.hasKitchenPrepList && <span className="impact-tag"> · KitchenPrepList exists</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {needsRegen && (
          <p className="impact-regen-note">Remember to regenerate your PurchaseList and KitchenPrepList for affected dates after confirming.</p>
        )}
      </div>
    )
  }

  const total = currentGroup.defaultAdultCount + currentGroup.defaultYouthCount +
    currentGroup.defaultKidCount + currentGroup.defaultCodeCount

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box modal-box-wide">
          <div className="view-modal-header">
            <h2 className="modal-title" style={{ margin: 0 }}>{currentGroup.groupName}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="button" className="btn-gold" onClick={() => setShowEdit(true)}>Edit</button>
              <button type="button" className="btn-danger" disabled={impactLoading} onClick={openDeleteConfirm}>
                {impactLoading ? 'Loading...' : 'Delete'}
              </button>
              <button type="button" className="view-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="group-summary-card">
            <p><strong>Arrival:</strong> {formatDate(currentGroup.arrivalDate)}</p>
            <p><strong>Departure:</strong> {formatDate(currentGroup.departureDate)}</p>
            <p><strong>Default Counts:</strong> {currentGroup.defaultAdultCount} Adults, {currentGroup.defaultYouthCount} Youth, {currentGroup.defaultKidCount} Kids, {currentGroup.defaultCodeCount} Code, {currentGroup.defaultCustomDietCount} Custom &mdash; <strong>Total: {total}</strong></p>
            <p>
              <strong>Custom Diet Notes:</strong>{' '}
              {currentGroup.customDietNotes?.trim()
                ? currentGroup.customDietNotes
                : <span className="summary-empty">None</span>}
            </p>
            <p>
              <strong>Notes:</strong>{' '}
              {currentGroup.notes?.trim()
                ? currentGroup.notes
                : <span className="summary-empty">None</span>}
            </p>
          </div>

          <h3 className="attendance-section-title">Attendance by Day</h3>
          <p className="attendance-hint">
            Edit a day to update all its meal periods at once. Expand a day to override individual meal periods.
          </p>

          {currentGroup.defaultCustomDietCount > 0 && !currentGroup.customDietNotes?.trim() && (
            <div className="diet-notes-warning">
              <strong>Custom diet notes missing.</strong> This group has {currentGroup.defaultCustomDietCount} custom diet guest{currentGroup.defaultCustomDietCount !== 1 ? 's' : ''} but no diet notes. Click <strong>Edit</strong> to add notes before saving custom diet counts.
            </div>
          )}
          {dietWarning && (
            <div className="diet-notes-warning">
              <strong>Cannot save.</strong> Custom diet count is greater than 0 but this group has no custom diet notes. Click <strong>Edit</strong> to add notes first.
            </div>
          )}

          {loading ? (
            <p className="empty-state">Loading attendance records...</p>
          ) : sortedDates.length === 0 ? (
            <p className="empty-state">No attendance records found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="groups-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}></th>
                    <th>Date / Meal</th>
                    {COUNT_LABELS.map(l => <th key={l}>{l}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map(date => {
                    const records = byDate[date]
                    const synced = areSynced(records)
                    const rep = records[0]
                    const isExpanded = expandedDates.has(date)
                    const isDayEditing = dayEditDate === date

                    return (
                      <>
                        {/* Day row */}
                        <tr key={`day-${date}`} className="attendance-day-row">
                          <td>
                            <button
                              type="button"
                              className="expand-btn"
                              onClick={() => toggleExpand(date)}
                              title={isExpanded ? 'Collapse' : 'Expand meal periods'}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td className="attendance-day-label">
                            {formatDate(date)}
                            {!synced && <span className="attendance-mixed-badge">mixed</span>}
                          </td>
                          {isDayEditing && dayEditForm ? (
                            <>
                              {COUNT_FIELDS.map(f => (
                                <td key={f} className="attendance-num-col">
                                  <input
                                    type="number"
                                    min={0}
                                    className="attendance-inline-input"
                                    value={dayEditForm[f]}
                                    onChange={e => setDayEditForm(prev => prev ? { ...prev, [f]: +e.target.value } : prev)}
                                  />
                                </td>
                              ))}
                              <td>
                                <div className="action-btns">
                                  <button type="button" className="btn-gold btn-sm" disabled={savingDay} onClick={() => handleSaveDayEdit(date)}>
                                    {savingDay ? '...' : 'Save'}
                                  </button>
                                  <button type="button" className="btn-outline btn-sm" onClick={() => { setDayEditDate(null); setDayEditForm(null) }}>
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              {COUNT_FIELDS.map(f => (
                                <td key={f} className="attendance-num-col">{rep[f]}</td>
                              ))}
                              <td>
                                <button type="button" className="btn-outline btn-sm" onClick={() => startDayEdit(date)}>
                                  Edit Day
                                </button>
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Meal period rows (expanded) */}
                        {isExpanded && records.map(record => {
                          const isOverriding = periodOverrideId === record.groupMealAttendanceId
                          return (
                            <tr key={record.groupMealAttendanceId} className="attendance-period-row">
                              <td></td>
                              <td className="attendance-period-label">
                                {record.mealPeriod.mealPeriodType.charAt(0) + record.mealPeriod.mealPeriodType.slice(1).toLowerCase()}
                              </td>
                              {isOverriding && periodOverrideForm ? (
                                <>
                                  {COUNT_FIELDS.map(f => (
                                    <td key={f} className="attendance-num-col">
                                      <input
                                        type="number"
                                        min={0}
                                        className="attendance-inline-input"
                                        value={periodOverrideForm[f]}
                                        onChange={e => setPeriodOverrideForm(prev => prev ? { ...prev, [f]: +e.target.value } : prev)}
                                      />
                                    </td>
                                  ))}
                                  <td>
                                    <div className="action-btns">
                                      <button type="button" className="btn-gold btn-sm" disabled={savingPeriod} onClick={() => handleSavePeriodOverride(record.groupMealAttendanceId)}>
                                        {savingPeriod ? '...' : 'Save'}
                                      </button>
                                      <button type="button" className="btn-outline btn-sm" onClick={() => { setPeriodOverrideId(null); setPeriodOverrideForm(null) }}>
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  {COUNT_FIELDS.map(f => (
                                    <td key={f} className="attendance-num-col">{record[f]}</td>
                                  ))}
                                  <td>
                                    <button type="button" className="btn-outline btn-sm" onClick={() => startPeriodOverride(record)}>
                                      Override
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditGroupModal
          group={currentGroup}
          onClose={() => setShowEdit(false)}
          onSubmit={handleEditSave}
        />
      )}

      {deleteImpact && (
        <ConfirmModal
          title="Delete group reservation?"
          message={buildDeleteMessage(deleteImpact)}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          disabled={deleting}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteImpact(null)}
        />
      )}
    </>
  )
}
