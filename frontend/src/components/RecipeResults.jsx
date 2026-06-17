import { useState } from 'react';
import FilterBar from './FilterBar.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import V1_RecipeImage from './V1_RecipeImage.jsx';

/**
 * RecipeResults — grid of recipe cards with client-side category filtering.
 */
export default function RecipeResults({ recipes, isOnline, onSelectRecipe, onBack, onBackToIngredients }) {
  const [activeFilters, setActiveFilters] = useState([]);

  const toggleFilter = (filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
  };

  const visibleRecipes =
    activeFilters.length === 0
      ? recipes
      : recipes.filter((r) =>
          activeFilters.every((f) => {
            const cats = (r.categories || []).map((c) => c.toLowerCase());
            // normalise "quick and easy" / "quick & easy"
            const normalised = f.toLowerCase().replace('&', 'and');
            return cats.some((c) => c.replace('&', 'and') === normalised);
          }),
        );

  return (
    <main className="screen" aria-label="Recipe results">
      {!isOnline && (
        <div style={{ marginBottom: '1rem' }}>
          <OfflineBanner />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
          Recipes for You
        </h1>
        <button type="button" className="btn btn-ghost" onClick={onBack} aria-label="Start over">
          ← Redo
        </button>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
      </div>

      {visibleRecipes.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {recipes.length === 0 ? (
            <>
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem' }}>
                We couldn&apos;t find recipes for these ingredients. Try adding a few more items.
              </p>
              {onBackToIngredients && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onBackToIngredients}
                  style={{ marginTop: '1rem' }}
                >
                  Back to Ingredients
                </button>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem' }}>
                No recipes match your filters — try removing one.
              </p>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveFilters([])}
                  style={{ marginTop: '1rem' }}
                >
                  Clear all filters
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
          aria-label={`${visibleRecipes.length} recipe${visibleRecipes.length !== 1 ? 's' : ''} found`}
        >
          {visibleRecipes.map((recipe, idx) => {
            return (
              <li key={recipe.name + idx}>
                <article className="card">
                  <V1_RecipeImage imagePrompt={recipe.imagePrompt} recipeName={recipe.name} />

                  <div style={{ padding: '1rem' }}>
                    <h2
                      style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {recipe.name}
                    </h2>

                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {(recipe.categories || []).map((cat) => (
                        <span key={cat} className="badge badge-category">
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '1rem',
                      }}
                    >
                      {recipe.cookTime && (
                        <span aria-label={`Cook time: ${typeof recipe.cookTime === 'number' ? `${recipe.cookTime} min` : recipe.cookTime}`}>
                          ⏱ {typeof recipe.cookTime === 'number' ? `${recipe.cookTime} min` : recipe.cookTime}
                        </span>
                      )}
                      {recipe.servings && (
                        <span aria-label={`Serves ${recipe.servings}`}>
                          👥 Serves {recipe.servings}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-full"
                      onClick={() => onSelectRecipe(recipe)}
                      aria-label={`View recipe: ${recipe.name}`}
                    >
                      View Recipe
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
