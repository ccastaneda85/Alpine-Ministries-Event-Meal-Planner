import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { GroupReservation, GroupMealAttendance } from '../../types'
import { api } from '../../services/api'

interface Props {
  group: GroupReservation
  date: string
  onClose: () => void
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

type CountFields = Pick<GroupMealAttendance, 'adultCount' | 'youthCount' | 'kidCount' | 'codeCount' | 'customDietCount'>

export default function EditDayAttendanceModal({ group, date, onClose }: Props) {
  const [records, setRecords] = useState<GroupMealAttendance[]>([])
  const [edits, setEdits] = useState<Record<number, CountFields>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getAttendanceByReservationAndDate(group.groupReservationId, date)
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const order = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 }
          return order[a.mealPeriod.mealPeriodType] - order[b.mealPeriod.mealPeriodType]
        })
        setRecords(sorted)
        const initial: Record<number, CountFields> = {}
        sorted.forEach(r => {
          initial[r.groupMealAttendanceId] = {
            adultCount: r.adultCount,
            youthCount: r.youthCount,
            kidCount: r.kidCount,
            codeCount: r.codeCount,
            customDietCount: r.customDietCount,
          }
        })
        setEdits(initial)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [group.groupReservationId, date])

  function handleChange(id: number, field: keyof CountFields, value: number) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const r of records) {
        await api.updateAttendance(r.groupMealAttendanceId, edits[r.groupMealAttendanceId])
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-wide">
        <div className="view-modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>{group.groupName}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Attendance — {formatDate(date)}
            </p>
          </div>
          <button type="button" className="view-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">No meals scheduled for this date.</p>
        ) : (
          <div className="table-wrapper">
            <table className="groups-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Adults</th>
                  <th>Youth</th>
                  <th>Kids</th>
                  <th>Code</th>
                  <th>Custom</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const e = edits[r.groupMealAttendanceId]
                  return (
                    <tr key={r.groupMealAttendanceId}>
                      <td>{r.mealPeriod.mealPeriodType}</td>
                      {(['adultCount', 'youthCount', 'kidCount', 'codeCount', 'customDietCount'] as const).map(field => (
                        <td key={field}>
                          <input
                            type="number"
                            min={0}
                            className="attendance-inline-input"
                            value={e?.[field] ?? 0}
                            onChange={ev => handleChange(r.groupMealAttendanceId, field, +ev.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-gold" disabled={saving || loading} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
