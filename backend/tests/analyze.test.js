'use strict';

const request = require('supertest');
const app = require('../server');

// ── Mock the OpenAI service so no real API calls are made ────────────────────
jest.mock('../services/openai', () => ({
  analyzeImage: jest.fn(),
  generateRecipes: jest.fn(),
}));

const { analyzeImage } = require('../services/openai');

// A minimal 1×1 pixel white JPEG as a Buffer (valid JPEG magic bytes)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/8QABRABAP' +
    '/EABYBAQEBAAAAAAAAAAAAAAAAAAMCAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEA' +
    'AhEDEQA/AKwAB//Z',
  'base64'
);

describe('POST /api/analyze', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────
  it('returns 200 with ingredient list on valid image upload', async () => {
    analyzeImage.mockResolvedValue([
      { name: 'eggs', confidence: 0.97 },
      { name: 'cheddar cheese', confidence: 0.88 },
    ]);

    const res = await request(app)
      .post('/api/analyze')
      .attach('image', TINY_JPEG, { filename: 'fridge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ingredients');
    expect(Array.isArray(res.body.ingredients)).toBe(true);
    expect(res.body.ingredients[0].name).toBe('eggs');
    expect(res.body.ingredients[0].confidence).toBe(0.97);
  });

  // ── Confidence threshold flagging ───────────────────────────────────────────
  it('flags ingredients returned with confidence < 0.70', async () => {
    analyzeImage.mockResolvedValue([
      { name: 'unknown vegetable', confidence: 0.62, flagged: true },
      { name: 'milk', confidence: 0.91 },
    ]);

    const res = await request(app)
      .post('/api/analyze')
      .attach('image', TINY_JPEG, { filename: 'fridge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    const flagged = res.body.ingredients.find((i) => i.name === 'unknown vegetable');
    expect(flagged).toBeDefined();
    expect(flagged.flagged).toBe(true);

    const confident = res.body.ingredients.find((i) => i.name === 'milk');
    expect(confident.flagged).toBeUndefined();
  });

  // ── Missing image → 400 ─────────────────────────────────────────────────────
  it('returns 400 when no image is attached', async () => {
    const res = await request(app).post('/api/analyze');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // ── Wrong MIME type → 400 ───────────────────────────────────────────────────
  it('returns 400 when a non-image file is uploaded', async () => {
    const textBuffer = Buffer.from('this is not an image');

    const res = await request(app)
      .post('/api/analyze')
      .attach('image', textBuffer, { filename: 'file.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_file_type');
  });

  // ── GPT-4o service failure → 503 ────────────────────────────────────────────
  it('returns 503 when the OpenAI service throws', async () => {
    analyzeImage.mockRejectedValue(new Error('OpenAI connection refused'));

    const res = await request(app)
      .post('/api/analyze')
      .attach('image', TINY_JPEG, { filename: 'fridge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('analysis_unavailable');
    // Ensure the internal error message is NOT leaked
    expect(JSON.stringify(res.body)).not.toMatch(/connection refused/i);
  });

  // ── API key never appears in error response ──────────────────────────────────
  it('does not expose OPENAI_API_KEY in any error response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-secret-key-12345';
    analyzeImage.mockRejectedValue(new Error('Some internal error'));

    const res = await request(app)
      .post('/api/analyze')
      .attach('image', TINY_JPEG, { filename: 'fridge.jpg', contentType: 'image/jpeg' });

    expect(JSON.stringify(res.body)).not.toContain('sk-test-secret-key-12345');
  });
});
