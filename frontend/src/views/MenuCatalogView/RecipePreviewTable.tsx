import type { MenuItemRecipeEntry } from '../../types'

interface Props {
  recipe: MenuItemRecipeEntry[] | undefined
  loading?: boolean
}

export default function RecipePreviewTable({ recipe, loading }: Props) {
  if (loading) {
    return <p className="empty-state" style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>Loading recipe...</p>
  }
  if (!recipe || recipe.length === 0) {
    return <p className="empty-state" style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>No ingredients in this recipe.</p>
  }
  return (
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
          </tr>
        </thead>
        <tbody>
          {recipe.map(r => (
            <tr key={r.menuItemRecipeId}>
              <td className="recipe-col-ingredient">{r.ingredientName}</td>
              <td className="recipe-col-unit">{r.unitOfMeasure}</td>
              <td className="recipe-col-portion">{r.adultPortion}</td>
              <td className="recipe-col-portion">{r.youthPortion}</td>
              <td className="recipe-col-portion">{r.kidPortion}</td>
              <td className="recipe-col-portion">{r.codePortion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
