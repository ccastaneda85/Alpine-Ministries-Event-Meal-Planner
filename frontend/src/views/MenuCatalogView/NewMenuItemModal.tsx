import { useState, useEffect } from 'react'
import { X, Sandwich } from 'lucide-react'
import type { MenuItemSummary, Ingredient } from '../../types'
import { api } from '../../services/api'

interface PendingIngredient {
  ingredient: Ingredient
  adultPortion: number
  youthPortion: number
  kidPortion: number
  codePortion: number
  notes: string
}

interface Props {
  onClose: () => void
  onCreated: (item: MenuItemSummary) => void
}

export default function NewMenuItemModal({ onClose, onCreated }: Props) {
  const [itemName, setItemName] = useState('')
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [pending, setPending] = useState<PendingIngredient[]>([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [ingredientError, setIngredientError] = useState(false)
  const [showNewIngForm, setShowNewIngForm] = useState(false)
  const [newIngForm, setNewIngForm] = useState({ ingredientName: '', unitOfMeasure: '' })
  const [savingNewIng, setSavingNewIng] = useState(false)

  useEffect(() => {
    api.getAllIngredients().then(setAllIngredients).catch(console.error)
  }, [])

  const pendingIds = new Set(pending.map(p => p.ingredient.ingredientId))
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? allIngredients.filter(i => !pendingIds.has(i.ingredientId) && i.ingredientName.toLowerCase().includes(trimmed))
    : []

  function addIngredient(ing: Ingredient) {
    setPending(prev => [...prev, { ingredient: ing, adultPortion: 0, youthPortion: 0, kidPortion: 0, codePortion: 0, notes: '' }])
    setIngredientError(false)
    setQuery('')
  }

  function removeIngredient(id: number) {
    setPending(prev => prev.filter(p => p.ingredient.ingredientId !== id))
  }

  function updatePortion(id: number, field: 'adultPortion' | 'youthPortion' | 'kidPortion' | 'codePortion', value: number) {
    setPending(prev => prev.map(p => p.ingredient.ingredientId === id ? { ...p, [field]: value } : p))
  }

  function updateNotes(id: number, value: string) {
    setPending(prev => prev.map(p => p.ingredient.ingredientId === id ? { ...p, notes: value } : p))
  }

  async function handleCreateIngredient() {
    if (!newIngForm.ingredientName.trim() || !newIngForm.unitOfMeasure.trim()) return
    setSavingNewIng(true)
    try {
      const created = await api.createIngredient(newIngForm.ingredientName.trim(), newIngForm.unitOfMeasure.trim())
      setAllIngredients(prev => [...prev, created])
      setPending(prev => [...prev, { ingredient: created, adultPortion: 0, youthPortion: 0, kidPortion: 0, codePortion: 0, notes: '' }])
      setIngredientError(false)
      setNewIngForm({ ingredientName: '', unitOfMeasure: '' })
      setShowNewIngForm(false)
    } finally {
      setSavingNewIng(false)
    }
  }

  async function handleCreate() {
    if (!itemName.trim()) return
    if (pending.length === 0) {
      setIngredientError(true)
      return
    }
    setSaving(true)
    try {
      const created = await api.createMenuItem(itemName.trim())
      try {
        // Serialize writes — SQLite only allows one writer at a time.
        for (const p of pending) {
          await api.addMenuItemRecipe(
            created.menuItemId,
            p.ingredient.ingredientId,
            p.adultPortion,
            p.youthPortion,
            p.kidPortion,
            p.codePortion,
            p.notes || null,
          )
        }
      } catch (err) {
        console.error('Failed to attach some ingredients:', err)
        alert('Menu item was created, but some ingredients failed to attach. You can add them by editing the item.')
      }
      onCreated(created)
    } catch (err) {
      console.error('Failed to create menu item:', err)
      alert('Failed to create menu item. See console for details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay nim-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-xwide">
        <h2 className="modal-title modal-title--menu-item"><Sandwich size={20} /> New Menu Item</h2>

        <div className="form-group">
          <label>Item Name</label>
          <input
            autoFocus
            placeholder="e.g. Grilled Chicken"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            Recipe (Ingredients) — {pending.length}
            {ingredientError && <span className="field-error" style={{ marginLeft: 8 }}>At least one ingredient is required.</span>}
          </label>

          {pending.length > 0 ? (
            <div className="recipe-table-wrapper">
              <table className="recipe-table">
                <thead>
                  <tr>
                    <th className="recipe-col-ingredient">Ingredient</th>
                    <th className="recipe-col-unit">Unit</th>
                    <th className="recipe-col-portion">Adult</th>
                    <th className="recipe-col-portion">Youth</th>
                    <th className="recipe-col-portion">Kid</th>
                    <th className="recipe-col-portion">Code</th>
                    <th className="recipe-col-notes">Notes</th>
                    <th className="recipe-col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p.ingredient.ingredientId}>
                      <td className="recipe-col-ingredient">{p.ingredient.ingredientName}</td>
                      <td className="recipe-col-unit">{p.ingredient.unitOfMeasure}</td>
                      {(['adultPortion', 'youthPortion', 'kidPortion', 'codePortion'] as const).map(field => (
                        <td key={field} className="recipe-col-portion">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className="recipe-portion-input"
                            value={p[field]}
                            onChange={e => updatePortion(p.ingredient.ingredientId, field, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                      <td className="recipe-col-notes">
                        <input
                          type="text"
                          className="recipe-notes-input"
                          placeholder="Optional notes"
                          value={p.notes}
                          onChange={e => updateNotes(p.ingredient.ingredientId, e.target.value)}
                        />
                      </td>
                      <td className="recipe-col-actions">
                        <button type="button" className="kp-del-btn" onClick={() => removeIngredient(p.ingredient.ingredientId)} title="Remove">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state" style={{ padding: '0.75rem', textAlign: 'left' }}>No ingredients yet — add at least one below.</p>
          )}
        </div>

        <div className="form-group">
          <label>Add Ingredient</label>
          <div className="catalog-search-box">
            <input
              className="catalog-search-input"
              placeholder="Search ingredients to add..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <div className="catalog-list" style={{ maxHeight: 150 }}>
              {filtered.map(ing => (
                <button key={ing.ingredientId} type="button" className="catalog-list-item" onClick={() => addIngredient(ing)}>
                  {ing.ingredientName}
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginLeft: 4 }}>({ing.unitOfMeasure})</span>
                </button>
              ))}
            </div>
          )}
          {trimmed && filtered.length === 0 && (
            <p className="empty-state" style={{ padding: '0.4rem 0', fontSize: '0.82rem', textAlign: 'left' }}>No ingredients match.</p>
          )}
        </div>

        {showNewIngForm ? (
          <div className="nim-new-ing-form">
            <input
              autoFocus
              className="catalog-manage-input"
              style={{ flex: 2 }}
              placeholder="Ingredient name..."
              value={newIngForm.ingredientName}
              onChange={e => setNewIngForm(f => ({ ...f, ingredientName: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateIngredient()}
            />
            <input
              className="catalog-manage-input"
              style={{ flex: 1 }}
              placeholder="Unit (e.g. lbs)"
              value={newIngForm.unitOfMeasure}
              onChange={e => setNewIngForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateIngredient()}
            />
            <button type="button" className="btn-gold btn-sm" disabled={savingNewIng} onClick={handleCreateIngredient}>
              {savingNewIng ? 'Adding...' : '+ Add'}
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => setShowNewIngForm(false)}>Cancel</button>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-outline btn-sm" onClick={() => setShowNewIngForm(true)}>
              + New Ingredient
            </button>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-gold" disabled={saving || !itemName.trim()} onClick={handleCreate}>
            {saving ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
