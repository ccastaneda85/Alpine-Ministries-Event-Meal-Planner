import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { GroupReservation, GroupMealAttendance } from '../../types'
import { api } from '../../services/api'
import EditGroupModal from './EditGroupModal'
import ConfirmModal from './ConfirmModal'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>

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

interface OverrideState {
  adultCount: number
  youthCount: number
  kidCount: number
  codeCount: number
  customDietCount: number
}

export default function ViewGroupModal({ group, onClose, onUpdateGroup, onDeleteGroup }: Props) {
  const [currentGroup, setCurrentGroup] = useState<GroupReservation>(group)
  const [attendance, setAttendance] = useState<GroupMealAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [overrideId, setOverrideId] = useState<number | null>(null)
  const [overrideForm, setOverrideForm] = useState<OverrideState | null>(null)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function loadAttendance() {
    setLoading(true)
    api.getAttendanceByReservation(currentGroup.groupReservationId)
      .then(records => {
        const sorted = [...records].sort((a, b) => {
          const dateCompare = a.mealPeriod.eventDay.date.localeCompare(b.mealPeriod.eventDay.date)
          if (dateCompare !== 0) return dateCompare
          const order = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 }
          return order[a.mealPeriod.mealPeriodType] - order[b.mealPeriod.mealPeriodType]
        })
        setAttendance(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAttendance() }, [currentGroup.groupReservationId])

  async function handleEditSave(id: number, data: UpdatePayload, resetAttendance?: boolean) {
    await onUpdateGroup(id, data, resetAttendance)
    setCurrentGroup({ ...currentGroup, ...data })
    loadAttendance()
  }

  function startOverride(record: GroupMealAttendance) {
    setOverrideId(record.groupMealAttendanceId)
    setOverrideForm({
      adultCount: record.adultCount,
      youthCount: record.youthCount,
      kidCount: record.kidCount,
      codeCount: record.codeCount,
      customDietCount: record.customDietCount,
    })
  }

  function cancelOverride() {
    setOverrideId(null)
    setOverrideForm(null)
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

  async function saveOverride(id: number) {
    if (!overrideForm) return
    setSaving(true)
    try {
      const updated = await api.updateAttendance(id, overrideForm)
      setAttendance(prev => prev.map(r => r.groupMealAttendanceId === id ? updated : r))
      cancelOverride()
    } finally {
      setSaving(false)
    }
  }

  const total = currentGroup.defaultAdultCount + currentGroup.defaultYouthCount + currentGroup.defaultKidCount + currentGroup.defaultCodeCount

  return (
    <>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-wide">
        <div className="view-modal-header">
          <h2 className="modal-title" style={{ margin: 0 }}>{currentGroup.groupName}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" className="btn-gold" onClick={() => setShowEdit(true)}>Edit</button>
            <button type="button" className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
            <button type="button" className="view-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div className="group-summary-card">
          <p><strong>Arrival:</strong> {formatDate(currentGroup.arrivalDate)}</p>
          <p><strong>Departure:</strong> {formatDate(currentGroup.departureDate)}</p>
          <p><strong>Default Counts:</strong> {currentGroup.defaultAdultCount} Adults, {currentGroup.defaultYouthCount} Youth, {currentGroup.defaultKidCount} Kids, {currentGroup.defaultCodeCount} Code, {currentGroup.defaultCustomDietCount} Custom Diet &mdash; <strong>Total: {total}</strong></p>
          {currentGroup.customDietNotes && <p><strong>Custom Diet Notes:</strong> {currentGroup.customDietNotes}</p>}
          {currentGroup.notes && <p><strong>Notes:</strong> {currentGroup.notes}</p>}
        </div>

        {/* Attendance table */}
        <h3 className="attendance-section-title">Meal Attendance by Day</h3>
        <p className="attendance-hint">Click Override on any row to adjust headcounts for that specific meal.</p>

        {loading ? (
          <p className="empty-state">Loading attendance records...</p>
        ) : attendance.length === 0 ? (
          <p className="empty-state">No attendance records found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="groups-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Adults</th>
                  <th>Youth</th>
                  <th>Kids</th>
                  <th>Code</th>
                  <th>Custom</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, i) => {
                  const isEditing = overrideId === record.groupMealAttendanceId
                  const isNewDay = i === 0 || record.mealPeriod.eventDay.date !== attendance[i - 1].mealPeriod.eventDay.date
                  return (
                    <tr key={record.groupMealAttendanceId} className={isNewDay && i > 0 ? 'day-group-start' : ''}>
                      <td>{isNewDay ? formatDate(record.mealPeriod.eventDay.date) : ''}</td>
                      <td>{record.mealPeriod.mealPeriodType}</td>
                      {isEditing && overrideForm ? (
                        <>
                          {(['adultCount', 'youthCount', 'kidCount', 'codeCount', 'customDietCount'] as const).map(field => (
                            <td key={field}>
                              <input
                                type="number"
                                min={0}
                                className="attendance-inline-input"
                                value={overrideForm[field]}
                                onChange={e => setOverrideForm(f => f ? { ...f, [field]: +e.target.value } : f)}
                              />
                            </td>
                          ))}
                          <td>
                            <div className="action-btns">
                              <button type="button" className="btn-gold" disabled={saving} onClick={() => saveOverride(record.groupMealAttendanceId)}>
                                {saving ? '...' : 'Save'}
                              </button>
                              <button type="button" className="btn-outline" onClick={cancelOverride}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{record.adultCount}</td>
                          <td>{record.youthCount}</td>
                          <td>{record.kidCount}</td>
                          <td>{record.codeCount}</td>
                          <td>{record.customDietCount}</td>
                          <td>
                            <button type="button" className="btn-outline btn-sm" onClick={() => startOverride(record)}>
                              Override
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
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

    {showDeleteConfirm && (
      <ConfirmModal
        title="Delete group reservation?"
        message={`This will permanently delete "${currentGroup.groupName}" and all associated meal attendance records. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        disabled={deleting}
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
    </>
  )
}
