/**
 * ============================================================
 * POST /api/recipes
 * ============================================================
 *
 * REQUEST
 *   Content-Type: application/json
 *   Body:
 *   {
 *     "ingredients": ["eggs", "cheddar cheese", "spinach"],   // string[], required, min 1
 *     "units": "metric" | "imperial"                          // required
 *   }
 *
 * RESPONSE — 200 OK
 *   Content-Type: application/json
 *   Body:
 *   {
 *     "recipes": [
 *       {
 *         "name":        "Spinach & Cheddar Omelette",
 *         "cookTime":    15,                          // minutes (number)
 *         "servings":    2,                           // number
 *         "categories":  ["Vegetarian", "Quick & Easy"],
 *         "ingredients": [
 *           { "item": "eggs",           "quantity": 3,    "unit": "whole" },
 *           { "item": "cheddar cheese", "quantity": 50,   "unit": "g"     }
 *         ],
 *         "steps": [
 *           "1. Beat the eggs in a bowl.",
 *           "2. Heat a non-stick pan over medium heat.",
 *           ...
 *         ],
 *         "imagePrompt": "fluffy spinach and cheddar omelette on a white plate"
 *       }
 *     ]
 *   }
 *
 *   - units = "metric"   → quantities in grams/ml/°C
 *   - units = "imperial" → quantities in oz/cups/°F
 *   - "Quick & Easy" category is auto-applied when cookTime ≤ 30
 *   - Recipes missing any required field are retried once then excluded
 *
 * ERROR RESPONSES
 *   400  { "error": "invalid_request", "message": "..." }
 *        — missing/empty ingredients array, invalid units value, non-string items
 *   503  { "error": "analysis_unavailable", "message": "Our ingredient scanner is temporarily unavailable." }
 *        — OpenAI unreachable or returned a non-200
 * ============================================================
 */

'use strict';

const express = require('express');
const { generateRecipes } = require('../services/openai');

const router = express.Router();

const VALID_UNITS = new Set(['metric', 'imperial']);

router.post('/', async (req, res) => {
  const { ingredients, units, mealType } = req.body;

  // Input validation
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'ingredients must be a non-empty array of strings.',
    });
  }

  const hasInvalidItem = ingredients.some((i) => typeof i !== 'string' || i.trim() === '');
  if (hasInvalidItem) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'All items in ingredients must be non-empty strings.',
    });
  }

  if (!VALID_UNITS.has(units)) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'units must be "metric" or "imperial".',
    });
  }

  const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'light snack', 'dessert']);
  if (mealType && !VALID_MEAL_TYPES.has(mealType)) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'mealType must be one of: breakfast, lunch, dinner, light snack, dessert.',
    });
  }

  try {
    const recipes = await generateRecipes(
      ingredients.map((i) => i.trim()),
      units,
      mealType || null
    );
    return res.json({ recipes });
  } catch (err) {
    return res.status(503).json({
      error: 'analysis_unavailable',
      message: 'Our ingredient scanner is temporarily unavailable.',
    });
  }
});

module.exports = router;
