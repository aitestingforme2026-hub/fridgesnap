/**
 * UnitPreference — segmented control to toggle metric / imperial.
 * Wraps useUnitPreference hook; also accepts controlled props for embedding.
 */
export default function UnitPreference({ unit, onUnitChange }) {
  return (
    <fieldset style={{ border: 'none' }}>
      <legend className="form-label" style={{ marginBottom: '0.5rem' }}>
        Unit preference
      </legend>
      <div className="segmented-control" role="group" aria-label="Unit preference">
        <button
          type="button"
          className="segmented-option"
          aria-pressed={unit === 'metric'}
          onClick={() => onUnitChange('metric')}
        >
          Metric (g / ml / °C)
        </button>
        <button
          type="button"
          className="segmented-option"
          aria-pressed={unit === 'imperial'}
          onClick={() => onUnitChange('imperial')}
        >
          Imperial (oz / cups / °F)
        </button>
      </div>
    </fieldset>
  );
}
