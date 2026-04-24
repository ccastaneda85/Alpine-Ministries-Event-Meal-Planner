import { useState, useEffect, useCallback } from 'react'
import { Zap, XCircle, Plus, Trash2, Pencil, Check, X, StickyNote, Printer, Sparkles } from 'lucide-react'
import type { MealPlanDetail, PurchaseList, PurchaseListItem } from '../../types'
import { api } from '../../services/api'
import alpineLogo from '../../assets/AlpineMainLogo.png'
import AddCustomItemModal from './AddCustomItemModal'
import AddFromCatalogModal from './AddFromCatalogModal'
import ConfirmModal from '../CalendarView/ConfirmModal'

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
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [menusOpen, setMenusOpen] = useState(false)

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

  // Inline row edit
  type EditForm = {
    name: string
    quantity: number
    uom: string
    vendor: string
    vendorItemNumber: string
    vendorItemDescription: string
    status: '' | 'SOURCING' | 'PURCHASED'
    purchaseOrderNumber: string
  }
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [savingEditId, setSavingEditId] = useState<number | null>(null)

  // Notes row editor
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [editingNotesValue, setEditingNotesValue] = useState('')
  const [savingNotesId, setSavingNotesId] = useState<number | null>(null)

  // Two-step delete confirm
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // AI vendor analysis
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<{ totalItems: number; itemsUpdated: number } | null>(null)

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
    setDeletingId(id)
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
    } finally {
      setDeletingId(null)
    }
  }

  function startEditRow(item: PurchaseListItem) {
    setEditingItemId(item.purchaseListItemId)
    setEditForm({
      name: item.purchaseListItemName,
      quantity: item.quantity,
      uom: item.uom,
      vendor: item.vendor ?? '',
      vendorItemNumber: item.vendorItemNumber ?? '',
      vendorItemDescription: item.vendorItemDescription ?? '',
      status: (item.status ?? '') as '' | 'SOURCING' | 'PURCHASED',
      purchaseOrderNumber: item.purchaseOrderNumber ?? '',
    })
    setEditingNotesId(null)
  }

  function cancelEditRow() {
    setEditingItemId(null)
    setEditForm(null)
  }

  async function saveEditRow(item: PurchaseListItem) {
    if (!editForm) return
    setSavingEditId(item.purchaseListItemId)
    setItemError(null)
    try {
      const updated = await api.updatePurchaseListItem(item.purchaseListItemId, {
        itemName: editForm.name,
        quantity: editForm.quantity,
        uom: editForm.uom,
        notes: item.notes ?? null,
        vendor: editForm.vendor.trim() || null,
        vendorItemNumber: editForm.vendorItemNumber.trim() || null,
        vendorItemDescription: editForm.vendorItemDescription.trim() || null,
        status: editForm.status === '' ? null : editForm.status,
        purchaseOrderNumber: editForm.purchaseOrderNumber.trim() || null,
      })
      setItems(prev => prev.map(it => it.purchaseListItemId === item.purchaseListItemId ? updated : it))
      setEditingItemId(null)
      setEditForm(null)
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setSavingEditId(null)
    }
  }

  async function handleAnalyze() {
    if (!purchaseList) return
    setAnalyzing(true)
    setItemError(null)
    setAnalyzeResult(null)
    try {
      const result = await api.analyzePurchaseList(purchaseList.purchaseListId)
      setAnalyzeResult({ totalItems: result.totalItems, itemsUpdated: result.itemsUpdated })
      await loadPurchaseList()
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handlePrint() {
    // Encode logo as base64 so it works in the detached print window
    let logoDataUri = ''
    try {
      const res = await fetch(alpineLogo)
      const blob = await res.blob()
      logoDataUri = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch { /* skip logo if fetch fails */ }

    function esc(s?: string | null) {
      return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    function fmtLong(iso: string) {
      const [y, m, d] = iso.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }

    const rangeStr = `${fmtLong(detail.startDate)} – ${fmtLong(detail.endDate)}`
    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })

    const itemsRows = items.length === 0
      ? `<tr><td colspan="10" class="empty">No items on this purchase list.</td></tr>`
      : items.map((item, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td>${esc(item.purchaseListItemName)}</td>
            <td class="num">${item.quantity.toFixed(2)}</td>
            <td>${esc(item.uom)}</td>
            <td>${esc(item.vendor)}</td>
            <td>${esc(item.vendorItemNumber)}</td>
            <td>${esc(item.vendorItemDescription)}</td>
            <td>${esc(item.status)}</td>
            <td>${esc(item.purchaseOrderNumber)}</td>
            <td class="notes">${esc(item.notes)}</td>
          </tr>`).join('')

    const logoHtml = logoDataUri
      ? `<img src="${logoDataUri}" class="logo" alt="Alpine Ministries" />`
      : ''

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Purchase List — ${esc(detail.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px 28px; }

    /* Header */
    .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; border-bottom: 2px solid #BB8E35; padding-bottom: 10px; }
    .logo { height: 52px; width: auto; }
    .header-text h1 { font-size: 18px; font-weight: bold; color: #1a1a1a; }
    .header-text .subtitle { font-size: 12px; color: #9a7429; font-weight: bold; margin-top: 3px; }
    .header-text .range { font-size: 11px; color: #555; margin-top: 2px; }
    .header-text .generated { font-size: 10px; color: #888; margin-top: 4px; font-style: italic; }

    /* Items table (framed) */
    .items-frame { border: 1.5px solid #BB8E35; border-radius: 4px; overflow: hidden; }
    .items-header { background: #BB8E35; color: #fff; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 10px; }
    .items-body { padding: 0; }

    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { text-align: left; font-size: 10px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding: 5px 7px; background: #faf7ee; }
    .items-table th.num { text-align: right; }
    .items-table td { padding: 4px 7px; border-bottom: 1px solid #e2e2e2; font-size: 11px; vertical-align: top; }
    .items-table td.num { text-align: right; }
    .items-table td.notes { font-style: italic; color: #555; font-size: 10px; }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table td.empty { text-align: center; color: #999; font-style: italic; padding: 14px 0; }

    @media print {
      body { padding: 14px 18px; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    ${logoHtml}
    <div class="header-text">
      <h1>Purchase List</h1>
      <div class="subtitle">${esc(detail.name)}</div>
      <div class="range">${rangeStr}</div>
      <div class="generated">Printed ${generatedAt}</div>
    </div>
  </div>

  <div class="items-frame">
    <div class="items-header">Items (${items.length})</div>
    <div class="items-body">
      <table class="items-table">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Item</th>
            <th class="num">Quantity</th>
            <th>Unit</th>
            <th>Vendor</th>
            <th>Vendor Item #</th>
            <th>Vendor Description</th>
            <th>Status</th>
            <th>PO #</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  function openNotesEditor(item: PurchaseListItem) {
    setEditingNotesId(item.purchaseListItemId)
    setEditingNotesValue(item.notes ?? '')
    setEditingItemId(null)
    setEditForm(null)
  }

  async function saveNotes(item: PurchaseListItem) {
    setSavingNotesId(item.purchaseListItemId)
    setItemError(null)
    try {
      const updated = await api.updatePurchaseListItem(item.purchaseListItemId, {
        itemName: item.purchaseListItemName,
        quantity: item.quantity,
        uom: item.uom,
        notes: editingNotesValue,
        vendor: item.vendor ?? null,
        vendorItemNumber: item.vendorItemNumber ?? null,
        vendorItemDescription: item.vendorItemDescription ?? null,
        status: item.status ?? null,
        purchaseOrderNumber: item.purchaseOrderNumber ?? null,
      })
      setItems(prev => prev.map(it => it.purchaseListItemId === item.purchaseListItemId ? updated : it))
      setEditingNotesId(null)
    } catch (err) {
      setItemError(extractApiErrorMessage(err))
    } finally {
      setSavingNotesId(null)
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
          className="btn-outline btn-sm pdp-action-btn"
          onClick={handlePrint}
          title="Print purchase list"
        >
          <Printer size={13} /> Print
        </button>
        <button
          type="button"
          className="btn-outline btn-sm pdp-action-btn pdp-analyze-btn"
          disabled={analyzing || !hasItems}
          onClick={handleAnalyze}
          title="Use AI to match items to uploaded vendor CSVs"
        >
          {analyzing
            ? <><span className="pdp-spinner" aria-hidden="true" /> Analyzing…</>
            : <><Sparkles size={13} /> Analyze with AI</>
          }
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

      {analyzeResult && (
        <div className="pdp-analyze-result" role="status">
          <Sparkles size={14} />
          <span>
            AI analysis complete — filled {analyzeResult.itemsUpdated} of {analyzeResult.totalItems} item{analyzeResult.totalItems === 1 ? '' : 's'}.
            Review the Vendor / Vendor Item # / Status columns and adjust anything that looks off.
          </span>
          <button type="button" className="pdp-analyze-result-close" onClick={() => setAnalyzeResult(null)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      )}

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
      <section className="pdp-section pdp-items-section">
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
                  <th>Vendor</th>
                  <th>Vendor Item #</th>
                  <th>Status</th>
                  <th>PO #</th>
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
                  const isEditing = editingItemId === item.purchaseListItemId
                  const isSavingEdit = savingEditId === item.purchaseListItemId
                  const isEditingNotes = editingNotesId === item.purchaseListItemId
                  const isSavingNotes = savingNotesId === item.purchaseListItemId
                  const isDeleting = deletingId === item.purchaseListItemId
                  return (
                  <>
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
                      {isEditing && editForm ? (
                        <input
                          className="kp-inline-input"
                          style={{ width: 180, textAlign: 'left' }}
                          value={editForm.name}
                          onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                    <td className="num">
                      {isEditing && editForm ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="kp-inline-input"
                          value={editForm.quantity}
                          onChange={e => setEditForm(f => f ? { ...f, quantity: +e.target.value } : f)}
                        />
                      ) : (
                        item.quantity.toFixed(2)
                      )}
                    </td>
                    <td>
                      {isEditing && editForm ? (
                        <input
                          className="kp-inline-input"
                          style={{ width: 70, textAlign: 'left' }}
                          value={editForm.uom}
                          onChange={e => setEditForm(f => f ? { ...f, uom: e.target.value } : f)}
                        />
                      ) : (
                        item.uom
                      )}
                    </td>
                    <td>
                      {isEditing && editForm ? (
                        <input
                          className="kp-inline-input"
                          style={{ width: 110, textAlign: 'left' }}
                          value={editForm.vendor}
                          onChange={e => setEditForm(f => f ? { ...f, vendor: e.target.value } : f)}
                        />
                      ) : (
                        item.vendor ?? <span className="pdp-muted">—</span>
                      )}
                    </td>
                    <td>
                      {isEditing && editForm ? (
                        <div className="pdp-vendor-num-cell">
                          <input
                            className="kp-inline-input"
                            style={{ width: 110, textAlign: 'left' }}
                            placeholder="Item #"
                            value={editForm.vendorItemNumber}
                            onChange={e => setEditForm(f => f ? { ...f, vendorItemNumber: e.target.value } : f)}
                          />
                          <input
                            className="kp-inline-input"
                            style={{ width: 180, textAlign: 'left', marginTop: 4 }}
                            placeholder="Vendor description"
                            value={editForm.vendorItemDescription}
                            onChange={e => setEditForm(f => f ? { ...f, vendorItemDescription: e.target.value } : f)}
                          />
                        </div>
                      ) : item.vendorItemNumber ? (
                        <span title={item.vendorItemDescription ?? undefined}>
                          {item.vendorItemNumber}
                          {item.vendorItemDescription && (
                            <div className="pdp-vendor-desc">{item.vendorItemDescription}</div>
                          )}
                        </span>
                      ) : (
                        <span className="pdp-muted">—</span>
                      )}
                    </td>
                    <td>
                      {isEditing && editForm ? (
                        <select
                          className="kp-inline-input"
                          value={editForm.status}
                          onChange={e => setEditForm(f => f ? { ...f, status: e.target.value as EditForm['status'] } : f)}
                        >
                          <option value="">—</option>
                          <option value="SOURCING">Sourcing</option>
                          <option value="PURCHASED">Purchased</option>
                        </select>
                      ) : item.status ? (
                        <span className={`status-badge status-badge--${item.status === 'SOURCING' ? 'gold' : 'success'}`}>
                          {item.status === 'SOURCING' ? 'Sourcing' : 'Purchased'}
                        </span>
                      ) : (
                        <span className="pdp-muted">—</span>
                      )}
                    </td>
                    <td>
                      {isEditing && editForm ? (
                        <input
                          className="kp-inline-input"
                          style={{ width: 100, textAlign: 'left' }}
                          value={editForm.purchaseOrderNumber}
                          onChange={e => setEditForm(f => f ? { ...f, purchaseOrderNumber: e.target.value } : f)}
                        />
                      ) : (
                        item.purchaseOrderNumber ?? <span className="pdp-muted">—</span>
                      )}
                    </td>
                    <td>{item.notes ?? ''}</td>
                    <td className="col-actions">
                      <div className="action-btns">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="kp-edit-btn"
                              disabled={isSavingEdit}
                              onClick={() => saveEditRow(item)}
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              className="kp-edit-btn"
                              onClick={cancelEditRow}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="kp-edit-btn"
                            onClick={() => startEditRow(item)}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`kp-edit-btn${isEditingNotes ? ' active' : ''}`}
                          style={item.notes ? { color: 'var(--color-primary)' } : undefined}
                          onClick={() => isEditingNotes ? setEditingNotesId(null) : openNotesEditor(item)}
                          title={item.notes ? 'Edit notes' : 'Add notes'}
                        >
                          <StickyNote size={13} />
                        </button>
                        <button
                          type="button"
                          className="kp-del-btn"
                          disabled={isDeleting}
                          onClick={() => setPendingDeleteItemId(item.purchaseListItemId)}
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isEditingNotes && (
                    <tr className="kp-notes-editor-row">
                      <td colSpan={10}>
                        <div className="kp-notes-editor">
                          <textarea
                            className="kp-notes-textarea"
                            placeholder="Add notes for this item..."
                            value={editingNotesValue}
                            onChange={e => setEditingNotesValue(e.target.value)}
                            rows={2}
                          />
                          <div className="kp-notes-editor-actions">
                            <button
                              type="button"
                              className="btn-gold btn-sm"
                              disabled={isSavingNotes}
                              onClick={() => saveNotes(item)}
                            >
                              {isSavingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button
                              type="button"
                              className="btn-outline btn-sm"
                              onClick={() => setEditingNotesId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
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

      {pendingDeleteItemId !== null && (
        <ConfirmModal
          title="Delete item?"
          message="This will permanently remove this item from the purchase list."
          confirmLabel={deletingId === pendingDeleteItemId ? 'Deleting...' : 'Delete'}
          disabled={deletingId === pendingDeleteItemId}
          onConfirm={async () => {
            const id = pendingDeleteItemId
            await handleDeleteSingle(id)
            setPendingDeleteItemId(null)
          }}
          onCancel={() => setPendingDeleteItemId(null)}
        />
      )}
    </div>
  )
}
