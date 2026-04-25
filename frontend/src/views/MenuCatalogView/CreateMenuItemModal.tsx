import { useState, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { MenuItemSummary } from '../../types'
import { api } from '../../services/api'
import NewMenuItemModal from './NewMenuItemModal'

interface Props {
  onClose: () => void
}

export default function CreateMenuItemModal({ onClose }: Props) {
  const [allItems, setAllItems] = useState<MenuItemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingEditId, setSavingEditId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showNewItemModal, setShowNewItemModal] = useState(false)

  function load() {
    api.getAllMenuItems().then(items => setAllItems(items)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleItemCreated(item: MenuItemSummary) {
    setAllItems(prev => [...prev, item])
    setShowNewItemModal(false)
  }

  async function handleSaveEdit(id: number) {
    if (!editingName.trim()) return
    setSavingEditId(id)
    try {
      await api.updateMenuItem(id, editingName.trim())
      setAllItems(prev => prev.map(i => i.menuItemId === id ? { ...i, menuItemName: editingName.trim() } : i))
      setEditingId(null)
    } finally {
      setSavingEditId(null)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await api.deleteMenuItem(id)
      setAllItems(prev => prev.filter(i => i.menuItemId !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <h2 className="modal-title">Menu Items</h2>

          <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-gold btn-sm" onClick={() => setShowNewItemModal(true)}>
              + New Menu Item
            </button>
          </div>

          <div className="catalog-modal-list">
            {loading && <p className="empty-state" style={{ padding: '1rem' }}>Loading...</p>}
            {!loading && allItems.length === 0 && <p className="empty-state" style={{ padding: '1rem' }}>No menu items yet.</p>}
            {allItems.map(item => (
              <div key={item.menuItemId} className="catalog-manage-row">
                {editingId === item.menuItemId ? (
                  <>
                    <input
                      className="catalog-manage-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(item.menuItemId)}
                    />
                    <button type="button" className="kp-edit-btn" disabled={!!savingEditId} onClick={() => handleSaveEdit(item.menuItemId)} title="Save"><Check size={13} /></button>
                    <button type="button" className="kp-edit-btn" onClick={() => setEditingId(null)} title="Cancel"><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <span className="catalog-manage-name">{item.menuItemName}</span>
                    <button type="button" className="kp-edit-btn" onClick={() => { setEditingId(item.menuItemId); setEditingName(item.menuItemName) }} title="Rename"><Pencil size={13} /></button>
                    <button type="button" className="kp-del-btn" disabled={deletingId === item.menuItemId} onClick={() => handleDelete(item.menuItemId)} title="Delete"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {showNewItemModal && (
        <NewMenuItemModal
          onClose={() => setShowNewItemModal(false)}
          onCreated={handleItemCreated}
        />
      )}
    </>
  )
}
