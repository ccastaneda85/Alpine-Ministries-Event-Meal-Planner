import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Check, X, BookOpen, Sandwich, Carrot, UtensilsCrossed } from 'lucide-react'
import type { MenuWithItems, MenuItemSummary, Ingredient } from '../types'
import { api } from '../services/api'
import { useBreadcrumb } from '../components/layout/BreadcrumbContext'
import EditMenuModal from './MenuCatalogView/EditMenuModal'
import CreateMenuModal from './MenuCatalogView/CreateMenuModal'
import NewMenuItemModal from './MenuCatalogView/NewMenuItemModal'
import EditMenuItemModal from './MenuCatalogView/EditMenuItemModal'
import NewIngredientModal from './MenuCatalogView/NewIngredientModal'

type CatalogTab = 'menus' | 'items' | 'ingredients'

function extractApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/^\d+:\s*(.*)$/s)
  return match ? match[1] : raw
}

export default function MenuCatalogView() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('menus')
  useBreadcrumb(['Menu Catalog', activeTab === 'menus' ? 'Menus' : activeTab === 'items' ? 'Menu Items' : 'Ingredients'])

  // ── Menus ──
  const [menus, setMenus] = useState<MenuWithItems[]>([])
  const [loadingMenus, setLoadingMenus] = useState(true)
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuWithItems | null>(null)

  // ── Menu Items ──
  const [menuItems, setMenuItems] = useState<MenuItemSummary[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [itemsLoaded, setItemsLoaded] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemSummary | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<number | null>(null)
  const [showNewItemModal, setShowNewItemModal] = useState(false)

  // ── Ingredients ──
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false)
  const [showNewIngredientModal, setShowNewIngredientModal] = useState(false)
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [editingIngId, setEditingIngId] = useState<number | null>(null)
  const [editingIngForm, setEditingIngForm] = useState({ ingredientName: '', unitOfMeasure: '' })
  const [savingIngEditId, setSavingIngEditId] = useState<number | null>(null)
  const [confirmSaveIngId, setConfirmSaveIngId] = useState<number | null>(null)
  const [deletingIngId, setDeletingIngId] = useState<number | null>(null)
  const [confirmDeleteIngId, setConfirmDeleteIngId] = useState<number | null>(null)

  // ── Shared error banner (for 409s, etc.) ──
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!errorMessage) return
    const t = setTimeout(() => setErrorMessage(null), 8000)
    return () => clearTimeout(t)
  }, [errorMessage])

  // ── Load ──
  async function loadMenus() {
    setLoadingMenus(true)
    try {
      const allMenus = await api.getAllMenus()
      const withItems = await Promise.all(
        allMenus.map(async m => ({
          menuId: m.menuId,
          menuName: m.menuName,
          items: await api.getMenuItems(m.menuId),
        }))
      )
      setMenus(withItems)
    } finally {
      setLoadingMenus(false)
    }
  }

  async function loadItems() {
    if (!itemsLoaded) setLoadingItems(true)
    try {
      const items = await api.getAllMenuItems()
      setMenuItems(items)
      setItemsLoaded(true)
    } finally {
      setLoadingItems(false)
    }
  }

  async function loadIngredients() {
    if (!ingredientsLoaded) setLoadingIngredients(true)
    try {
      const ings = await api.getAllIngredients()
      setIngredients(ings)
      setIngredientsLoaded(true)
    } finally {
      setLoadingIngredients(false)
    }
  }

  useEffect(() => { loadMenus() }, [])

  function handleTabChange(tab: CatalogTab) {
    setActiveTab(tab)
    if (tab === 'items') loadItems()
    if (tab === 'ingredients') loadIngredients()
  }

  // ── Menus handlers ──
  function handleMenuCreated(menu: MenuWithItems) {
    setMenus(prev => [...prev, menu])
    setShowCreateMenuModal(false)
  }

  function handleMenuSaved(updated: MenuWithItems) {
    setMenus(prev => prev.map(m => m.menuId === updated.menuId ? updated : m))
  }

  function handleMenuDeleted(menuId: number) {
    setMenus(prev => prev.filter(m => m.menuId !== menuId))
  }

  // ── Menu Items handlers ──
  function handleItemCreated() {
    setShowNewItemModal(false)
    loadItems()
  }

  function handleItemSaved(updated: MenuItemSummary) {
    setMenuItems(prev => prev.map(i => i.menuItemId === updated.menuItemId ? updated : i))
    setEditingItem(null)
  }

  async function handleDeleteItem(id: number) {
    setDeletingItemId(id)
    try {
      await api.deleteMenuItem(id)
      setMenuItems(prev => prev.filter(i => i.menuItemId !== id))
      setConfirmDeleteItemId(null)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
      setConfirmDeleteItemId(null)
    } finally {
      setDeletingItemId(null)
    }
  }

  // ── Ingredients handlers ──
  function handleIngredientCreated(ing: Ingredient) {
    setIngredients(prev => [...prev, ing])
    setShowNewIngredientModal(false)
  }

  async function handleSaveIngEdit(id: number) {
    if (!editingIngForm.ingredientName.trim() || !editingIngForm.unitOfMeasure.trim()) return
    setSavingIngEditId(id)
    try {
      const updated = await api.updateIngredient(id, editingIngForm.ingredientName.trim(), editingIngForm.unitOfMeasure.trim())
      setIngredients(prev => prev.map(i => i.ingredientId === id ? updated : i))
      setEditingIngId(null)
      setConfirmSaveIngId(null)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
      setConfirmSaveIngId(null)
      // Stay in edit mode so the user can revise or cancel their changes.
    } finally {
      setSavingIngEditId(null)
    }
  }

  async function handleDeleteIngredient(id: number) {
    setDeletingIngId(id)
    try {
      await api.deleteIngredient(id)
      setIngredients(prev => prev.filter(i => i.ingredientId !== id))
      setConfirmDeleteIngId(null)
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err))
      setConfirmDeleteIngId(null)
    } finally {
      setDeletingIngId(null)
    }
  }

  // ── Sorted lists ──
  const sortedItems = useMemo(
    () => [...menuItems].sort((a, b) => a.menuItemName.localeCompare(b.menuItemName)),
    [menuItems]
  )

  // Precompute lowercased names once so the filter doesn't do it on every keystroke.
  const ingredientsLower = useMemo(
    () => ingredients.map(i => ({ i, lower: i.ingredientName.toLowerCase() })),
    [ingredients]
  )

  const sortedIngredients = useMemo(() => {
    const q = ingredientQuery.trim().toLowerCase()
    if (!q) return []
    return ingredientsLower
      .filter(x => x.lower.includes(q))
      .map(x => x.i)
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
  }, [ingredientsLower, ingredientQuery])

  return (
    <div className="catalog-view">
      <div className="catalog-builder-panel">
      {/* Tab bar */}
      <div className="catalog-tabs">
        <button
          type="button"
          className={`catalog-tab${activeTab === 'menus' ? ' active' : ''}`}
          onClick={() => handleTabChange('menus')}
        >
          <BookOpen size={16} /> Menus
        </button>
        <button
          type="button"
          className={`catalog-tab${activeTab === 'items' ? ' active' : ''}`}
          onClick={() => handleTabChange('items')}
        >
          <Sandwich size={16} /> Menu Items
        </button>
        <button
          type="button"
          className={`catalog-tab${activeTab === 'ingredients' ? ' active' : ''}`}
          onClick={() => handleTabChange('ingredients')}
        >
          <Carrot size={16} /> Ingredients
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

      {/* ── Menus Tab ── */}
      {activeTab === 'menus' && (
        <>
          <div className="catalog-toolbar">
            <button type="button" className="btn-gold btn-sm" onClick={() => setShowCreateMenuModal(true)}>
              <Plus size={14} /> New Menu
            </button>
          </div>

          {loadingMenus ? (
            <p className="empty-state">Loading menus...</p>
          ) : menus.length === 0 ? (
            <p className="empty-state">No menus yet. Create one to get started.</p>
          ) : (
            <div className="catalog-grid">
              {menus.map(menu => (
                <div key={menu.menuId} className="catalog-menu-card">
                  <div className="catalog-card-header">
                    <UtensilsCrossed size={15} className="catalog-card-icon" />
                    <span className="catalog-card-title">{menu.menuName}</span>
                  </div>
                  <div className="catalog-card-items">
                    {menu.items.length === 0 ? (
                      <span className="catalog-card-empty">No items added yet.</span>
                    ) : (
                      menu.items.map(item => (
                        <div key={item.menuItemId} className="catalog-card-item">
                          {item.menuItemName}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="catalog-card-footer">
                    <button
                      type="button"
                      className="catalog-card-edit-btn"
                      onClick={() => setEditingMenu(menu)}
                    >
                      <Pencil size={13} /> Edit Menu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Menu Items Tab ── */}
      {activeTab === 'items' && (
        <>
          <div className="catalog-toolbar">
            <button type="button" className="btn-gold btn-sm" onClick={() => setShowNewItemModal(true)}>
              <Plus size={14} /> New Menu Item
            </button>
          </div>

          {loadingItems ? (
            <p className="empty-state">Loading menu items...</p>
          ) : sortedItems.length === 0 ? (
            <p className="empty-state">No menu items yet.</p>
          ) : (
            <div className="catalog-list-cards">
              {sortedItems.map(item => (
                <div key={item.menuItemId} className={`catalog-list-card${confirmDeleteItemId === item.menuItemId ? ' catalog-list-card--danger' : ''}`}>
                  {confirmDeleteItemId === item.menuItemId ? (
                    <>
                      <span className="catalog-list-card-name catalog-confirm-text">Delete "{item.menuItemName}"?</span>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        disabled={deletingItemId === item.menuItemId}
                        onClick={() => handleDeleteItem(item.menuItemId)}
                      >
                        {deletingItemId === item.menuItemId ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => setConfirmDeleteItemId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="catalog-list-card-name">{item.menuItemName}</span>
                      <button type="button" className="kp-edit-btn" onClick={() => setEditingItem(item)} title="Edit"><Pencil size={14} /></button>
                      <button type="button" className="kp-del-btn" onClick={() => setConfirmDeleteItemId(item.menuItemId)} title="Delete"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Ingredients Tab ── */}
      {activeTab === 'ingredients' && (
        <>
          <div className="catalog-toolbar">
            <button type="button" className="btn-gold btn-sm" onClick={() => setShowNewIngredientModal(true)}>
              <Plus size={14} /> New Ingredient
            </button>
          </div>

          <div className="catalog-search-box">
            <input
              className="catalog-search-input"
              placeholder="Filter ingredients..."
              value={ingredientQuery}
              onChange={e => setIngredientQuery(e.target.value)}
            />
          </div>

          {loadingIngredients ? (
            <p className="empty-state">Loading ingredients...</p>
          ) : ingredients.length === 0 ? (
            <p className="empty-state">No ingredients yet.</p>
          ) : !ingredientQuery.trim() ? (
            <p className="empty-state">Start typing to search ingredients ({ingredients.length} total).</p>
          ) : sortedIngredients.length === 0 ? (
            <p className="empty-state">No ingredients match "{ingredientQuery}".</p>
          ) : (
            <div className="catalog-list-cards">
              {sortedIngredients.map(ing => (
                <div key={ing.ingredientId} className={`catalog-list-card${confirmDeleteIngId === ing.ingredientId ? ' catalog-list-card--danger' : ''}`}>
                  {confirmDeleteIngId === ing.ingredientId ? (
                    <>
                      <span className="catalog-list-card-name catalog-confirm-text">Delete "{ing.ingredientName}"?</span>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        disabled={deletingIngId === ing.ingredientId}
                        onClick={() => handleDeleteIngredient(ing.ingredientId)}
                      >
                        {deletingIngId === ing.ingredientId ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => setConfirmDeleteIngId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : confirmSaveIngId === ing.ingredientId ? (
                    <>
                      <span className="catalog-list-card-name">
                        Save changes to "{ing.ingredientName}" → "{editingIngForm.ingredientName}" ({editingIngForm.unitOfMeasure})?
                      </span>
                      <button
                        type="button"
                        className="btn-gold btn-sm"
                        disabled={savingIngEditId === ing.ingredientId}
                        onClick={() => handleSaveIngEdit(ing.ingredientId)}
                      >
                        {savingIngEditId === ing.ingredientId ? 'Saving...' : 'Confirm Save'}
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => setConfirmSaveIngId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : editingIngId === ing.ingredientId ? (
                    <>
                      <input
                        className="catalog-list-card-input"
                        style={{ flex: 2 }}
                        value={editingIngForm.ingredientName}
                        onChange={e => setEditingIngForm(f => ({ ...f, ingredientName: e.target.value }))}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && setConfirmSaveIngId(ing.ingredientId)}
                      />
                      <input
                        className="catalog-list-card-input"
                        style={{ flex: 1, maxWidth: 100 }}
                        value={editingIngForm.unitOfMeasure}
                        onChange={e => setEditingIngForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && setConfirmSaveIngId(ing.ingredientId)}
                      />
                      <button type="button" className="kp-edit-btn" onClick={() => setConfirmSaveIngId(ing.ingredientId)} title="Save"><Check size={14} /></button>
                      <button type="button" className="kp-edit-btn" onClick={() => setEditingIngId(null)} title="Cancel"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <div className="catalog-list-card-info">
                        <span className="catalog-list-card-name">{ing.ingredientName}</span>
                        <span className="catalog-list-card-unit">{ing.unitOfMeasure}</span>
                      </div>
                      <button type="button" className="kp-edit-btn" onClick={() => { setEditingIngId(ing.ingredientId); setEditingIngForm({ ingredientName: ing.ingredientName, unitOfMeasure: ing.unitOfMeasure }) }} title="Edit"><Pencil size={14} /></button>
                      <button type="button" className="kp-del-btn" onClick={() => setConfirmDeleteIngId(ing.ingredientId)} title="Delete"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      </div>{/* end catalog-builder-panel */}

      {/* Modals */}
      {showCreateMenuModal && (
        <CreateMenuModal
          onClose={() => setShowCreateMenuModal(false)}
          onCreated={handleMenuCreated}
        />
      )}

      {editingMenu && (
        <EditMenuModal
          menu={editingMenu}
          onClose={() => setEditingMenu(null)}
          onSaved={updated => { handleMenuSaved(updated); setEditingMenu(updated) }}
          onDeleted={handleMenuDeleted}
        />
      )}

      {showNewItemModal && (
        <NewMenuItemModal
          onClose={() => { setShowNewItemModal(false); loadItems() }}
          onCreated={handleItemCreated}
        />
      )}

      {editingItem && (
        <EditMenuItemModal
          menuItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleItemSaved}
        />
      )}

      {showNewIngredientModal && (
        <NewIngredientModal
          onClose={() => setShowNewIngredientModal(false)}
          onCreated={handleIngredientCreated}
        />
      )}
    </div>
  )
}
