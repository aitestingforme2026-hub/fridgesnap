/**
 * FridgeSnap API client
 * All calls go through the local proxy — no API keys in client code.
 */

const BASE_URL = '/api';

/**
 * Analyze a fridge image for ingredients.
 * @param {File} imageFile
 * @returns {Promise<{ ingredients: Array<{ name: string, confidence: number, flagged?: boolean }> }>}
 */
export async function analyzeImage(imageFile) {
  const form = new FormData();
  form.append('image', imageFile);

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    body: form,
  });

  if (res.status === 503) {
    throw new Error('SERVICE_UNAVAILABLE');
  }
  if (!res.ok) {
    throw new Error(`ANALYZE_ERROR_${res.status}`);
  }

  return res.json();
}

/**
 * Generate recipes from a list of ingredients.
 * @param {string[]} ingredients
 * @param {'metric' | 'imperial'} units
 * @returns {Promise<{ recipes: Array }>}
 */
export async function fetchRecipes(ingredients, units) {
  const res = await fetch(`${BASE_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, units }),
  });

  if (res.status === 503) {
    throw new Error('SERVICE_UNAVAILABLE');
  }
  if (!res.ok) {
    throw new Error(`RECIPES_ERROR_${res.status}`);
  }

  return res.json();
}
