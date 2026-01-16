import React from 'react';
import './CategorySelector.css';

// Categories will be loaded from API
const DEFAULT_CATEGORIES = [
  'Coffee & Cafes',
  'Local & Malaysian',
  'Western & International',
  'Fast Food',
  'Japanese Cuisine',
  'Korean Cuisine',
  'Chinese & Taiwanese',
  'Tea & Beverages',
  'Bakery & Pastry',
  'Snacks & Desserts',
  'Snacks & Specialty Store',
  'Supermarket',
];

function CategorySelector({ selected, onChange, categories = DEFAULT_CATEGORIES, onClickSound, disabled = false }) {
  const toggleCategory = (category) => {
    if (disabled) return;
    if (onClickSound) onClickSound();
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="category-selector">
      <label className="selector-label">Restaurant Categories</label>
      <p className="selector-hint">Select one or more categories</p>
      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-chip ${selected.includes(category) ? 'selected' : ''}`}
            onClick={() => toggleCategory(category)}
            type="button"
            disabled={disabled}
            aria-disabled={disabled ? 'true' : 'false'}
          >
            {category}
            {selected.includes(category) && <span className="checkmark">✓</span>}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="selected-count">
          {selected.length} categor{selected.length === 1 ? 'y' : 'ies'} selected
        </div>
      )}
    </div>
  );
}

export default CategorySelector;
