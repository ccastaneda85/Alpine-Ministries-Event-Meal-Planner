import { useState, useEffect, useCallback } from 'react'
import { Zap, XCircle, Plus, Trash2 } from 'lucide-react'
import type { MealPlanDetail, PurchaseList, PurchaseListItem } from '../../types'
import { api } from '../../services/api'
import AddCustomItemModal from './AddCustomItemModal'
import AddFromCatalogModal from './AddFromCatalogModal'

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function extractApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/^\d+:\s*(.*)$/s)
  return match ? match[1] : raw
}

interface Props {
  detail: MealPlanDetail
  loading?: boolean
  onViewDay?: (eventDayId: number, date: string) => void
  onViewGroup?: (groupReservationId: number) => void
}

export default function PurchasingListDetailPane({ detail, loading, onViewDay, onViewGroup }: Props) {
  const [groupsOpen, setGroupsOpen] = useState(true)
  const [menusOpen, setMenusOpen] = useState(true)

  // Purchase list state
  const [purchaseList, setPurchaseList] = useState<PurchaseList | null>(null)
  const [items, setItems] = useState<PurchaseListItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)

  const groupsWithDiet = detail.attendingGroups.filter(
    g => g.defaultCustomDietCount > 0 && g.customDietNotes && g.customDietNotes.trim() !== ''
  )

  const loadPurchaseList = useCallback(async () => {
    setLoadingItems(true)
    try {
      const lists = await api.getPurchaseListsByMealPlan(detail.mealPlanId)
      if (lists.length === 0) {
        setPurchaseList(null)
        setItems([])
      } else {
        const first = lists[0]
        setPurchaseList(first)
        const loaded = await api.getPurchaseListItems(first.purchaseListId)
        setItems(loaded)
      }
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setLoadingItems(false)
    }
  }, [detail.mealPlanId])

  useEffect(() => {
    loadPurchaseList()
    setSelectedItemIds(new Set())
  }, [detail.mealPlanId, loadPurchaseList])

  async function handleAutoGenerate() {
    setGenerating(true)
    setItemError(null)
    try {
      await api.autoGeneratePurchaseList(detail.mealPlanId)
      await loadPurchaseList()
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function handleClearGenerated() {
    if (!purchaseList) return
    setClearing(true)
    setItemError(null)
    try {
      await api.clearGeneratedPurchaseListItems(purchaseList.purchaseListId)
      await loadPurchaseList()
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setClearing(false)
    }
  }

  async function handleAddItem(body: { itemName: string; quantity: number; uom: string; notes: string | null; ingredientId?: number | null }) {
    let targetListId = purchaseList?.purchaseListId ?? null
    if (!targetListId) {
      const created = await api.createEmptyPurchaseList(detail.mealPlanId)
      targetListId = created.purchaseListId
      setPurchaseList(created)
    }
    await api.addPurchaseListItem(targetListId, body)
    await loadPurchaseList()
    setShowAddModal(false)
    setShowCatalogModal(false)
  }

  async function handleDeleteSelected() {
    if (selectedItemIds.size === 0) return
    setItemError(null)
    try {
      // SQLite single-writer: serialize deletes.
      for (const id of selectedItemIds) {
        await api.deletePurchaseListItem(id)
      }
      setSelectedItemIds(new Set())
      await loadPurchaseList()
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    }
  }

  async function handleDeleteSingle(id: number) {
    setItemError(null)
    try {
      await api.deletePurchaseListItem(id)
      setSelectedItemIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await loadPurchaseList()
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    }
  }

  async function handleToggleChecked(id: number) {
    try {
      const updated = await api.togglePurchaseListItem(id)
      setItems(prev => prev.map(it => it.purchaseListItemId === id ? updated : it))
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    }
  }

  function toggleSelected(id: number) {
    setSelectedItemIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasItems = items.length > 0
  const hasGenerated = items.some(i => i.ingredientId != null)

  return (
    <div className={`purchasing-detail-pane${loading ? ' is-loading' : ''}`}>
      {/* Action toolbar */}
      <div className="pdp-actions">
        <button
          type="button"
          className="btn-gold btn-sm pdp-action-btn"
          disabled={generating}
          onClick={handleAutoGenerate}
        >
          <Zap size={13} />
          {generating ? 'Generating...' : 'Auto-Generate'}
        </button>
        <button
          type="button"
          className="btn-outline btn-sm pdp-action-btn"
          disabled={clearing || !hasGenerated}
          onClick={handleClearGenerated}
        >
          <XCircle size={13} />
          {clearing ? 'Clearing...' : 'Clear Generated'}
        </button>
        <button
          type="button"
          className="btn-outline btn-sm pdp-action-btn"
          onClick={() => setShowCatalogModal(true)}
        >
          <Plus size={13} /> From Catalog
        </button>
        <button
          type="button"
          className="btn-outline btn-sm pdp-action-btn"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={13} /> Custom Item
        </button>
        <button
          type="button"
          className="btn-outline btn-sm pdp-action-btn pdp-delete-selected-btn"
          disabled={selectedItemIds.size === 0}
          onClick={handleDeleteSelected}
          title="Delete selected items"
        >
          <Trash2 size={13} /> Delete
          {selectedItemIds.size > 0 && <span className="pdp-sel-count"> ({selectedItemIds.size})</span>}
        </button>
      </div>

      {itemError && (
        <p className="field-error" style={{ margin: '0 0 var(--spacing-md)' }}>{itemError}</p>
      )}

      {/* Custom Diet Notes */}
      {groupsWithDiet.length > 0 && (
        <section className="pdp-section pdp-diet-notes">
          <h3 className="pdp-subsection-title">Custom Diet Notes</h3>
          <ul>
            {groupsWithDiet.map(g => (
              <li key={g.groupReservationId}>
                <strong>{g.groupName}:</strong> {g.customDietNotes}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Groups Covered */}
      <div className="pdp-collapsible">
        <button
          type="button"
          className="pdp-collapsible-toggle"
          aria-expanded={groupsOpen}
          onClick={() => setGroupsOpen(v => !v)}
        >
          <span className={`pdp-collapsible-chevron${groupsOpen ? ' open' : ''}`}>▶</span>
          Groups Covered ({detail.attendingGroups.length})
        </button>

        {groupsOpen && (
          <div className="pdp-collapsible-body">{detail.attendingGroups.length === 0 ? (
            <p className="pdp-collapsible-empty">No groups scheduled during this date range.</p>
          ) : (
            <div className="pdp-table-wrapper">
            <table className="pdp-table">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>Arrival</th>
                  <th>Departure</th>
                  <th className="num">Adults</th>
                  <th className="num">Youth</th>
                  <th className="num">Kids</th>
                  <th className="num">Code</th>
                  <th className="num">Custom Diet</th>
                  <th className="num">Total</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.attendingGroups.map(g => {
                  const total = g.defaultAdultCount + g.defaultYouthCount + g.defaultKidCount + g.defaultCodeCount
                  const hasNotes = g.customDietNotes && g.customDietNotes.trim() !== ''
                  return (
                    <tr key={g.groupReservationId}>
                      <td>{g.groupName}</td>
                      <td>{formatDate(g.arrivalDate)}</td>
                      <td>{formatDate(g.departureDate)}</td>
                      <td className="num">{g.defaultAdultCount}</td>
                      <td className="num">{g.defaultYouthCount}</td>
                      <td className="num">{g.defaultKidCount}</td>
                      <td className="num">{g.defaultCodeCount}</td>
                      <td className="num">
                        {g.defaultCustomDietCount}
                        {hasNotes && <span className="pdp-asterisk" title={g.customDietNotes}> *</span>}
                      </td>
                      <td className="num pdp-strong">{total}</td>
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => onViewGroup?.(g.groupReservationId)}
                          disabled={!onViewGroup}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="pdp-totals-row">
                  <td colSpan={3} className="pdp-totals-label">Totals</td>
                  <td className="num">{detail.totals.adults}</td>
                  <td className="num">{detail.totals.youth}</td>
                  <td className="num">{detail.totals.kids}</td>
                  <td className="num">{detail.totals.code}</td>
                  <td className="num">{detail.totals.customDiet}</td>
                  <td className="num">{detail.totals.grandTotal}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}</div>
        )}
      </div>

      {/* Days Covered */}
      <div className="pdp-collapsible">
        <button
          type="button"
          className="pdp-collapsible-toggle"
          aria-expanded={menusOpen}
          onClick={() => setMenusOpen(v => !v)}
        >
          <span className={`pdp-collapsible-chevron${menusOpen ? ' open' : ''}`}>▶</span>
          Days Covered ({detail.eventDays.length})
        </button>

        {menusOpen && (
          <div className="pdp-collapsible-body">{detail.eventDays.length === 0 ? (
            <p className="pdp-collapsible-empty">No event days have been created for this range yet.</p>
          ) : (
            <div className="pdp-table-wrapper">
            <table className="pdp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Breakfast</th>
                  <th>Lunch</th>
                  <th>Dinner</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.eventDays.map(day => (
                  <tr key={day.eventDayId}>
                    <td>{formatDayLong(day.date)}</td>
                    <td>{day.breakfastMenuName ?? <span className="pdp-muted">Not assigned</span>}</td>
                    <td>{day.lunchMenuName ?? <span className="pdp-muted">Not assigned</span>}</td>
                    <td>{day.dinnerMenuName ?? <span className="pdp-muted">Not assigned</span>}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn-gold btn-sm"
                        onClick={() => onViewDay?.(day.eventDayId, day.date)}
                        disabled={!onViewDay}
                      >
                        View Day
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}</div>
        )}
      </div>

      {/* Purchase List Items */}
      <section className="pdp-section">
        <h2 className="pdp-section-title" style={{ marginBottom: 'var(--spacing-sm)' }}>Items</h2>
        {loadingItems ? (
          <p className="empty-state" style={{ textAlign: 'left' }}>Loading items...</p>
        ) : !hasItems ? (
          <p className="empty-state" style={{ textAlign: 'left' }}>
            No items yet. Click <strong>Auto-Generate</strong> to build a list from the scheduled menus, or <strong>Custom Item</strong> to add manually.
          </p>
        ) : (
          <div className="pdp-table-wrapper">
            <table className="pdp-table">
              <thead>
                <tr>
                  <th className="pdp-col-check"></th>
                  <th>Item</th>
                  <th className="num">Quantity</th>
                  <th>Unit</th>
                  <th>Notes</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isGenerated = item.autoGenerated === true
                    || (item.autoGenerated == null && item.ingredientId != null)
                  const isCatalog = !isGenerated && item.ingredientId != null
                  const isCustom = !isGenerated && item.ingredientId == null
                  return (
                  <tr key={item.purchaseListItemId} className={item.checked ? 'pdp-item-checked' : undefined}>
                    <td className="pdp-col-check">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.purchaseListItemId)}
                        onChange={() => toggleSelected(item.purchaseListItemId)}
                        aria-label={`Select ${item.purchaseListItemName}`}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pdp-item-name-btn"
                        onClick={() => handleToggleChecked(item.purchaseListItemId)}
                        title={item.checked ? 'Mark as not purchased' : 'Mark as purchased'}
                      >
                        {item.purchaseListItemName}
                      </button>
                      {isCustom && <span className="pdp-item-tag pdp-item-tag--custom">Custom</span>}
                      {isCatalog && <span className="pdp-item-tag pdp-item-tag--added">Added</span>}
                    </td>
                    <td className="num">{item.quantity.toFixed(2)}</td>
                    <td>{item.uom}</td>
                    <td>{item.notes ?? ''}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleDeleteSingle(item.purchaseListItemId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddModal && (
        <AddCustomItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {showCatalogModal && (
        <AddFromCatalogModal
          onClose={() => setShowCatalogModal(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  )
}
