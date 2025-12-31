export function sortLeaderboardRows(rows, mode) {
  const copy = Array.isArray(rows) ? [...rows] : [];

  const asNumber = (n) => (typeof n === 'number' && !Number.isNaN(n) ? n : -1);

  if (mode === 'reviews') {
    copy.sort((a, b) => asNumber(b?.reviews) - asNumber(a?.reviews));
  } else {
    copy.sort((a, b) => asNumber(b?.rating) - asNumber(a?.rating));
  }

  return copy;
}


