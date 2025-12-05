
export function applyScoreMultiplier(score) {
	const multiplier = import.meta.env.VITE_SCORE_MULTIPLIER || 1000;
	return score * multiplier;
}