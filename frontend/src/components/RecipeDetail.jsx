import { useState } from 'react';
import LegalDisclaimer from './LegalDisclaimer.jsx';

/** Deterministic colour — same logic as RecipeResults */
function placeholderColor(name = '') {
  const colours = [
    '#2d6a4f', '#1b4332', '#40916c', '#52b788',
    '#1d3557', '#457b9d', '#e63946', '#c77dff',
    '#f77f00', '#588157',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return colours[Math.abs(hash) % colours.length];
}

/**
 * RecipeDetail — full recipe view with ingredient checklist and numbered steps.
 * LegalDisclaimer is always rendered below the steps (AC-08).
 */
export default function RecipeDetail({ recipe, onBack }) {
  const [checkedIngredients, setCheckedIngredients] = useState({});

  if (!recipe) return null;

  const toggleIngredient = (idx) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const bgColor = placeholderColor(recipe.name);

  return (
    <main className="screen" aria-label={`Recipe: ${recipe.name}`} style={{ padding: 0 }}>
      {/* Hero placeholder */}
      <div
        style={{
          background: bgColor,
          width: '100%',
          aspectRatio: '16 / 9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        role="img"
        aria-label={recipe.imagePrompt || `Photo of ${recipe.name}`}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'var(--font-size-sm)',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {recipe.imagePrompt || recipe.name}
        </span>
      </div>

      <div style={{ padding: '1.25rem 1rem' }}>
        {/* Back link */}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          style={{ marginBottom: '1rem', paddingLeft: 0 }}
          aria-label="Back to recipe results"
        >
          ← Back to Results
        </button>

        {/* Recipe header */}
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            marginBottom: '0.75rem',
            lineHeight: 1.2,
          }}
        >
          {recipe.name}
        </h1>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            flexWrap: 'wrap',
            marginBottom: '0.875rem',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {recipe.cookTime && (
            <span aria-label={`Cook time: ${typeof recipe.cookTime === 'number' ? `${recipe.cookTime} min` : recipe.cookTime}`}>
              <strong>⏱</strong> {typeof recipe.cookTime === 'number' ? `${recipe.cookTime} min` : recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span aria-label={`Serves ${recipe.servings}`}>
              <strong>👥</strong> Serves {recipe.servings}
            </span>
          )}
        </div>

        {/* Category badges */}
        <div
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
          aria-label="Recipe categories"
        >
          {(recipe.categories || []).map((cat) => (
            <span key={cat} className="badge badge-category">
              {cat}
            </span>
          ))}
        </div>

        {/* Ingredient checklist */}
        <section aria-labelledby="ingredients-heading">
          <h2
            id="ingredients-heading"
            style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '0.875rem' }}
          >
            Ingredients
          </h2>
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
            aria-label="Ingredient checklist"
          >
            {(recipe.ingredients || []).map((ing, idx) => {
              const label = [ing.quantity, ing.unit, ing.item].filter(Boolean).join(' ');
              return (
                <li key={idx}>
                  <label
                    className="ingredient-item"
                    htmlFor={`step-ing-${idx}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      id={`step-ing-${idx}`}
                      type="checkbox"
                      className="ingredient-checkbox"
                      checked={!!checkedIngredients[idx]}
                      onChange={() => toggleIngredient(idx)}
                      aria-label={`Tick off: ${label}`}
                    />
                    <span
                      className="ingredient-name"
                      style={{
                        textDecoration: checkedIngredients[idx] ? 'line-through' : 'none',
                        color: checkedIngredients[idx]
                          ? 'var(--color-text-muted)'
                          : 'var(--color-text)',
                      }}
                    >
                      {label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Step-by-step instructions */}
        <section aria-labelledby="steps-heading">
          <h2
            id="steps-heading"
            style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '0.875rem' }}
          >
            Instructions
          </h2>
          <ol
            style={{
              paddingLeft: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {(recipe.steps || []).map((step, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: 'var(--font-size-base)',
                  lineHeight: 1.7,
                  color: 'var(--color-text)',
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Legal disclaimer — always visible, below steps (AC-08) */}
        <LegalDisclaimer />

        <div style={{ height: '1.5rem' }} />
      </div>
    </main>
  );
}
