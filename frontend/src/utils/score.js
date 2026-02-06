
export function normalizeScore({
								   rawScore,
								   quizMaxScore,
								   withSpace = true,
								   withMultiplier = true,
							   }) {
	const normalizedMax =
		Number(import.meta.env.VITE_NORMALIZED_MAX_SCORE) || 100;

	if (!quizMaxScore || quizMaxScore <= 0) return 0;

	// Step 1: normalize score
	const normalizedScore = Math.round(
		(rawScore / quizMaxScore) * normalizedMax
	);

	// Step 2: optionally apply multiplier
	const finalScore = withMultiplier
		? applyScoreMultiplier(normalizedScore, withSpace)
		: withSpace
			? normalizedScore
				.toString()
				.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
			: normalizedScore;

	return finalScore;
}

export function applyScoreMultiplier(score, withSpace = true) {
	const multiplier = import.meta.env.VITE_SCORE_MULTIPLIER || 1000;

	// Ensure integer result (no decimals)
	const result = Math.round(score * multiplier);

	if (!withSpace) return result;

	// Add space every 3 digits
	return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}