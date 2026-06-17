/**
 * openai.js
 *
 * Centralised wrapper for all OpenAI GPT-4o calls.
 * The API key is read exclusively from process.env.OPENAI_API_KEY.
 * It is NEVER logged, returned in responses, or interpolated into strings
 * that could appear in logs.
 *
 * Network timeout: 20 seconds (per PRD non-functional requirements).
 */

'use strict';

const OpenAI = require('openai');

const OPENAI_TIMEOUT_MS = 20_000;

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set.');
    }
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT_MS,
    });
  }
  return _client;
}

// ─── Ingredient Analysis ──────────────────────────────────────────────────────

const ANALYZE_SYSTEM_PROMPT = `You are a precise kitchen inventory assistant.
Your job is to identify FOOD AND DRINK ingredients visible in a refrigerator photo.

Rules:
- Only include items that are clearly food or drink ingredients.
- Exclude ALL non-food items: cleaning products, plastic bags, tupperware, containers with no visible contents, bottles without identifiable food content, etc.
- For each ingredient, assign a confidence score between 0.00 and 1.00 reflecting how certain you are of the identification.
- If the photo is blurry, dark, or the fridge appears empty, set all confidence scores accordingly low.

Respond ONLY with a valid JSON array. No explanation text. Example format:
[
  { "name": "eggs", "confidence": 0.97 },
  { "name": "cheddar cheese", "confidence": 0.88 },
  { "name": "unknown vegetable", "confidence": 0.52 }
]`;

/**
 * Send a fridge image to GPT-4o and extract a structured ingredient list.
 *
 * The base64Image string is used inline inside the API call body and is not
 * assigned to any variable that persists after this function resolves.
 * The caller is responsible for nulling its own reference after calling this.
 *
 * @param {string} base64Image  - Base64-encoded image string (caller nulls after call)
 * @param {string} mimeType     - MIME type (e.g. "image/jpeg")
 * @param {AbortSignal} [signal] - Optional AbortSignal for AC-06 SLA enforcement
 * @returns {Promise<Array<{ name: string, confidence: number, flagged?: boolean }>>}
 * @throws Will throw on OpenAI network/API errors — caller handles HTTP 503.
 */
async function analyzeImage(base64Image, mimeType, signal) {
  const client = getClient();

  const response = await client.chat.completions.create(
    {
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: ANALYZE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                // Pass the data URI inline — no variable assignment that could
                // linger in an outer closure beyond this call's resolution.
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'List all food ingredients visible in this refrigerator photo.',
            },
          ],
        },
      ],
    },
    // Pass the AbortSignal as SDK request options so the HTTP call is cancelled
    // when the caller's AbortController fires (AC-06 15-second SLA).
    signal ? { signal } : undefined
  );

  const raw = response.choices[0]?.message?.content ?? '[]';

  let ingredients;
  try {
    // Strip potential markdown code fences GPT sometimes adds
    const cleaned = raw.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    ingredients = JSON.parse(cleaned);
  } catch {
    throw new Error('GPT-4o returned malformed JSON for ingredient analysis.');
  }

  const CONFIDENCE_THRESHOLD = 0.70;

  return ingredients.map((item) => {
    const entry = { name: item.name, confidence: item.confidence };
    if (item.confidence < CONFIDENCE_THRESHOLD) {
      entry.flagged = true;
    }
    return entry;
  });
}

// ─── Recipe Generation ────────────────────────────────────────────────────────

/**
 * Return the negative-example enforcement block for a given meal type.
 * These concrete counter-examples are far more effective than vague rules.
 *
 * @param {string} mealType
 * @returns {string}
 */
function _mealTypeNegativeExamples(mealType) {
  const examples = {
    dessert:
      'Asparagus tarts are NOT a dessert. Omelettes are NOT a dessert. ' +
      'Pasta dishes are NOT a dessert. Soups are NOT a dessert. ' +
      'ONLY generate sweet recipes — cakes, cookies, puddings, ice creams, ' +
      'tarts with sweet fillings, mousses, etc.',
    breakfast:
      'Steak dinners are NOT breakfast. Heavy pasta dishes are NOT breakfast. ' +
      'Curries are NOT breakfast. ' +
      'ONLY generate morning-appropriate dishes — eggs, pancakes, porridge, ' +
      'toast-based dishes, smoothies, granola, etc.',
    lunch:
      'Heavy 3-course dinners are NOT lunch. Elaborate dessert platters are NOT lunch. ' +
      'Full roast dinners are NOT lunch. ' +
      'ONLY generate midday-appropriate dishes — salads, sandwiches, light mains, ' +
      'soups, wraps, grain bowls, etc.',
    dinner:
      'Breakfast cereals are NOT dinner. Light snacks are NOT dinner. ' +
      'Pastries and muffins are NOT dinner. ' +
      'ONLY generate substantial evening meals — roasts, pasta mains, curries, ' +
      'grilled proteins, hearty stews, etc.',
    snack:
      'Full roast dinners are NOT snacks. Multi-course meals are NOT snacks. ' +
      'Heavy casseroles are NOT snacks. ' +
      'ONLY generate small, quick bites — dips, crackers, energy balls, ' +
      'bruschetta, small bites, trail mixes, etc.',
  };
  return examples[mealType] ?? `ONLY generate ${mealType} dishes.`;
}

