import { useState, useEffect } from 'react'
import { Eye, Pencil, RotateCcw } from 'lucide-react'
import type { GroupReservation, GroupMealAttendance } from '../../types'
import EditGroupModal from './EditGroupModal'
import ViewGroupModal from './ViewGroupModal'
import EditDayAttendanceModal from './EditDayAttendanceModal'
import ConfirmModal from './ConfirmModal'
import { api } from '../../services/api'

type UpdatePayload = Omit<GroupReservation, 'groupReservationId'>
type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER'

interface Props {
  groups: GroupReservation[]
  selectedDate: string
  onUpdateGroup: (id: number, data: UpdatePayload, resetAttendance?: boolean) => Promise<void>
  onDeleteGroup: (id: number) => Promise<void>
  onRefresh: () => void
}

const MEAL_LABELS: { type: MealType; label: string }[] = [
  { type: 'BREAKFAST', label: 'Breakfast' },
  { type: 'LUNCH', label: 'Lunch' },
  { type: 'DINNER', label: 'Dinner' },
]

const COUNT_FIELDS = ['adultCount', 'youthCount', 'kidCount', 'codeCount', 'customDietCount'] as const
const COUNT_LABELS = ['Adults', 'Youth', 'Kids', 'Code', 'Custom']

function getRecord(attendance: GroupMealAttendance[], type: MealType) {
  return attendance.find(r => r.mealPeriod.mealPeriodType === type) ?? null
}

