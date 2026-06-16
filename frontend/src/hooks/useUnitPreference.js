import { useState } from 'react';

const STORAGE_KEY = 'fridgesnap_units';
const DEFAULT_UNIT = 'metric';

/**
 * Returns [unit, setUnit] where unit is 'metric' | 'imperial'.
 * Preference is persisted in localStorage.
 */
export function useUnitPreference() {
  const [unit, setUnitState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'imperial' || stored === 'metric' ? stored : DEFAULT_UNIT;
    } catch {
      return DEFAULT_UNIT;
    }
  });

  const setUnit = (value) => {
    if (value !== 'metric' && value !== 'imperial') return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
    }
    setUnitState(value);
  };

  return [unit, setUnit];
}
