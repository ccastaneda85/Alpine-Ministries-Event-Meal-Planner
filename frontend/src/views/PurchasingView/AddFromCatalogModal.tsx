import { useState, useEffect, useMemo } from 'react'
import { ShoppingBasket, X } from 'lucide-react'
import type { Ingredient } from '../../types'
import { api } from '../../services/api'

interface Props {
  onClose: () => void
  onAdd: (body: { itemName: string; quantity: number; uom: string; notes: string | null; ingredientId?: number | null }) => Promise<void>
}

export default function AddFromCatalogModal({ onClose, onAdd }: Props) {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getAllIngredients()
      .then(setAllIngredients)
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingCatalog(false))
  }, [])

  // Precompute lowercased names for fast filtering on large catalogs.
  const ingredientsLower = useMemo(
    () => allIngredients.map(i => ({ i, lower: i.ingredientName.toLowerCase() })),
    [allIngredients]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ingredientsLower
      .filter(x => x.lower.includes(q))
      .map(x => x.i)
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
      .slice(0, 50) // limit rendered rows for perf
  }, [ingredientsLower, query])

  const parsedQty = parseFloat(quantity)
  const canSubmit =
    selected !== null &&
    Number.isFinite(parsedQty) &&
    parsedQty > 0 &&
    !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selected) return
    setSaving(true)
    setError(null)
    try {
      await onAdd({
        itemName: selected.ingredientName,
        quantity: parsedQty,
        uom: selected.unitOfMeasure,
        notes: notes.trim() ? notes.trim() : null,
        ingredientId: selected.ingredientId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <h2 className="modal-title"><ShoppingBasket size={20} /> Add from Catalog</h2>

        <form onSubmit={handleSubmit}>
          {!selected ? (
            <>
              <div className="form-group">
                <label>Ingredient</label>
                <div className="catalog-search-box">
                  <input
                    autoFocus
                    className="catalog-search-input"
                    placeholder={loadingCatalog ? 'Loading catalog...' : 'Type to search ingredients...'}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    disabled={loadingCatalog}
                  />
                </div>

                {query.trim() && filtered.length === 0 && !loadingCatalog && (
                  <p className="empty-state" style={{ padding: '0.5rem 0', fontSize: '0.85rem', textAlign: 'left' }}>
                    No ingredients match "{query.trim()}".
                  </p>
                )}

                {filtered.length > 0 && (
                  <div className="catalog-list" style={{ maxHeight: 260 }}>
                    {filtered.map(ing => (
                      <button
                        key={ing.ingredientId}
                        type="button"
                        className="catalog-list-item"
                        onClick={() => { setSelected(ing); setQuery('') }}
                      >
                        {ing.ingredientName}
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.82rem', marginLeft: 6 }}>
                          ({ing.unitOfMeasure})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Ingredient</label>
                <div className="catalog-selected-row">
                  <span className="catalog-selected-name">
                    {selected.ingredientName}
                    <span className="catalog-selected-unit">({selected.unitOfMeasure})</span>
                  </span>
                  <button
                    type="button"
                    className="kp-edit-btn"
                    onClick={() => setSelected(null)}
                    title="Change ingredient"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity ({selected.unitOfMeasure})</label>
                <input
                  autoFocus
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  placeholder="Anything the shopper should know"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="field-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={!canSubmit}>
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
