import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Calendar, X } from 'lucide-react'
import type { MealPlan, MealPlanDetail, GroupReservation } from '../types'
import { api } from '../services/api'
import { useBreadcrumb } from '../components/layout/BreadcrumbContext'
import PurchasingListFormModal from './PurchasingView/PurchasingListFormModal'
import PurchasingListDetailPane from './PurchasingView/PurchasingListDetailPane'
import ViewGroupModal from './CalendarView/ViewGroupModal'

function extractApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/^\d+:\s*(.*)$/s)
  return match ? match[1] : raw
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const a = Date.UTC(ys, ms - 1, ds)
  const b = Date.UTC(ye, me - 1, de)
  return Math.floor((b - a) / 86_400_000) + 1
}

const STORAGE_KEY_SELECTED_PLAN = 'purchasing:selectedMealPlanId'

function readStoredSelectedId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY_SELECTED_PLAN)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function PurchasingView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(() => readStoredSelectedId())
  const [detail, setDetail] = useState<MealPlanDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [viewingGroup, setViewingGroup] = useState<GroupReservation | null>(null)

  useBreadcrumb(['Purchasing', selectedId !== null ? detail?.name : null])

  // Deep-link: honor ?mealPlanId= on first load, then strip it so it doesn't override user clicks.
  useEffect(() => {
    const param = searchParams.get('mealPlanId')
    if (!param) return
    const id = Number(param)
    if (!Number.isNaN(id)) setSelectedId(id)
    const next = new URLSearchParams(searchParams)
    next.delete('mealPlanId')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist the selected plan so returning to this view restores it.
  useEffect(() => {
    if (selectedId === null) {
      localStorage.removeItem(STORAGE_KEY_SELECTED_PLAN)
    } else {
      localStorage.setItem(STORAGE_KEY_SELECTED_PLAN, String(selectedId))
    }
  }, [selectedId])

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    api.getMealPlanDetail(selectedId)
      .then(d => { if (!cancelled) setDetail(d) })
      .catch(err => {
        if (cancelled) return
        // Stored id points at a plan that no longer exists — clear it so we don't keep erroring on future visits.
        setErrorMessage(extractApiErrorMessage(err))
        setSelectedId(null)
      })
      .finally(() => { if (!cancelled) setLoadingDetail(false) })
    return () => { cancelled = true }
  }, [selectedId])

  function toggleSelected(id: number) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  function refreshDetail() {
    if (selectedId === null) return
    api.getMealPlanDetail(selectedId).then(setDetail).catch(() => {})
  }

  function handleViewDay(_eventDayId: number, date: string) {
    navigate(`/calendar?date=${date}`)
  }

  async function handleViewGroup(groupReservationId: number) {
    try {
      const group = await api.getReservation(groupReservationId)
      setViewingGroup(group)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
    }
  }

  async function handleUpdateGroup(id: number, data: Omit<GroupReservation, 'groupReservationId'>, resetAttendance?: boolean) {
    await api.updateReservation(id, data, resetAttendance)
    // Refresh the group details still showing in modal + the purchasing detail pane.
    const refreshed = await api.getReservation(id)
    setViewingGroup(refreshed)
    refreshDetail()
  }

  async function handleDeleteGroup(id: number) {
    await api.deleteReservation(id)
    setViewingGroup(null)
    refreshDetail()
  }

  useEffect(() => {
    if (!errorMessage) return
    const t = setTimeout(() => setErrorMessage(null), 8000)
    return () => clearTimeout(t)
  }, [errorMessage])

  async function loadPlans() {
    setLoading(true)
    try {
      const data = await api.getAllMealPlans()
      setPlans(data)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [plans]
  )

  function handleOpenCreate() {
    setEditingPlan(null)
    setShowFormModal(true)
  }

  function handleOpenEdit(plan: MealPlan) {
    setEditingPlan(plan)
    setShowFormModal(true)
  }

  function handleFormSaved(saved: MealPlan) {
    const wasEditing = editingPlan !== null
    setShowFormModal(false)
    setEditingPlan(null)
    loadPlans()
    if (wasEditing) {
      // If the edited plan is currently open in the detail pane, refresh it.
      if (selectedId !== null) {
        api.getMealPlanDetail(selectedId).then(setDetail).catch(() => {})
      }
    } else {
      // Newly created — open it in the detail pane.
      setSelectedId(saved.mealPlanId)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await api.deleteMealPlan(id)
      setPlans(prev => prev.filter(p => p.mealPlanId !== id))
      setConfirmDeleteId(null)
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="purchasing-view">
      <div className="purchasing-panel">
        <div className="purchasing-header">
          <div>
            <h1 className="purchasing-title">Purchasing List</h1>
            <p className="purchasing-subtitle">Create and manage purchasing lists for upcoming events.</p>
          </div>
          <button type="button" className="btn-gold" onClick={handleOpenCreate}>
            <Plus size={16} /> Purchasing List
          </button>
        </div>

        {errorMessage && (
          <div className="catalog-error-banner" role="alert">
            <span className="catalog-error-banner-text">{errorMessage}</span>
            <button
              type="button"
              className="catalog-error-banner-close"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <p className="empty-state">Loading purchasing lists...</p>
        ) : sortedPlans.length === 0 ? (
          <p className="empty-state">No purchasing lists yet. Create one to get started.</p>
        ) : (
          <div className="purchasing-table-wrapper">
            <table className="purchasing-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="col-days">Days</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map(plan => {
                  const isSelected = selectedId === plan.mealPlanId
                  const rowClasses = [
                    confirmDeleteId === plan.mealPlanId ? 'row--danger' : '',
                    isSelected ? 'row--selected' : '',
                  ].filter(Boolean).join(' ') || undefined
                  return (
                    <tr
                      key={plan.mealPlanId}
                      className={rowClasses}
                      onClick={() => confirmDeleteId !== plan.mealPlanId && toggleSelected(plan.mealPlanId)}
                      style={{ cursor: confirmDeleteId === plan.mealPlanId ? 'default' : 'pointer' }}
                    >
                      {confirmDeleteId === plan.mealPlanId ? (
                        <td colSpan={5} className="confirm-delete-cell" onClick={e => e.stopPropagation()}>
                          <span className="catalog-confirm-text">Delete "{plan.name}"?</span>
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            disabled={deletingId === plan.mealPlanId}
                            onClick={() => handleDelete(plan.mealPlanId)}
                          >
                            {deletingId === plan.mealPlanId ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            type="button"
                            className="btn-outline btn-sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </td>
                      ) : (
                        <>
                          <td className="col-name">{plan.name}</td>
                          <td><span className="date-cell"><Calendar size={13} /> {formatDate(plan.startDate)}</span></td>
                          <td><span className="date-cell"><Calendar size={13} /> {formatDate(plan.endDate)}</span></td>
                          <td className="col-days">{daysBetween(plan.startDate, plan.endDate)}</td>
                          <td className="col-actions" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`action-btn${isSelected ? ' action-btn--active' : ''}`}
                              title={isSelected ? 'Hide details' : 'Show details'}
                              onClick={() => toggleSelected(plan.mealPlanId)}
                            >
                              <Eye size={14} />
                            </button>
                            <button type="button" className="action-btn" title="Edit" onClick={() => handleOpenEdit(plan)}>
                              <Pencil size={14} />
                            </button>
                            <button type="button" className="action-btn action-btn--danger" title="Delete" onClick={() => setConfirmDeleteId(plan.mealPlanId)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="purchasing-footer-count">Showing {sortedPlans.length} of {sortedPlans.length} purchasing list{sortedPlans.length === 1 ? '' : 's'}</p>
          </div>
        )}
      </div>

      {selectedId !== null && (
        <div className="purchasing-panel purchasing-detail-panel">
          <div className="purchasing-detail-header">
            <div>
              <h2 className="purchasing-detail-title">
                {detail ? detail.name : 'Loading…'}
              </h2>
              {detail && (
                <p className="purchasing-detail-subtitle">
                  {formatDate(detail.startDate)} – {formatDate(detail.endDate)} · {daysBetween(detail.startDate, detail.endDate)} day{daysBetween(detail.startDate, detail.endDate) === 1 ? '' : 's'}
                </p>
              )}
            </div>
            <button
              type="button"
              className="action-btn"
              title="Close details"
              onClick={() => setSelectedId(null)}
            >
              <X size={14} />
            </button>
          </div>

          {loadingDetail && !detail ? (
            <p className="empty-state">Loading details...</p>
          ) : detail ? (
            <PurchasingListDetailPane
              detail={detail}
              loading={loadingDetail}
              onViewDay={handleViewDay}
              onViewGroup={handleViewGroup}
            />
          ) : null}
        </div>
      )}

      {showFormModal && (
        <PurchasingListFormModal
          editing={editingPlan}
          onClose={() => { setShowFormModal(false); setEditingPlan(null) }}
          onSaved={handleFormSaved}
        />
      )}

      {viewingGroup && (
        <ViewGroupModal
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
    </div>
  )
}
