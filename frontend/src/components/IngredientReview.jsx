import { useState } from 'react';
import OfflineBanner from './OfflineBanner.jsx';

/**
 * IngredientReview — displays detected ingredients as a checklist.
 * Users can uncheck false positives and add missing items.
 * When `ingredients` is empty, shows an empty-fridge prompt with manual entry surfaced.
 */
export default function IngredientReview({ ingredients, isOnline, onFindRecipes, onRetakePhoto }) {
  const [items, setItems] = useState(() =>
    ingredients.map((ing, idx) => ({
      id: `ing-${idx}`,
      name: ing.name,
      checked: true,
      flagged: !!ing.flagged,
    })),
  );
  const [newItem, setNewItem] = useState('');

  const checkedCount = items.filter((i) => i.checked).length;
  const canProceed = isOnline && checkedCount > 0;
  const isEmpty = ingredients.length === 0 && items.length === 0;

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const addItem = (e) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      {
        id: `ing-manual-${Date.now()}`,
        name: trimmed,
        checked: true,
        flagged: false,
      },
    ]);
    setNewItem('');
  };

  const handleFindRecipes = () => {
    const selected = items.filter((i) => i.checked).map((i) => i.name);
    onFindRecipes(selected);
  };

  return (
    <main className="screen" aria-label="Review detected ingredients">
      {!isOnline && (
        <div style={{ marginBottom: '1rem' }}>
          <OfflineBanner />
        </div>
      )}

      <h1
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          marginBottom: '0.25rem',
        }}
      >
        Your Ingredients
      </h1>

      {isEmpty ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <p
            role="status"
            style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}
          >
            We found very little — try adding items manually or upload a clearer photo.
          </p>
          {onRetakePhoto && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetakePhoto}
              style={{ marginBottom: '0.5rem' }}
            >
              Retake Photo
            </button>
          )}
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          We found {items.length} item{items.length !== 1 ? 's' : ''}. Uncheck anything that looks
          wrong, or add items we missed.
        </p>
      )}

      {!isEmpty && (
        <ul
          style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}
          aria-label="Detected ingredients"
        >
          {items.map((item) => (
            <li key={item.id}>
              <label className="ingredient-item" htmlFor={item.id}>
                <input
                  id={item.id}
                  type="checkbox"
                  className="ingredient-checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  aria-label={`${item.name}${item.flagged ? ' — low confidence, please verify' : ''}`}
                />
                <span className="ingredient-name">{item.name}</span>
                {item.flagged && (
                  <span className="badge badge-warning" aria-label="Low confidence — please verify">
                    Low confidence — verify
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Add missing ingredients — always visible; prominent when fridge is empty */}
      <form onSubmit={addItem} style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label htmlFor="add-ingredient" className="form-label">
            Add a missing ingredient
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="add-ingredient"
              type="text"
              className="form-input"
              placeholder="e.g. garlic, olive oil…"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              aria-label="Type an ingredient to add"
            />
            <button
              type="submit"
              className="btn btn-secondary"
              aria-label="Add ingredient"
              disabled={!newItem.trim()}
            >
              Add
            </button>
          </div>
        </div>
      </form>

      <div style={{ position: 'sticky', bottom: '1rem' }}>
        <button
          type="button"
          className="btn btn-primary btn-full btn-lg"
          onClick={handleFindRecipes}
          disabled={!canProceed}
          aria-disabled={!canProceed}
          aria-describedby={checkedCount === 0 ? 'no-ingredients-hint' : undefined}
        >
          Find Recipes ({checkedCount} ingredient{checkedCount !== 1 ? 's' : ''})
        </button>
        {checkedCount === 0 && (
          <p
            id="no-ingredients-hint"
            style={{
              marginTop: '0.5rem',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
            role="note"
          >
            Select at least one ingredient to find recipes.
          </p>
        )}
      </div>
    </main>
  );
}