/**
 * Build a system prompt that enforces the correct unit system and, when a
 * mealType is supplied, opens with a loud non-negotiable meal-type constraint
 * block before any other instruction.
 */
function buildRecipeSystemPrompt(units, mealType) {
  const unitSpec =
    units === 'imperial'
      ? 'ounces (oz), cups, tablespoons (tbsp), teaspoons (tsp), and Fahrenheit (°F)'
      : 'grams (g), millilitres (ml), and Celsius (°C)';

  const mealTypeConstraint = mealType
    ? `CRITICAL RULE #1 — NON-NEGOTIABLE: You are generating ${mealType} recipes ONLY.
Every single recipe you generate MUST be a ${mealType} dish.
If a recipe is not a ${mealType} dish, do NOT include it — discard it entirely.
${_mealTypeNegativeExamples(mealType)}
This meal-type rule overrides every other instruction in this prompt.

`
    : '';

  return `${mealTypeConstraint}You are a professional chef with 20 years of experience in home cooking.
Generate between 3 and 6 complete, practical recipes based on the ingredient list provided by the user.

Unit system: ${units}. ALL quantities and temperatures MUST use ${unitSpec}.

Quality rules — follow strictly:
- Every recipe MUST be a real, recognizable dish that people actually cook and eat. No invented or fictional food names.
- Ingredients must combine in ways that make culinary sense. Never pair ingredients that taste bad together.
- If the provided ingredients cannot form a coherent dish, use fewer of them rather than forcing a nonsensical combination.
- Assume the user has basic pantry staples available: salt, pepper, cooking oil, butter, flour, sugar, garlic, onion. You may include these in recipes even if the user did not list them.
- Steps must be specific and actionable: include heat levels (e.g. "medium-high heat"), timing (e.g. "about 3 minutes"), and visual cues (e.g. "until golden brown").
- Do NOT repeat the same base dish with minor variations. Each recipe must be meaningfully different in cooking method or cuisine style.
- Portions and quantities must be realistic for the stated number of servings.

Each recipe MUST include ALL of the following fields — never omit any:
- "name": string
- "cookTime": number (total minutes, integer)
- "servings": number (integer)
- "categories": array — include one or more of: "Dairy", "Meat", "Vegan", "Vegetarian", "Gluten-Free", "Quick & Easy"
  * Automatically include "Quick & Easy" if cookTime is 30 minutes or less.
- "ingredients": array of { "item": string, "quantity": number | string, "unit": string }
- "steps": array of strings (numbered instructions, e.g. "1. Preheat oven to 180°C.")
- "imagePrompt": string — a brief, vivid description of the finished dish for a stock photo search, e.g. "golden vegetable stir-fry in a wok"

Respond ONLY with a valid JSON array of recipe objects. No explanation text, no markdown, no preamble.`;
}

const REQUIRED_RECIPE_FIELDS = [
  'name',
  'cookTime',
  'servings',
  'categories',
  'ingredients',
  'steps',
  'imagePrompt',
];

/**
 * Check that a recipe object contains all required fields with non-empty values.
 */
function isCompleteRecipe(recipe) {
  for (const field of REQUIRED_RECIPE_FIELDS) {
    if (recipe[field] === undefined || recipe[field] === null) return false;
    if (Array.isArray(recipe[field]) && recipe[field].length === 0) return false;
    if (typeof recipe[field] === 'string' && recipe[field].trim() === '') return false;
  }
  return true;
}

/**
 * Convert temperature values embedded in recipe step strings to the requested
 * unit system. GPT-4o is non-deterministic; even with a clear system prompt
 * it may produce mixed units in natural-language step strings. This post-
 * processing pass enforces correctness.
 *
 * - imperial: replace any °C value with the °F equivalent (rounded to nearest 5°)
 * - metric:   replace any °F value with the °C equivalent (rounded to nearest 1°)
 *
 * @param {string[]} steps
 * @param {'metric'|'imperial'} units
 * @returns {string[]}
 */
