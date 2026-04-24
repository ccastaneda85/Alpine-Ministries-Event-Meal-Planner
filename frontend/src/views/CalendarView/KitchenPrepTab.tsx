import { useState, useEffect } from 'react'
import alpineLogo from '../../assets/AlpineMainLogo.png'
import { Zap, XCircle, Plus, Trash2, StickyNote, Pencil, Check, X, Printer } from 'lucide-react'
import type { EventDay, MealPeriod, KitchenPrepList, KitchenPrepListItem, GroupAttendanceRow } from '../../types'
import { api } from '../../services/api'
import AddPrepItemModal from './AddPrepItemModal'
import AddFromCatalogModal from './AddFromCatalogModal'
import ConfirmModal from './ConfirmModal'

const PERIOD_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'UNASSIGNED'] as const
const PERIOD_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  UNASSIGNED: 'Unassigned',
}

type GroupKey = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'UNASSIGNED'

interface Props {
  eventDay: EventDay | null
  mealPeriods: MealPeriod[]
  onRefresh?: () => void
}

export default function KitchenPrepTab({ eventDay, mealPeriods, onRefresh }: Props) {
  const [prepList, setPrepList] = useState<KitchenPrepList | null>(null)
  const [items, setItems] = useState<KitchenPrepListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [staffInstructions, setStaffInstructions] = useState('')
  const [editingInstructions, setEditingInstructions] = useState(false)
  const [instructionsDraft, setInstructionsDraft] = useState('')
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [editingNotesValue, setEditingNotesValue] = useState('')
  const [savingItemNotesId, setSavingItemNotesId] = useState<number | null>(null)

  // Inline serving quantity editing
  type ServingForm = { menuItemName: string; adultServings: number; youthServings: number; kidServings: number; codeServings: number }
  const [editingServingsId, setEditingServingsId] = useState<number | null>(null)
  const [editingServingsForm, setEditingServingsForm] = useState<ServingForm | null>(null)
  const [savingServingsId, setSavingServingsId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingList, setDeletingList] = useState(false)
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null)
  const [pendingZeroItem, setPendingZeroItem] = useState<KitchenPrepListItem | null>(null)
  const [expandedHeadcounts, setExpandedHeadcounts] = useState<Set<number>>(new Set())
  const [headcountData, setHeadcountData] = useState<Record<number, GroupAttendanceRow[]>>({})
  const [loadingHeadcounts, setLoadingHeadcounts] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!eventDay) {
      setPrepList(null)
      setItems([])
      return
    }
    setLoading(true)
    api.getKitchenPrepByEventDay(eventDay.eventDayId)
      .then(async pl => {
        setPrepList(pl)
        setStaffInstructions(pl.staffInstructions ?? '')
        setEditingInstructions(false)
        const its = await api.getKitchenPrepItems(pl.kitchenPrepListId)
        setItems(its)
      })
      .catch(() => {
        setPrepList(null)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [eventDay])

  async function handleCreate() {
    if (!eventDay) return
    setCreating(true)
    try {
      const pl = await api.createKitchenPrepList(eventDay.eventDayId)
      setPrepList(pl)
      setStaffInstructions(pl.staffInstructions ?? '')
      setEditingInstructions(false)
      setItems([])
      onRefresh?.()
    } finally {
      setCreating(false)
    }
  }

  async function handleGenerate() {
    if (!prepList) return
    setGenerating(true)
    try {
      await api.generateKitchenPrep(prepList.kitchenPrepListId)
      const updated = await api.getKitchenPrepItems(prepList.kitchenPrepListId)
      setItems(updated)
    } finally {
      setGenerating(false)
    }
  }

  async function handleClearGenerated() {
    if (!prepList) return
    setClearing(true)
    try {
      await api.clearGeneratedItems(prepList.kitchenPrepListId)
      const updated = await api.getKitchenPrepItems(prepList.kitchenPrepListId)
      setItems(updated)
    } finally {
      setClearing(false)
    }
  }

  async function handleAddItem(data: {
    menuItemName: string
    adultServings: number
    youthServings: number
    kidServings: number
    codeServings: number
    notes?: string
    mealPeriodId?: number
  }) {
    if (!prepList) return
    await api.addKitchenPrepItem(prepList.kitchenPrepListId, data)
    const updated = await api.getKitchenPrepItems(prepList.kitchenPrepListId)
    setItems(updated)
  }

  async function handleDeleteItem(itemId: number) {
    setDeletingId(itemId)
    try {
      await api.deleteKitchenPrepItem(itemId)
      setItems(prev => prev.filter(i => i.kitchenPrepListItemId !== itemId))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleZeroItem(item: KitchenPrepListItem) {
    setDeletingId(item.kitchenPrepListItemId)
    try {
      const updated = await api.updateKitchenPrepItem(item.kitchenPrepListItemId, {
        menuItemName: item.menuItemName,
        adultServings: 0,
        youthServings: 0,
        kidServings: 0,
        codeServings: 0,
      })
      setItems(prev => prev.map(i => i.kitchenPrepListItemId === item.kitchenPrepListItemId ? updated : i))
    } finally {
      setDeletingId(null)
    }
  }

  function openNotesEditor(item: KitchenPrepListItem) {
    setEditingNotesId(item.kitchenPrepListItemId)
    setEditingNotesValue(item.notes ?? '')
  }

  async function handleSaveItemNotes(itemId: number) {
    setSavingItemNotesId(itemId)
    try {
      const updated = await api.updateKitchenPrepItemNotes(itemId, editingNotesValue)
      setItems(prev => prev.map(i => i.kitchenPrepListItemId === itemId ? { ...i, notes: updated.notes } : i))
      setEditingNotesId(null)
    } finally {
      setSavingItemNotesId(null)
    }
  }

  function startEditServings(item: KitchenPrepListItem) {
    setEditingServingsId(item.kitchenPrepListItemId)
    setEditingServingsForm({
      menuItemName: item.menuItemName,
      adultServings: item.adultServings,
      youthServings: item.youthServings,
      kidServings: item.kidServings,
      codeServings: item.codeServings,
    })
  }

  async function handleSaveServings(itemId: number) {
    if (!editingServingsForm) return
    setSavingServingsId(itemId)
    try {
      const updated = await api.updateKitchenPrepItem(itemId, editingServingsForm)
      setItems(prev => prev.map(i => i.kitchenPrepListItemId === itemId ? updated : i))
      setEditingServingsId(null)
      setEditingServingsForm(null)
    } finally {
      setSavingServingsId(null)
    }
  }

  function openInstructionsEditor() {
    setInstructionsDraft(staffInstructions)
    setEditingInstructions(true)
  }

  async function handleSaveInstructions() {
    if (!prepList) return
    setSavingInstructions(true)
    try {
      const updated = await api.updateKitchenPrepStaffInstructions(prepList.kitchenPrepListId, instructionsDraft)
      setPrepList(updated)
      setStaffInstructions(updated.staffInstructions ?? '')
      setEditingInstructions(false)
    } finally {
      setSavingInstructions(false)
    }
  }

  async function handleDeletePrepList() {
    if (!prepList) return
    setDeletingList(true)
    try {
      await api.deleteKitchenPrepList(prepList.kitchenPrepListId)
      setPrepList(null)
      setItems([])
      setShowDeleteConfirm(false)
      onRefresh?.()
    } catch (err) {
      alert(`Failed to delete prep list: ${err instanceof Error ? err.message : err}`)
    } finally {
      setDeletingList(false)
    }
  }

  async function handlePrint() {
    const periodsNeeded = PERIOD_ORDER.filter(k => k !== 'UNASSIGNED')
      .map(k => mealPeriods.find(p => p.mealPeriodType === k))
      .filter(Boolean) as typeof mealPeriods

    const allHeadcounts: Record<number, GroupAttendanceRow[]> = { ...headcountData }
    await Promise.all(periodsNeeded.map(async p => {
      allHeadcounts[p.mealPeriodId] = await api.getMealPeriodGroupAttendances(p.mealPeriodId)
    }))

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

    const date = new Date(eventDay!.date + 'T12:00:00')
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    function esc(s?: string | null) {
      return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    function headcountTable(rows: GroupAttendanceRow[]) {
      if (!rows.length) return '<p class="empty">No group attendance recorded.</p>'
      return `
        <table class="hc-table">
          <thead><tr>
            <th>Group</th><th class="num">Adults</th><th class="num">Youth</th>
            <th class="num">Kids</th><th class="num">Code</th>
            <th class="num">Custom Diet</th><th>Custom Diet Notes</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `<tr${r.customDietCount > 0 ? ' class="diet-row"' : ''}>
              <td>${esc(r.groupName)}</td>
              <td class="num">${r.adultCount}</td>
              <td class="num">${r.youthCount}</td>
              <td class="num">${r.kidCount}</td>
              <td class="num">${r.codeCount}</td>
              <td class="num${r.customDietCount > 0 ? ' diet-count' : ''}">${r.customDietCount}</td>
              <td class="notes">${esc(r.customDietNotes) || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
    }

    function prepItemsTable(sectionItems: KitchenPrepListItem[]) {
      if (!sectionItems.length) return '<p class="empty">No prep items.</p>'
      return `
        <table class="prep-table">
          <thead><tr>
            <th>Prep Item</th><th class="num">Adults</th><th class="num">Youth</th>
            <th class="num">Kids</th><th class="num">Code</th><th class="num">Total</th><th>Notes</th>
          </tr></thead>
          <tbody>
            ${sectionItems.map(item => {
              const total = item.adultServings + item.youthServings + item.kidServings + item.codeServings
              const badge = !item.autoGenerated
                ? ' <span class="badge badge-custom">custom</span>'
                : item.manuallyAdjusted ? ' <span class="badge badge-adjusted">adjusted</span>' : ''
              return `<tr>
                <td>${esc(item.menuItemName)}${badge}</td>
                <td class="num">${item.adultServings}</td>
                <td class="num">${item.youthServings}</td>
                <td class="num">${item.kidServings}</td>
                <td class="num">${item.codeServings}</td>
                <td class="num total">${total}</td>
                <td class="notes">${esc(item.notes)}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>`
    }

    const printGrouped: Record<GroupKey, KitchenPrepListItem[]> = Object.fromEntries(
      PERIOD_ORDER.map(k => [k, [] as KitchenPrepListItem[]])
    ) as Record<GroupKey, KitchenPrepListItem[]>
    for (const item of items) {
      const key = (item.mealPeriodType ?? 'UNASSIGNED') as GroupKey
      printGrouped[key].push(item)
    }

    const sections = PERIOD_ORDER
      .filter(k => printGrouped[k].length > 0 || periodsNeeded.some(p => p.mealPeriodType === k))
      .map(key => {
        const mp = mealPeriods.find(p => p.mealPeriodType === key)
        const hc = mp ? (allHeadcounts[mp.mealPeriodId] ?? []) : []
        return `
          <div class="period-section">
            <div class="period-header">${PERIOD_LABEL[key]}</div>
            <div class="period-body">
              <div class="sub-section hc-section">
                <div class="sub-label">Group Headcounts</div>
                ${headcountTable(hc)}
              </div>
              <div class="sub-section prep-section">
                <div class="sub-label">Prep Items</div>
                ${prepItemsTable(printGrouped[key])}
              </div>
            </div>
          </div>`
      }).join('')

    const logoHtml = logoDataUri
      ? `<img src="${logoDataUri}" class="logo" alt="Alpine Ministries" />`
      : ''

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kitchen Prep — ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px 28px; }

    /* Header */
    .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; border-bottom: 2px solid #BB8E35; padding-bottom: 10px; }
    .logo { height: 48px; width: auto; }
    .header-text h1 { font-size: 17px; font-weight: bold; color: #1a1a1a; }
    .header-text .date { font-size: 11px; color: #555; margin-top: 2px; }

    /* Staff instructions */
    .staff-instructions { margin-bottom: 14px; padding: 8px 10px; border: 1px solid #c8c8c8; border-left: 3px solid #BB8E35; background: #fffdf7; }
    .staff-instructions .label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; color: #9a7429; margin-bottom: 3px; }
    .staff-instructions p { white-space: pre-wrap; font-size: 11px; }
    .none { color: #999; font-style: italic; }

    /* Period frame */
    .period-section { border: 1.5px solid #BB8E35; border-radius: 4px; margin-bottom: 14px; overflow: hidden; page-break-inside: avoid; }
    .period-header { background: #BB8E35; color: #fff; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 10px; }
    .period-body { padding: 8px 10px; }

    /* Sub sections */
    .sub-section { margin-bottom: 8px; }
    .sub-section:last-child { margin-bottom: 0; }
    .sub-label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; color: #777; margin-bottom: 4px; }

    /* Headcount table — smaller, subdued */
    .hc-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
    .hc-table th { text-align: left; font-size: 9px; font-weight: bold; border-bottom: 1px solid #bbb; padding: 2px 5px; color: #555; }
    .hc-table th.num { text-align: center; }
    .hc-table td { padding: 2px 5px; border-bottom: 1px solid #e8e8e8; font-size: 10px; color: #444; }
    .hc-table td.num { text-align: center; }
    .hc-table td.diet-count { font-weight: bold; color: #b03030; }
    .hc-table tr.diet-row td { background: #fff5f5; }
    .hc-table td.notes { font-style: italic; }

    /* Prep items table — larger, prominent */
    .prep-section { border-top: 1px solid #ddd; padding-top: 8px; margin-top: 6px; }
    .prep-table { width: 100%; border-collapse: collapse; }
    .prep-table th { text-align: left; font-size: 10px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding: 3px 6px; }
    .prep-table th.num { text-align: center; }
    .prep-table td { padding: 4px 6px; border-bottom: 1px solid #ddd; font-size: 12px; vertical-align: top; }
    .prep-table td.num { text-align: center; }
    .prep-table td.total { font-weight: bold; font-size: 13px; }
    .prep-table td.notes { font-style: italic; color: #555; font-size: 11px; }
    .prep-table tr:last-child td { border-bottom: none; }

    /* Badges */
    .badge { display: inline-block; font-size: 8px; padding: 1px 4px; border-radius: 3px; font-style: normal; margin-left: 4px; vertical-align: middle; font-weight: normal; }
    .badge-custom { background: #dde3ea; color: #3a4f63; }
    .badge-adjusted { background: #fef3dc; color: #7a5a10; }

    .empty { color: #999; font-style: italic; font-size: 10px; padding: 2px 0; }

    @media print {
      body { padding: 14px 18px; }
      .period-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    ${logoHtml}
    <div class="header-text">
      <h1>Kitchen Prep List</h1>
      <div class="date">${dateStr}</div>
    </div>
  </div>

  <div class="staff-instructions">
    <div class="label">Staff Instructions</div>
    <p>${prepList!.staffInstructions?.trim() ? esc(prepList!.staffInstructions) : '<span class="none">None</span>'}</p>
  </div>

  ${sections}
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  async function toggleHeadcounts(mealPeriodId: number) {
    if (expandedHeadcounts.has(mealPeriodId)) {
      setExpandedHeadcounts(prev => { const s = new Set(prev); s.delete(mealPeriodId); return s })
      return
    }
    setExpandedHeadcounts(prev => new Set(prev).add(mealPeriodId))
    setLoadingHeadcounts(prev => new Set(prev).add(mealPeriodId))
    try {
      const rows = await api.getMealPeriodGroupAttendances(mealPeriodId)
      setHeadcountData(prev => ({ ...prev, [mealPeriodId]: rows }))
    } finally {
      setLoadingHeadcounts(prev => { const s = new Set(prev); s.delete(mealPeriodId); return s })
    }
  }

  if (!eventDay) {
    return <p className="empty-state">No event day configured for this date.</p>
  }

  if (loading) {
    return <p className="empty-state">Loading prep list...</p>
  }

  if (!prepList) {
    return (
      <div className="kp-empty">
        <p className="empty-state">No prep list exists for this day.</p>
        <button className="btn-gold" disabled={creating} onClick={handleCreate} type="button">
          {creating ? 'Creating...' : '+ Create Prep List'}
        </button>
      </div>
    )
  }

  const grouped = Object.fromEntries(
    PERIOD_ORDER.map(k => [k, [] as KitchenPrepListItem[]])
  ) as Record<GroupKey, KitchenPrepListItem[]>

  for (const item of items) {
    const key = (item.mealPeriodType ?? 'UNASSIGNED') as GroupKey
    grouped[key].push(item)
  }

  const hasItems = items.length > 0

  return (
    <div className="kp-tab">
      <div className="kp-actions">
        <button
          type="button"
          className="btn-gold btn-sm kp-action-btn"
          disabled={generating}
          onClick={handleGenerate}
        >
          <Zap size={13} />
          {generating ? 'Generating...' : 'Auto-Generate'}
        </button>
        <button
          type="button"
          className="btn-outline btn-sm kp-action-btn"
          disabled={clearing || !hasItems}
          onClick={handleClearGenerated}
        >
          <XCircle size={13} />
          {clearing ? 'Clearing...' : 'Clear Generated'}
        </button>
        <button
          type="button"
          className="btn-outline btn-sm kp-action-btn"
          onClick={() => setShowAddCatalogModal(true)}
        >
          <Plus size={13} /> From Catalog
        </button>
        <button
          type="button"
          className="btn-outline btn-sm kp-action-btn"
          onClick={() => setShowAddCustomModal(true)}
        >
          <Plus size={13} /> Custom Item
        </button>
        <button
          type="button"
          className="btn-outline btn-sm kp-action-btn"
          onClick={handlePrint}
          title="Print prep list"
        >
          <Printer size={13} /> Print
        </button>
        <button
          type="button"
          className="btn-outline btn-sm kp-action-btn kp-delete-list-btn"
          onClick={() => setShowDeleteConfirm(true)}
          title="Delete prep list"
        >
          <Trash2 size={13} /> Delete List
        </button>
      </div>

      <div className="kp-staff-instructions">
        <div className="kp-staff-instructions-header">
          <span className="kp-staff-instructions-label">Staff Instructions</span>
          {!editingInstructions && (
            <button type="button" className="kp-edit-btn" onClick={openInstructionsEditor} title="Edit staff instructions">
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editingInstructions ? (
          <div className="kp-staff-instructions-editor">
            <textarea
              className="kp-notes-textarea"
              rows={3}
              placeholder="Add instructions for kitchen staff..."
              value={instructionsDraft}
              onChange={e => setInstructionsDraft(e.target.value)}
              autoFocus
            />
            <div className="kp-notes-editor-actions">
              <button type="button" className="btn-gold btn-sm" disabled={savingInstructions} onClick={handleSaveInstructions}>
                {savingInstructions ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => setEditingInstructions(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="kp-staff-instructions-text">
            {staffInstructions || <span className="kp-staff-instructions-empty">No instructions added.</span>}
          </p>
        )}
      </div>

      {!hasItems && (
        <p className="empty-state">No prep items yet. Auto-generate from meal periods or add items manually.</p>
      )}

      {PERIOD_ORDER.map(key => {
        const sectionItems = grouped[key]
        if (sectionItems.length === 0) return null
        const mealPeriod = mealPeriods.find(p => p.mealPeriodType === key)
      const mpId = mealPeriod?.mealPeriodId
      const isExpanded = mpId !== undefined && expandedHeadcounts.has(mpId)
      const isLoadingHC = mpId !== undefined && loadingHeadcounts.has(mpId)
      const hcRows = mpId !== undefined ? (headcountData[mpId] ?? []) : []

      return (
          <div key={key} className="kp-section">
            <div className="kp-section-header">{PERIOD_LABEL[key]}</div>

            {mpId !== undefined && key !== 'UNASSIGNED' && (
              <div className="kp-headcount-panel">
                <button
                  type="button"
                  className="kp-headcount-toggle"
                  onClick={() => toggleHeadcounts(mpId)}
                >
                  <span className={`kp-headcount-chevron${isExpanded ? ' open' : ''}`}>▶</span>
                  Group Headcounts
                </button>
                {isExpanded && (
                  <div className="kp-headcount-body">
                    {isLoadingHC && <p className="kp-headcount-loading">Loading...</p>}
                    {!isLoadingHC && hcRows.length === 0 && (
                      <p className="kp-headcount-loading">No group attendance recorded for this period.</p>
                    )}
                    {!isLoadingHC && hcRows.length > 0 && (
                      <table className="kp-headcount-table">
                        <thead>
                          <tr>
                            <th>Group</th>
                            <th className="kp-num">Adults</th>
                            <th className="kp-num">Youth</th>
                            <th className="kp-num">Kids</th>
                            <th className="kp-num">Code</th>
                            <th className="kp-num">Custom Diet</th>
                            <th>Custom Diet Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hcRows.map((row, i) => (
                            <tr key={i} className={row.customDietCount > 0 ? 'kp-headcount-row-diet' : ''}>
                              <td className="kp-headcount-group">{row.groupName}</td>
                              <td className="kp-num">{row.adultCount}</td>
                              <td className="kp-num">{row.youthCount}</td>
                              <td className="kp-num">{row.kidCount}</td>
                              <td className="kp-num">{row.codeCount}</td>
                              <td className={`kp-num${row.customDietCount > 0 ? ' kp-diet-count' : ''}`}>{row.customDietCount}</td>
                              <td className="kp-headcount-diet-notes">{row.customDietNotes ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            <table className="kp-table">
              <thead>
                <tr>
                  <th>Prep Item</th>
                  <th className="kp-num">Adults</th>
                  <th className="kp-num">Youth</th>
                  <th className="kp-num">Kids</th>
                  <th className="kp-num">Code</th>
                  <th className="kp-num">Total</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sectionItems.map(item => {
                  const isDeleting = deletingId === item.kitchenPrepListItemId
                  const isEditingNotes = editingNotesId === item.kitchenPrepListItemId
                  const isSavingNotes = savingItemNotesId === item.kitchenPrepListItemId
                  const isEditingServings = editingServingsId === item.kitchenPrepListItemId
                  const isSavingServings = savingServingsId === item.kitchenPrepListItemId
                  const form = editingServingsForm
                  const displayServings = isEditingServings && form ? form : item
                  const total = displayServings.adultServings + displayServings.youthServings + displayServings.kidServings + displayServings.codeServings
                  const rowClass = [
                    item.autoGenerated ? 'kp-row-auto' : 'kp-row-manual',
                    item.autoGenerated && item.manuallyAdjusted ? 'kp-row-adjusted' : '',
                  ].filter(Boolean).join(' ')

                  return (
                    <>
                      <tr key={item.kitchenPrepListItemId} className={rowClass}>
                        <td className="kp-item-name">
                          {isEditingServings && form ? (
                            <input
                              className="kp-inline-input"
                              style={{ width: 120, textAlign: 'left' }}
                              value={form.menuItemName}
                              onChange={e => setEditingServingsForm(f => f ? { ...f, menuItemName: e.target.value } : f)}
                            />
                          ) : (
                            <>
                              {item.menuItemName}
                              {!item.autoGenerated && <span className="kp-manual-badge">custom</span>}
                              {item.manuallyAdjusted && <span className="kp-adjusted-badge">adjusted</span>}
                            </>
                          )}
                        </td>
                        {isEditingServings && form ? (
                          <>
                            {(['adultServings', 'youthServings', 'kidServings', 'codeServings'] as const).map(f => (
                              <td key={f} className="kp-num">
                                <input
                                  type="number"
                                  min={0}
                                  className="kp-inline-input"
                                  value={form[f]}
                                  onChange={e => setEditingServingsForm(prev => prev ? { ...prev, [f]: +e.target.value } : prev)}
                                />
                              </td>
                            ))}
                            <td className="kp-num kp-total">{total}</td>
                            <td className="kp-notes-display">{item.notes ?? ''}</td>
                          </>
                        ) : (
                          <>
                            <td className="kp-num">{item.adultServings}</td>
                            <td className="kp-num">{item.youthServings}</td>
                            <td className="kp-num">{item.kidServings}</td>
                            <td className="kp-num">{item.codeServings}</td>
                            <td className="kp-num kp-total">{total}</td>
                          </>
                        )}
                        <td className="kp-notes-display">{item.notes ?? ''}</td>
                        <td className="kp-actions-cell">
                          <div className="action-btns">
                          {isEditingServings ? (
                            <>
                              <button
                                type="button"
                                className="kp-edit-btn"
                                disabled={isSavingServings}
                                onClick={() => handleSaveServings(item.kitchenPrepListItemId)}
                                title="Save"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                className="kp-edit-btn"
                                onClick={() => { setEditingServingsId(null); setEditingServingsForm(null) }}
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="kp-edit-btn"
                              onClick={() => startEditServings(item)}
                              title="Edit quantities"
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
                            onClick={() => item.autoGenerated
                              ? setPendingZeroItem(item)
                              : setPendingDeleteItemId(item.kitchenPrepListItemId)
                            }
                            title={item.autoGenerated ? 'Zero out servings' : 'Delete item'}
                          >
                            <Trash2 size={13} />
                          </button>
                          </div>
                        </td>
                      </tr>
                      {isEditingNotes && (
                        <tr className="kp-notes-editor-row">
                          <td colSpan={8}>
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
                                  onClick={() => handleSaveItemNotes(item.kitchenPrepListItemId)}
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
        )
      })}

      {showAddCustomModal && (
        <AddPrepItemModal
          eventDayId={eventDay.eventDayId}
          mealPeriods={mealPeriods}
          onClose={() => setShowAddCustomModal(false)}
          onSubmit={handleAddItem}
        />
      )}

      {showAddCatalogModal && (
        <AddFromCatalogModal
          eventDayId={eventDay.eventDayId}
          mealPeriods={mealPeriods}
          onClose={() => setShowAddCatalogModal(false)}
          onSubmit={handleAddItem}
        />
      )}

      {pendingZeroItem !== null && (
        <ConfirmModal
          title="Zero out item?"
          message={`This will set all serving quantities for "${pendingZeroItem.menuItemName}" to 0 and mark it as adjusted.`}
          confirmLabel="Zero Out"
          disabled={deletingId === pendingZeroItem.kitchenPrepListItemId}
          onConfirm={async () => {
            await handleZeroItem(pendingZeroItem)
            setPendingZeroItem(null)
          }}
          onCancel={() => setPendingZeroItem(null)}
        />
      )}

      {pendingDeleteItemId !== null && (
        <ConfirmModal
          title="Delete prep item?"
          message="This will permanently remove this item from the prep list."
          confirmLabel={deletingId === pendingDeleteItemId ? 'Deleting...' : 'Delete'}
          disabled={deletingId === pendingDeleteItemId}
          onConfirm={async () => {
            await handleDeleteItem(pendingDeleteItemId)
            setPendingDeleteItemId(null)
          }}
          onCancel={() => setPendingDeleteItemId(null)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Prep List"
          message="This will permanently delete the entire prep list and all its items for this day. This cannot be undone."
          confirmLabel="Delete Prep List"
          disabled={deletingList}
          onConfirm={handleDeletePrepList}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
