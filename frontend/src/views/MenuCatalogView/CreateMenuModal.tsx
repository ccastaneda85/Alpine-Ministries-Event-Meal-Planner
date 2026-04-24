import { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import type { MenuWithItems, MenuItemSummary, MenuItemRecipeEntry } from '../../types'
import { api } from '../../services/api'
import NewMenuItemModal from './NewMenuItemModal'
import RecipePreviewTable from './RecipePreviewTable'

interface Props {
  onClose: () => void
  onCreated: (menu: MenuWithItems) => void
}

export default function CreateMenuModal({ onClose, onCreated }: Props) {
  const [menuName, setMenuName] = useState('')
  const [allItems, setAllItems] = useState<MenuItemSummary[]>([])
  const [selectedItems, setSelectedItems] = useState<MenuItemSummary[]>([])
  const [recipes, setRecipes] = useState<Record<number, MenuItemRecipeEntry[]>>({})
  const [loadingRecipeIds, setLoadingRecipeIds] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewItemModal, setShowNewItemModal] = useState(false)

  useEffect(() => {
    api.getAllMenuItems().then(setAllItems).catch(console.error)
  }, [])

  const selectedIds = new Set(selectedItems.map(i => i.menuItemId))
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? allItems.filter(i => !selectedIds.has(i.menuItemId) && i.menuItemName.toLowerCase().includes(trimmed))
    : []

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

  function addItem(item: MenuItemSummary) {
    setSelectedItems(prev => [...prev, item])
    setQuery('')
    fetchRecipeFor(item.menuItemId)
  }

  function removeItem(id: number) {
    setSelectedItems(prev => prev.filter(i => i.menuItemId !== id))
    setRecipes(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function handleNewItemCreated(item: MenuItemSummary) {
    setAllItems(prev => [...prev, item])
    setSelectedItems(prev => [...prev, item])
    setShowNewItemModal(false)
    fetchRecipeFor(item.menuItemId)
  }

  async function handleCreate() {
    if (!menuName.trim()) return
    setSaving(true)
    try {
      const menu = await api.createMenu(menuName.trim())
      // Serialize writes — SQLite only allows one writer at a time.
      for (const item of selectedItems) {
        await api.addMenuEntry(menu.menuId, item.menuItemId)
      }
      onCreated({ menuId: menu.menuId, menuName: menu.menuName, items: selectedItems })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box modal-box-wide">
          <h2 className="modal-title modal-title--menu"><BookOpen size={20} /> Create New Menu</h2>

          <div className="form-group">
            <label>Menu Name</label>
            <input
              autoFocus
              placeholder="e.g. Breakfast Buffet"
              value={menuName}
              onChange={e => setMenuName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !saving && handleCreate()}
            />
          </div>

          <div className="form-group">
            <label>Menu Items ({selectedItems.length})</label>

            {selectedItems.length > 0 && (
              <div className="menu-items-list">
                {selectedItems.map(item => (
                  <div key={item.menuItemId} className="menu-items-card">
                    <div className="menu-items-card-header">
                      <span className="menu-items-card-title">{item.menuItemName}</span>
                      <button type="button" className="kp-del-btn" onClick={() => removeItem(item.menuItemId)} title="Remove">
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

            <div className="catalog-search-box" style={{ marginTop: selectedItems.length > 0 ? 12 : 0 }}>
              <input
                className="catalog-search-input"
                placeholder="Search existing items to add..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            {filtered.length > 0 && (
              <div className="catalog-list" style={{ maxHeight: 140 }}>
                {filtered.map(item => (
                  <button key={item.menuItemId} type="button" className="catalog-list-item" onClick={() => addItem(item)}>
                    {item.menuItemName}
                  </button>
                ))}
              </div>
            )}
            {trimmed && filtered.length === 0 && (
              <p className="empty-state" style={{ padding: '0.4rem 0', fontSize: '0.82rem', textAlign: 'left' }}>No unassigned items match.</p>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <button type="button" className="btn-outline btn-sm" onClick={() => setShowNewItemModal(true)}>
              + New Menu Item
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-gold" disabled={saving || !menuName.trim()} onClick={handleCreate}>
              {saving ? 'Creating...' : 'Create Menu'}
            </button>
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
