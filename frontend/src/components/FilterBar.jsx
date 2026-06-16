const FILTERS = [
  'Dairy',
  'Meat',
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Quick & Easy',
];

/**
 * FilterBar — horizontal chip row for multi-select recipe category filters.
 */
export default function FilterBar({ activeFilters, onToggleFilter }) {
  return (
    <nav aria-label="Filter recipes by category">
      <div className="filter-bar" role="group" aria-label="Recipe filters">
        {FILTERS.map((filter) => {
          const active = activeFilters.includes(filter);
          return (
            <button
              key={filter}
              type="button"
              className="filter-chip"
              aria-pressed={active}
              onClick={() => onToggleFilter(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
