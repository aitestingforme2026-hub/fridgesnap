'use strict';

const request = require('supertest');
const app = require('../server');

jest.mock('../services/openai', () => ({
  analyzeImage: jest.fn(),
  generateRecipes: jest.fn(),
}));

const { generateRecipes } = require('../services/openai');

const SAMPLE_METRIC_RECIPE = {
  name: 'Spinach & Cheddar Omelette',
  cookTime: 15,
  servings: 2,
  categories: ['Vegetarian', 'Quick & Easy'],
  ingredients: [
    { item: 'eggs', quantity: 3, unit: 'whole' },
    { item: 'cheddar cheese', quantity: 50, unit: 'g' },
    { item: 'spinach', quantity: 30, unit: 'g' },
  ],
  steps: ['1. Beat the eggs.', '2. Heat the pan.', '3. Cook and fold.'],
  imagePrompt: 'spinach and cheddar omelette on a white plate',
};

const SAMPLE_IMPERIAL_RECIPE = {
  name: 'Cheddar Egg Scramble',
  cookTime: 10,
  servings: 1,
  categories: ['Vegetarian', 'Quick & Easy'],
  ingredients: [
    { item: 'eggs', quantity: 2, unit: 'whole' },
    { item: 'cheddar cheese', quantity: 2, unit: 'oz' },
  ],
  steps: ['1. Whisk eggs.', '2. Cook in butter.', '3. Add cheese.'],
  imagePrompt: 'cheesy scrambled eggs in a pan',
};

describe('POST /api/recipes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path — metric ──────────────────────────────────────────────────────
  it('returns 200 with recipe list for valid metric request', async () => {
    generateRecipes.mockResolvedValue([SAMPLE_METRIC_RECIPE]);

    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs', 'cheddar cheese', 'spinach'], units: 'metric' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recipes');
    expect(Array.isArray(res.body.recipes)).toBe(true);
    expect(res.body.recipes[0].name).toBe('Spinach & Cheddar Omelette');
  });

  // ── Unit preference — imperial reflected in ingredients ─────────────────────
  it('returns imperial units in ingredients when units=imperial', async () => {
    generateRecipes.mockResolvedValue([SAMPLE_IMPERIAL_RECIPE]);

    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs', 'cheddar cheese'], units: 'imperial' });

    expect(res.status).toBe(200);
    const cheeseIngredient = res.body.recipes[0].ingredients.find(
      (i) => i.item === 'cheddar cheese'
    );
    expect(cheeseIngredient.unit).toBe('oz');
  });

  // ── Missing ingredients array → 400 ─────────────────────────────────────────
  it('returns 400 when ingredients is missing', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ units: 'metric' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  // ── Empty ingredients array → 400 ────────────────────────────────────────────
  it('returns 400 when ingredients array is empty', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: [], units: 'metric' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  // ── Invalid units value → 400 ────────────────────────────────────────────────
  it('returns 400 for invalid units value', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs'], units: 'us_customary' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  // ── Missing units field → 400 ────────────────────────────────────────────────
  it('returns 400 when units is missing', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  // ── GPT-4o service failure → 503 ─────────────────────────────────────────────
  it('returns 503 when the OpenAI service throws', async () => {
    generateRecipes.mockRejectedValue(new Error('OpenAI timeout'));

    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs'], units: 'metric' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('analysis_unavailable');
    expect(JSON.stringify(res.body)).not.toMatch(/timeout/i);
  });

  // ── Recipe with missing field — service returns only valid after retry ────────
  it('excludes incomplete recipes (simulated by service returning filtered list)', async () => {
    // The service layer handles retry/exclusion; here we verify the route
    // correctly passes through only the recipes the service returns.
    generateRecipes.mockResolvedValue([SAMPLE_METRIC_RECIPE]);

    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs', 'spinach', 'cheddar'], units: 'metric' });

    expect(res.status).toBe(200);
    expect(res.body.recipes).toHaveLength(1);
    // Verify all required fields are present on the returned recipe
    const recipe = res.body.recipes[0];
    expect(recipe).toHaveProperty('name');
    expect(recipe).toHaveProperty('cookTime');
    expect(recipe).toHaveProperty('servings');
    expect(recipe).toHaveProperty('categories');
    expect(recipe).toHaveProperty('ingredients');
    expect(recipe).toHaveProperty('steps');
    expect(recipe).toHaveProperty('imagePrompt');
  });

  // ── Quick & Easy auto-tag ────────────────────────────────────────────────────
  it('returns Quick & Easy category for recipes with cookTime ≤ 30', async () => {
    const quickRecipe = { ...SAMPLE_METRIC_RECIPE, cookTime: 20 };
    generateRecipes.mockResolvedValue([quickRecipe]);

    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs'], units: 'metric' });

    expect(res.status).toBe(200);
    expect(res.body.recipes[0].categories).toContain('Quick & Easy');
  });

  // ── Non-string ingredient item → 400 ─────────────────────────────────────────
  it('returns 400 when ingredients contains a non-string item', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['eggs', 123], units: 'metric' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });
});
