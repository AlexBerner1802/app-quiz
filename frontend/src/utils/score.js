
export function applyScoreMultiplier(score, withSpace = true) {
	const multiplier = import.meta.env.VITE_SCORE_MULTIPLIER || 1000;
	const result = score * multiplier;

	if (!withSpace) return result;

	// Add space every 3 digits
	return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}