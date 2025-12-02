import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useBlockNavigation(shouldWarn, message) {
	const navigate = useNavigate();

	useEffect(() => {
		if (!shouldWarn) return;

		// 1️⃣ Warn on tab close / refresh / leaving site
		const handleBeforeUnload = (e) => {
			e.preventDefault();
			e.returnValue = message; // triggers browser warning
		};
		window.addEventListener("beforeunload", handleBeforeUnload);

		// 2️⃣ Warn on SPA internal navigation (React Router)
		const unblock = navigate.block ? navigate.block((tx) => {
			if (window.confirm(message)) {
				tx.retry();
			}
		}) : null;

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			if (unblock) unblock();
		};
	}, [shouldWarn, message, navigate]);

}
