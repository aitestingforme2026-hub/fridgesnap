'use strict';

// Import the pure utility function directly — no mocking needed.
const { convertStepTemperatures } = require('../services/openai');

describe('convertStepTemperatures', () => {
  // ── Imperial: °C → °F ────────────────────────────────────────────────────────
  it('converts °C to °F in step strings for imperial units', () => {
    const steps = ['1. Preheat oven to 180°C.', '2. Bake for 20 minutes.'];
    const result = convertStepTemperatures(steps, 'imperial');
    // 180°C = 356°F, rounded to nearest 5° = 355°F
    expect(result[0]).toContain('355°F');
    expect(result[1]).toBe('2. Bake for 20 minutes.');
  });

  it('converts multiple °C values in a single step', () => {
    const steps = ['1. Heat to 100°C then reduce to 60°C.'];
    const result = convertStepTemperatures(steps, 'imperial');
    // 100°C = 212°F — at threshold (not > 100°C), plain Math.round → 212°F (exact)
    // 60°C = 140°F — below 100°C threshold, plain Math.round → 140°F
    expect(result[0]).toContain('212°F');
    expect(result[0]).toContain('140°F');
    expect(result[0]).not.toContain('°C');
  });

  it('does not alter °F values when units is imperial', () => {
    const steps = ['1. Preheat oven to 350°F.'];
    const result = convertStepTemperatures(steps, 'imperial');
    expect(result[0]).toBe('1. Preheat oven to 350°F.');
  });

  // ── Metric: °F → °C ──────────────────────────────────────────────────────────
  it('converts °F to °C in step strings for metric units', () => {
    const steps = ['1. Preheat oven to 350°F.', '2. Let rest at room temperature.'];
    const result = convertStepTemperatures(steps, 'metric');
    // 350°F = 176.67°C — oven range (≥212°F), nearest-5°C applies → 175°C
    expect(result[0]).toContain('175°C');
    expect(result[1]).toBe('2. Let rest at room temperature.');
  });

  it('does not alter °C values when units is metric', () => {
    const steps = ['1. Preheat oven to 200°C.'];
    const result = convertStepTemperatures(steps, 'metric');
    expect(result[0]).toBe('1. Preheat oven to 200°C.');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────────
  it('returns steps unchanged when no temperature patterns are present', () => {
    const steps = ['1. Add salt.', '2. Stir well.'];
    expect(convertStepTemperatures(steps, 'imperial')).toEqual(steps);
    expect(convertStepTemperatures(steps, 'metric')).toEqual(steps);
  });

  it('handles an empty steps array gracefully', () => {
    expect(convertStepTemperatures([], 'imperial')).toEqual([]);
    expect(convertStepTemperatures([], 'metric')).toEqual([]);
  });

  it('returns non-array input unchanged', () => {
    expect(convertStepTemperatures(null, 'imperial')).toBeNull();
  });

  it('handles 0°C → 32°F correctly', () => {
    const result = convertStepTemperatures(['Chill to 0°C.'], 'imperial');
    // 0°C < 100°C threshold — plain Math.round → 32°F (no nearest-5 rounding)
    expect(result[0]).toContain('32°F');
  });

  it('handles 212°F → 100°C correctly', () => {
    const result = convertStepTemperatures(['Boil at 212°F.'], 'metric');
    expect(result[0]).toContain('100°C');
  });

  // ── Decimal temperature inputs (NEW-02) ───────────────────────────────────────
  it('converts decimal °C (180.5°C) to °F with nearest-5 rounding', () => {
    // 180.5 > 100°C → oven range → nearest-5
    // 180.5 × 9/5 + 32 = 356.9°F → Math.round(356.9/5)*5 = Math.round(71.38)*5 = 71*5 = 355°F
    const result = convertStepTemperatures(['Simmer at 180.5°C.'], 'imperial');
    expect(result[0]).toContain('355°F');
  });

  it('converts decimal °C (4.5°C) to °F with plain rounding', () => {
    // 4.5 ≤ 100°C → plain Math.round
    // 4.5 × 9/5 + 32 = 40.1°F → Math.round = 40°F
    const result = convertStepTemperatures(['Cool to 4.5°C.'], 'imperial');
    expect(result[0]).toContain('40°F');
  });
});
