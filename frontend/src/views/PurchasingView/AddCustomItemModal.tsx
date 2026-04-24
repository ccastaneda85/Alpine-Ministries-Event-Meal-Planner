import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdd: (body: { itemName: string; quantity: number; uom: string; notes: string | null; ingredientId?: number | null }) => Promise<void>
}

export default function AddCustomItemModal({ onClose, onAdd }: Props) {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState<string>('')
  const [uom, setUom] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedQty = parseFloat(quantity)
  const canSubmit = itemName.trim().length > 0 && uom.trim().length > 0 && Number.isFinite(parsedQty) && parsedQty >= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await onAdd({
        itemName: itemName.trim(),
        quantity: parsedQty,
        uom: uom.trim(),
        notes: notes.trim() ? notes.trim() : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <h2 className="modal-title"><ShoppingBasket size={20} /> Add Custom Item</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name</label>
            <input
              autoFocus
              placeholder="e.g. Paper Towels"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Quantity</label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Unit</label>
              <input
                placeholder="e.g. each, lbs, oz"
                value={uom}
                onChange={e => setUom(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <input
              placeholder="Anything the shopper should know"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="field-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={!canSubmit || saving}>
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