export default function GroupsTab({ groups, selectedDate, onUpdateGroup, onDeleteGroup, onRefresh }: Props) {
  const [viewTarget, setViewTarget] = useState<GroupReservation | null>(null)
  const [editTarget, setEditTarget] = useState<GroupReservation | null>(null)
  const [dayEditTarget, setDayEditTarget] = useState<GroupReservation | null>(null)
  const [zeroTarget, setZeroTarget] = useState<GroupReservation | null>(null)
  const [zeroing, setZeroing] = useState(false)
  const [attendanceMap, setAttendanceMap] = useState<Record<number, GroupMealAttendance[]>>({})

  useEffect(() => {
    if (groups.length === 0) { setAttendanceMap({}); return }
    Promise.all(
      groups.map(g =>
        api.getAttendanceByReservationAndDate(g.groupReservationId, selectedDate)
          .then(records => ({ id: g.groupReservationId, records }))
          .catch(() => ({ id: g.groupReservationId, records: [] as GroupMealAttendance[] }))
      )
    ).then(results => {
      const map: Record<number, GroupMealAttendance[]> = {}
      results.forEach(({ id, records }) => { map[id] = records })
      setAttendanceMap(map)
    })
  }, [groups, selectedDate])

  async function handleZeroDay() {
    if (!zeroTarget) return
    setZeroing(true)
    const zeros = { adultCount: 0, youthCount: 0, kidCount: 0, codeCount: 0, customDietCount: 0 }
    const targetId = zeroTarget.groupReservationId
    try {
      const records = await api.getAttendanceByReservationAndDate(targetId, selectedDate)
      for (const r of records) {
        await api.updateAttendance(r.groupMealAttendanceId, zeros)
      }
      // Optimistically update display immediately
      setAttendanceMap(prev => ({
        ...prev,
        [targetId]: (prev[targetId] ?? []).map(r => ({ ...r, ...zeros })),
      }))
      setZeroTarget(null)
      onRefresh()
    } catch (err) {
      console.error('[ZeroDay] Failed:', err)
    } finally {
      setZeroing(false)
    }
  }

  if (groups.length === 0) {
    return <p className="empty-state">No groups scheduled for this date.</p>
  }

  return (
    <>
      <p className="groups-title">Groups ({groups.length})</p>
      <div className="table-wrapper">
        <table className="groups-table attendance-inline-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-group-name">Group</th>
              {MEAL_LABELS.map(({ type, label }) => (
                <th key={type} colSpan={5} className="meal-period-header">{label}</th>
              ))}
              <th rowSpan={2} className="col-actions">Actions</th>
            </tr>
            <tr>
              {MEAL_LABELS.map(({ type }, mi) =>
                COUNT_LABELS.map((lbl, li) => {
                  const isLast = mi === MEAL_LABELS.length - 1 && li === COUNT_LABELS.length - 1
                  return <th key={`${type}-${lbl}`} className={`count-subheader${li === 0 ? ' group-first' : ''}${isLast ? ' dinner-last' : ''}`}>{lbl}</th>
                })
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const attendance = attendanceMap[g.groupReservationId] ?? []
              return (
                <tr key={g.groupReservationId}>
                  <td className="col-group-name">{g.groupName}</td>
                  {MEAL_LABELS.map(({ type }, mi) => {
                    const record = getRecord(attendance, type)
                    return COUNT_FIELDS.map((field, fi) => {
                      const isLast = mi === MEAL_LABELS.length - 1 && fi === COUNT_FIELDS.length - 1
                      return (
                        <td key={`${type}-${field}`} className={`count-cell${fi === 0 ? ' group-first' : ''}${isLast ? ' dinner-last' : ''}`}>
                          {record ? record[field] : <span className="no-data">—</span>}
                        </td>
                      )
                    })
                  })}
                  <td className="col-actions">
                    <div className="action-btns">
                      <div className="action-btn-tooltip-wrapper">
                        <button
                          type="button"
                          className="action-btn action-btn-view"
                          onClick={() => setViewTarget(g)}
                        >
                          <Eye size={14} />
                        </button>
                        <span className="action-btn-tooltip">View full group record</span>
                      </div>
                      <div className="action-btn-tooltip-wrapper">
                        <button
                          type="button"
                          className="action-btn action-btn-edit"
                          onClick={() => setDayEditTarget(g)}
                        >
                          <Pencil size={14} />
                        </button>
                        <span className="action-btn-tooltip">Edit attendance for this day</span>
                      </div>
                      <div className="action-btn-tooltip-wrapper">
                        <button
                          type="button"
                          className="action-btn action-btn-delete"
                          onClick={() => setZeroTarget(g)}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <span className="action-btn-tooltip">Zero out attendance for this day</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
            <tr className="totals-row">
              <td className="col-group-name">Totals</td>
              {MEAL_LABELS.map(({ type }, mi) =>
                COUNT_FIELDS.map((field, fi) => {
                  const sum = groups.reduce((acc, g) => {
                    const record = getRecord(attendanceMap[g.groupReservationId] ?? [], type)
                    return acc + (record ? record[field] : 0)
                  }, 0)
                  const isLast = mi === MEAL_LABELS.length - 1 && fi === COUNT_FIELDS.length - 1
                  return <td key={`total-${type}-${field}`} className={`count-cell${fi === 0 ? ' group-first' : ''}${isLast ? ' dinner-last group-last' : ''}`}>{sum || '—'}</td>
                })
              )}
              <td className="col-actions" />
            </tr>
          </tbody>
        </table>
      </div>

      {viewTarget && (
        <ViewGroupModal
          group={viewTarget}
          onClose={() => setViewTarget(null)}
          onUpdateGroup={onUpdateGroup}
          onDeleteGroup={onDeleteGroup}
        />
      )}

      {editTarget && (
        <EditGroupModal
          group={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={onUpdateGroup}
        />
      )}

      {dayEditTarget && (
        <EditDayAttendanceModal
          group={dayEditTarget}
          date={selectedDate}
          onClose={() => { setDayEditTarget(null); onRefresh() }}
        />
      )}

      {zeroTarget && (
        <ConfirmModal
          title="Zero out attendance for this day?"
          message={`This will set all headcounts for "${zeroTarget.groupName}" to 0 for every meal on ${selectedDate}. The records will remain and can be edited.`}
          confirmLabel={zeroing ? 'Zeroing...' : 'Zero Out'}
          disabled={zeroing}
          onConfirm={handleZeroDay}
          onCancel={() => setZeroTarget(null)}
        />
      )}
    </>
  )
}
