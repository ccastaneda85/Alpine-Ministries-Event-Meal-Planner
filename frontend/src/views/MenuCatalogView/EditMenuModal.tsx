import { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import type { MenuWithItems, MenuItemSummary, MenuItemRecipeEntry } from '../../types'
import { api } from '../../services/api'
import NewMenuItemModal from './NewMenuItemModal'
import RecipePreviewTable from './RecipePreviewTable'

interface Props {
  menu: MenuWithItems
  onClose: () => void
  onSaved: (updated: MenuWithItems) => void
  onDeleted: (menuId: number) => void
}

export default function EditMenuModal({ menu, onClose, onSaved, onDeleted }: Props) {
  const [menuName, setMenuName] = useState(menu.menuName)
  const [items, setItems] = useState<MenuItemSummary[]>(menu.items)
  const [savingName, setSavingName] = useState(false)
  const [nameDirty, setNameDirty] = useState(false)

  const [allItems, setAllItems] = useState<MenuItemSummary[]>([])
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [recipes, setRecipes] = useState<Record<number, MenuItemRecipeEntry[]>>({})
  const [loadingRecipeIds, setLoadingRecipeIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.getAllMenuItems().then(setAllItems).catch(console.error)
  }, [])

  // Load recipes for all currently-attached items on mount.
  useEffect(() => {
    let cancelled = false
    Promise.all(menu.items.map(async item => {
      try {
        const recipe = await api.getMenuItemRecipes(item.menuItemId)
        return [item.menuItemId, recipe] as const
      } catch (err) {
        console.error('Failed to load recipe for item', item.menuItemId, err)
        return [item.menuItemId, [] as MenuItemRecipeEntry[]] as const
      }
    })).then(entries => {
      if (cancelled) return
      setRecipes(Object.fromEntries(entries))
    })
    return () => { cancelled = true }
  }, [menu.menuId])

  async function fetchRecipeFor(menuItemId: number) {
    setLoadingRecipeIds(prev => new Set(prev).add(menuItemId))
    try {
      const recipe = await api.getMenuItemRecipes(menuItemId)
      setRecipes(prev => ({ ...prev, [menuItemId]: recipe }))
    } catch (err) {
      console.error('Failed to load recipe for item', menuItemId, err)
    } finally {
      setLoadingRecipeIds(prev => {
        const next = new Set(prev)
        next.delete(menuItemId)
        return next
      })
    }
  }

  const trimmed = query.trim().toLowerCase()
  const itemIds = new Set(items.map(i => i.menuItemId))
  const filtered = trimmed
    ? allItems.filter(i => !itemIds.has(i.menuItemId) && i.menuItemName.toLowerCase().includes(trimmed))
    : []

  async function handleSaveName() {
    if (!menuName.trim()) return
    setSavingName(true)
    try {
      const updated = await api.updateMenu(menu.menuId, menuName.trim())
      setNameDirty(false)
      onSaved({ ...menu, menuName: updated.menuName, items })
    } finally {
      setSavingName(false)
    }
  }

  async function handleAddItem(item: MenuItemSummary) {
    setAddingId(item.menuItemId)
    try {
      await api.addMenuEntry(menu.menuId, item.menuItemId)
      const refreshed = await api.getMenuItems(menu.menuId)
      setItems(refreshed)
      onSaved({ menuId: menu.menuId, menuName, items: refreshed })
      fetchRecipeFor(item.menuItemId)
    } finally {
      setAddingId(null)
      setQuery('')
    }
  }

  async function handleRemoveItem(item: MenuItemSummary) {
    setRemovingId(item.menuItemId)
    try {
      const entries = await api.getMenuEntriesByMenu(menu.menuId)
      const entry = entries.find(e => e.menuItemId === item.menuItemId)
      if (entry) await api.removeMenuEntry(entry.menuEntryId)
      const refreshed = await api.getMenuItems(menu.menuId)
      setItems(refreshed)
      onSaved({ menuId: menu.menuId, menuName, items: refreshed })
      setRecipes(prev => {
        const next = { ...prev }
        delete next[item.menuItemId]
        return next
      })
    } finally {
      setRemovingId(null)
    }
  }

  async function handleNewItemCreated(item: MenuItemSummary) {
    setAllItems(prev => [...prev, item])
    try {
      await api.addMenuEntry(menu.menuId, item.menuItemId)
      const refreshed = await api.getMenuItems(menu.menuId)
      setItems(refreshed)
      onSaved({ menuId: menu.menuId, menuName, items: refreshed })
      fetchRecipeFor(item.menuItemId)
    } finally {
      setShowNewItemModal(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.deleteMenu(menu.menuId)
      onDeleted(menu.menuId)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-wide">
        <h2 className="modal-title modal-title--menu"><BookOpen size={20} /> Edit Menu</h2>

        {/* Name */}
        <div className="form-group">
          <label>Menu Name</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={menuName}
              onChange={e => { setMenuName(e.target.value); setNameDirty(true) }}
              style={{ flex: 1 }}
            />
            {nameDirty && (
              <button type="button" className="btn-gold btn-sm" disabled={savingName} onClick={handleSaveName}>
                {savingName ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Current items */}
        <div className="form-group">
          <label>Menu Items ({items.length})</label>
          {items.length === 0 ? (
            <p className="empty-state" style={{ padding: '0.75rem', textAlign: 'left' }}>No items yet.</p>
          ) : (
            <div className="menu-items-list">
              {items.map(item => (
                <div key={item.menuItemId} className="menu-items-card">
                  <div className="menu-items-card-header">
                    <span className="menu-items-card-title">{item.menuItemName}</span>
                    <button
                      type="button"
                      className="kp-del-btn"
                      disabled={removingId === item.menuItemId}
                      onClick={() => handleRemoveItem(item)}
                      title="Remove from menu"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <RecipePreviewTable
                    recipe={recipes[item.menuItemId]}
                    loading={loadingRecipeIds.has(item.menuItemId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add item search */}
        <div className="form-group">
          <label>Add Item</label>
          <div className="catalog-search-box">
            <input
              className="catalog-search-input"
              placeholder="Search menu items to add..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <div className="catalog-list" style={{ maxHeight: 160 }}>
              {filtered.map(item => (
                <button
                  key={item.menuItemId}
                  type="button"
                  className="catalog-list-item"
                  disabled={addingId === item.menuItemId}
                  onClick={() => handleAddItem(item)}
                >
                  {addingId === item.menuItemId ? 'Adding...' : item.menuItemName}
                </button>
              ))}
            </div>
          )}
          {trimmed && filtered.length === 0 && (
            <p className="empty-state" style={{ padding: '0.5rem 0', textAlign: 'left', fontSize: '0.82rem' }}>No unassigned items match.</p>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button type="button" className="btn-outline btn-sm" onClick={() => setShowNewItemModal(true)}>
            + New Menu Item
          </button>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#9a1f1f' }}>Delete this menu?</span>
              <button type="button" className="btn-danger btn-sm" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete Menu</button>
          )}
          <button type="button" className="btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>

    {showNewItemModal && (
      <NewMenuItemModal
        onClose={() => setShowNewItemModal(false)}
        onCreated={handleNewItemCreated}
      />
    )}
    </>
  )
}
