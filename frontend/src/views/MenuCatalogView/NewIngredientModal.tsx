import { useState } from 'react'
import { Carrot } from 'lucide-react'
import type { Ingredient } from '../../types'
import { api } from '../../services/api'

interface Props {
  onClose: () => void
  onCreated: (ingredient: Ingredient) => void
}

export default function NewIngredientModal({ onClose, onCreated }: Props) {
  const [ingredientName, setIngredientName] = useState('')
  const [unitOfMeasure, setUnitOfMeasure] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ingredientName.trim() || !unitOfMeasure.trim()) return
    setSaving(true)
    try {
      const created = await api.createIngredient(ingredientName.trim(), unitOfMeasure.trim())
      onCreated(created)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <h2 className="modal-title modal-title--ingredient"><Carrot size={20} /> New Ingredient</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              autoFocus
              placeholder="e.g. Chicken Breast"
              value={ingredientName}
              onChange={e => setIngredientName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Unit of Measure</label>
            <input
              placeholder="e.g. lbs"
              value={unitOfMeasure}
              onChange={e => setUnitOfMeasure(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={saving || !ingredientName.trim() || !unitOfMeasure.trim()}>
              {saving ? 'Creating...' : 'Create Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
