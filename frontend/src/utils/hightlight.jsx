// utils/highlight.jsx
import React from "react";

export function Highlight({ text = "", query = "" }) {
	if (!query) return <>{text}</>;

	const regex = new RegExp(`(${query})`, "i"); // remove 'g' flag
	const parts = text.split(new RegExp(`(${query})`, "i"));

	return (
		<>
			{parts.map((part, i) =>
				regex.test(part) ? (
					<mark key={i} style={{ backgroundColor: "var(--color-highlight)", color: "var(--color-link)" }}>
						{part}
					</mark>
				) : (
					part
				)
			)}
		</>
	);
}
