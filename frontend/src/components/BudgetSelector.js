import React from 'react';
import './CategorySelector.css';

const DEFAULT_BUDGETS = ['Below 20', '20 - 40', 'Above 40'];

function BudgetSelector({ selected, onChange, budgets = DEFAULT_BUDGETS, onClickSound }) {
  const toggleBudget = (budget) => {
    if (onClickSound) onClickSound();
    if (selected.includes(budget)) {
      onChange(selected.filter((b) => b !== budget));
    } else {
      onChange([...selected, budget]);
    }
  };

  return (
    <div className="category-selector">
      <label className="selector-label">Budget</label>
      <p className="selector-hint">Select one or more budget ranges</p>
      <div className="category-grid">
        {budgets.map((budget) => (
          <button
            key={budget}
            className={`category-chip ${selected.includes(budget) ? 'selected' : ''}`}
            onClick={() => toggleBudget(budget)}
            type="button"
          >
            {budget}
            {selected.includes(budget) && <span className="checkmark">バ"</span>}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="selected-count">
          {selected.length} budget{selected.length === 1 ? '' : 's'} selected
        </div>
      )}
    </div>
  );
}

export default BudgetSelector;
