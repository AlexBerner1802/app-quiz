import axios from "axios";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
	headers: {
		"X-Requested-With": "XMLHttpRequest",
		Accept: "application/json",
	},
});

api.defaults.xsrfCookieName = "XSRF-TOKEN";
api.defaults.xsrfHeaderName = "X-XSRF-TOKEN";

let csrfPromise = null;

export async function ensureCsrf() {
	if (!csrfPromise) {
		csrfPromise = api.get("/sanctum/csrf-cookie")
			.then((response) => {
				csrfPromise = null;
				return response;
			})
			.catch((err) => {
				csrfPromise = null;
				throw err;
			});
	}

	return csrfPromise;
}

api.interceptors.request.use((config) => {
	const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
	if (match && !config.headers["X-XSRF-TOKEN"]) {
		config.headers["X-XSRF-TOKEN"] = decodeURIComponent(match[1]);
	}
	return config;
});

// Global response interceptor
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (!error?.response) {
			console.error("Network/Abort error:", {
				message: error?.message,
				code: error?.code,
				name: error?.name,
			});
			return Promise.reject(error);
		}

		const responseData = error.response.data;
		let msg = error.message;

		if (responseData) {
			msg =
				responseData.message ||
				responseData.error ||
				JSON.stringify(responseData, null, 2);
		}

		error.message = msg;
		console.error("Full backend response:", responseData);
		return Promise.reject(error);
	}
);

export default api;
