import React from 'react';
import './DietarySelector.css';

const DIETARY_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'halal_pork_free', label: 'Halal & Pork Free' },
];

function DietarySelector({ value, onChange, onClickSound, disabled = false }) {
  return (
    <div className="dietary-selector">
      <label className="selector-label">Dietary Needs</label>
      <div className="dietary-options">
        {DIETARY_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`dietary-option ${value === option.value ? 'active' : ''}`}
            onClick={() => {
              if (disabled) return;
              if (onClickSound) onClickSound();
              onChange(option.value);
            }}
            type="button"
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DietarySelector;
