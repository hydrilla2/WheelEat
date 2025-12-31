export function sortLeaderboardRows(rows, mode) {
  const copy = Array.isArray(rows) ? [...rows] : [];

  // Helper function to get numeric value, with null/undefined treated as -Infinity
  // This ensures items without ratings/reviews are always sorted to the bottom
  const getSortValue = (item, field) => {
    const value = item?.[field];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    // Return -Infinity so null/undefined values are always at the bottom
    return -Infinity;
  };

  if (mode === 'reviews') {
    // Sort by reviews (descending), with restaurants without reviews at the bottom
    copy.sort((a, b) => {
      const aValue = getSortValue(a, 'reviews');
      const bValue = getSortValue(b, 'reviews');
      // If values are equal, maintain stable sort by name
      if (aValue === bValue) {
        return (a?.name || '').localeCompare(b?.name || '');
      }
      return bValue - aValue; // Descending order
    });
  } else {
    // Sort by rating (descending), with restaurants without ratings at the bottom
    copy.sort((a, b) => {
      const aValue = getSortValue(a, 'rating');
      const bValue = getSortValue(b, 'rating');
      // If values are equal, maintain stable sort by name
      if (aValue === bValue) {
        return (a?.name || '').localeCompare(b?.name || '');
      }
      return bValue - aValue; // Descending order
    });
  }

  return copy;
}