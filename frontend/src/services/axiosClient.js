import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
	baseURL: API_URL,
	withCredentials: true, // for Laravel Sanctum
	headers: {
		Accept: "application/json",
	},
});

// Global response interceptor
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// Get full backend response if available
		const responseData = error?.response?.data;
		let msg = error.message;

		if (responseData) {
			// Prefer message, then error, then full JSON string
			msg =
				responseData.message ||
				responseData.error ||
				JSON.stringify(responseData, null, 2);
		}

		// Log full backend error to console
		console.error("Full backend response:", responseData);

		// Reject with full message
		return Promise.reject(new Error(msg));
	}
);

export default api;
