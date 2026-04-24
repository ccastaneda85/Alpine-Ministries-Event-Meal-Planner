import { useState, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { Ingredient } from '../../types'
import { api } from '../../services/api'

interface Props {
  onClose: () => void
}

export default function CreateIngredientModal({ onClose }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ingredientName: '', unitOfMeasure: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ ingredientName: '', unitOfMeasure: '' })
  const [savingEditId, setSavingEditId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function load() {
    api.getAllIngredients().then(setIngredients).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ingredientName.trim() || !form.unitOfMeasure.trim()) return
    setSaving(true)
    try {
      await api.createIngredient(form.ingredientName.trim(), form.unitOfMeasure.trim())
      setForm({ ingredientName: '', unitOfMeasure: '' })
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(id: number) {
    if (!editForm.ingredientName.trim() || !editForm.unitOfMeasure.trim()) return
    setSavingEditId(id)
    try {
      const updated = await api.updateIngredient(id, editForm.ingredientName.trim(), editForm.unitOfMeasure.trim())
      setIngredients(prev => prev.map(i => i.ingredientId === id ? updated : i))
      setEditingId(null)
    } finally {
      setSavingEditId(null)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await api.deleteIngredient(id)
      setIngredients(prev => prev.filter(i => i.ingredientId !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Ingredients</h2>

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label>Name</label>
            <input
              placeholder="e.g. Chicken Breast"
              value={form.ingredientName}
              onChange={e => setForm(f => ({ ...f, ingredientName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Unit</label>
            <input
              placeholder="e.g. lbs"
              value={form.unitOfMeasure}
              onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-gold btn-sm" disabled={saving} style={{ marginBottom: 1 }}>
            {saving ? 'Adding...' : '+ Add'}
          </button>
        </form>

        <div className="catalog-modal-list">
          {loading && <p className="empty-state" style={{ padding: '1rem' }}>Loading...</p>}
          {!loading && ingredients.length === 0 && <p className="empty-state" style={{ padding: '1rem' }}>No ingredients yet.</p>}
          {ingredients.map(ing => (
            <div key={ing.ingredientId} className="catalog-manage-row">
              {editingId === ing.ingredientId ? (
                <>
                  <input
                    className="catalog-manage-input"
                    style={{ flex: 2 }}
                    value={editForm.ingredientName}
                    onChange={e => setEditForm(f => ({ ...f, ingredientName: e.target.value }))}
                    autoFocus
                  />
                  <input
                    className="catalog-manage-input"
                    style={{ flex: 1 }}
                    value={editForm.unitOfMeasure}
                    onChange={e => setEditForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
                  />
                  <button type="button" className="kp-edit-btn" disabled={!!savingEditId} onClick={() => handleSaveEdit(ing.ingredientId)} title="Save"><Check size={13} /></button>
                  <button type="button" className="kp-edit-btn" onClick={() => setEditingId(null)} title="Cancel"><X size={13} /></button>
                </>
              ) : (
                <>
                  <span className="catalog-manage-name">{ing.ingredientName}</span>
                  <span className="catalog-manage-unit">{ing.unitOfMeasure}</span>
                  <button type="button" className="kp-edit-btn" onClick={() => { setEditingId(ing.ingredientId); setEditForm({ ingredientName: ing.ingredientName, unitOfMeasure: ing.unitOfMeasure }) }} title="Edit"><Pencil size={13} /></button>
                  <button type="button" className="kp-del-btn" disabled={deletingId === ing.ingredientId} onClick={() => handleDelete(ing.ingredientId)} title="Delete"><Trash2 size={13} /></button>
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
  )
}
