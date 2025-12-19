
export function applyScoreMultiplier(score, withSpace = true) {
	const multiplier = import.meta.env.VITE_SCORE_MULTIPLIER || 1000;

	// Ensure integer result (no decimals)
	const result = Math.round(score * multiplier);

	if (!withSpace) return result;

	// Add space every 3 digits
	return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}