function convertStepTemperatures(steps, units) {
  if (!Array.isArray(steps)) return steps;

  if (units === 'imperial') {
    // Replace °C → °F; regex captures optional decimal part to avoid silent truncation.
    return steps.map((step) =>
      step.replace(/([\d]+(?:\.\d+)?)\s*°C/g, (_match, celsius) => {
        const c = parseFloat(celsius);
        const f = (c * 9) / 5 + 32;
        // Apply nearest-5°F rounding only for oven/roasting range (> 100°C).
        // At or below 100°C (boiling water, fridge/freezer temps) use plain Math.round.
        const rounded = c > 100 ? Math.round(f / 5) * 5 : Math.round(f);
        return `${rounded}°F`;
      })
    );
  }

  if (units === 'metric') {
    // Replace °F → °C; regex captures optional decimal part to avoid silent truncation.
    return steps.map((step) =>
      step.replace(/([\d]+(?:\.\d+)?)\s*°F/g, (_match, fahrenheit) => {
        const fahr = parseFloat(fahrenheit);
        const c = ((fahr - 32) * 5) / 9;
        // Apply nearest-5°C rounding only for oven/roasting range (> 212°F).
        // At or below 212°F (boiling water, fridge/freezer temps) use plain Math.round.
        const rounded = fahr > 212 ? Math.round(c / 5) * 5 : Math.round(c);
        return `${rounded}°C`;
      })
    );
  }

  return steps;
}

/**
 * Enforce the "Quick & Easy" category rule, normalise the categories array,
 * and post-process step strings for correct temperature units (AC-09).
 *
 * @param {object} recipe
 * @param {'metric'|'imperial'} units
 * @returns {object}
 */
function normaliseRecipe(recipe, units) {
  if (recipe.cookTime <= 30 && !recipe.categories.includes('Quick & Easy')) {
    recipe.categories = [...recipe.categories, 'Quick & Easy'];
  }
  // Post-process step strings to enforce unit consistency (AC-09).
  recipe.steps = convertStepTemperatures(recipe.steps, units);
  return recipe;
}

/**
 * Call GPT-4o once and return parsed recipe array (raw, no validation).
 *
 * @param {OpenAI} client
 * @param {string[]} ingredients
 * @param {'metric'|'imperial'} units
 * @param {number} [count] - When provided, request exactly this many recipes
 *   (used during retry to generate only the missing replacements).
 */
async function _callRecipeGeneration(client, ingredients, units, count, mealType) {
  const countInstruction = count
    ? `Generate exactly ${count} recipe${count === 1 ? '' : 's'}`
    : 'Generate between 3 and 6 recipes';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: buildRecipeSystemPrompt(units, mealType),
      },
      {
        role: 'user',
        content: `${countInstruction} using these fridge ingredients: ${ingredients.join(', ')}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '[]';
  const cleaned = raw.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Generate 3–6 recipes from a list of ingredients.
 *
 * Per PRD: if GPT-4o returns a recipe missing a required field, retry the
 * generation once. If the retry also fails validation, exclude that recipe.
 * Never return an incomplete recipe.
 *
 * @param {string[]} ingredients
 * @param {'metric'|'imperial'} units
 * @returns {Promise<Array>}
 */
async function generateRecipes(ingredients, units, mealType) {
  const client = getClient();

  let firstPassRecipes;
  try {
    firstPassRecipes = await _callRecipeGeneration(client, ingredients, units, undefined, mealType);
  } catch (err) {
    throw err; // surface as 503 upstream
  }

  // Separate valid from invalid recipes
  const validRecipes = [];
  const invalidIndexes = [];

  for (let i = 0; i < firstPassRecipes.length; i++) {
    if (isCompleteRecipe(firstPassRecipes[i])) {
      validRecipes.push(normaliseRecipe(firstPassRecipes[i], units));
    } else {
      invalidIndexes.push(i);
    }
  }

  // If any recipes were invalid, retry for exactly the missing count only.
  // Ask GPT-4o to generate `invalidCount` replacement recipes rather than a
  // full batch — this prevents mixing a full retry batch with first-pass
  // results and yielding 6+ recipes or semantic duplicates.
  const invalidCount = invalidIndexes.length;
  if (invalidCount > 0) {
    try {
      const retryRecipes = await _callRecipeGeneration(
        client,
        ingredients,
        units,
        invalidCount,
        mealType
      );
      for (const recipe of retryRecipes) {
        if (isCompleteRecipe(recipe)) {
          const alreadyHave = validRecipes.some(
            (r) => r.name.toLowerCase() === recipe.name.toLowerCase()
          );
          if (!alreadyHave) {
            validRecipes.push(normaliseRecipe(recipe, units));
          }
        }
        // Still invalid after retry → excluded per PRD
      }
    } catch {
      // Retry itself failed — return what we have from the first pass
    }
  }

  // Cap the final set at 6 recipes as per PRD (3–6 range).
  return validRecipes.slice(0, 6);
}

module.exports = { analyzeImage, generateRecipes, convertStepTemperatures };
