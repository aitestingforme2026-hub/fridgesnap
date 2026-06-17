import { useState } from 'react';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'light snack', label: 'Light Snack' },
  { value: 'dessert', label: 'Dessert' },
];

export default function V1_MealTypeSelector({ selected, onSelect }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        style={{
          display: 'block',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: 'var(--color-text)',
        }}
      >
        What meal are you planning?
      </label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
        role="radiogroup"
        aria-label="Meal type"
      >
        {MEAL_TYPES.map((type) => {
          const isActive = selected === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(isActive ? null : type.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isActive ? '#fff' : 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 'var(--touch-target)',
                transition: 'var(--transition)',
              }}
            >
              {type.label}
            </button>
          );
        })}
      </div>
      {!selected && (
        <p style={{
          marginTop: '0.25rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
        }}>
          Optional — skip for all meal types.
        </p>
      )}
    </div>
  );
}
