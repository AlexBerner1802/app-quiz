import { useState, useEffect, useCallback, useRef  } from "react";
import * as msal from "@azure/msal-browser";
import { AuthContext } from "./AuthContext";
import api, { ensureCsrf } from "../../services/axiosClient";

const redirectUri =
	import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

const pca = new msal.PublicClientApplication({
	auth: {
		clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
		redirectUri,
	},
});

function getAzureId(account) {
	return account?.localAccountId ?? "";
}

function getName(account) {
	return account?.name ?? account?.username ?? "";
}

function getUsername(account) {
	return account?.username ?? account?.name ?? "";
}

async function fetchMe() {
	const res = await api.get("/api/me");
	return res.data ?? null;
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);       // MSAL account
	const [dbUser, setDbUser] = useState(null);   // Laravel user via /api/me
	const [token, setToken] = useState(null);
	const initStartedRef = useRef(false);
	const backendBootstrapPromiseRef = useRef(null);

	const [isInitialized, setIsInitialized] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const loadTheme = useCallback(async () => {
		try {
			const res = await api.get("/api/user/theme");
			const serverTheme = res?.data?.theme;

			if (serverTheme === "dark" || serverTheme === "light") {
				localStorage.setItem("theme", serverTheme);
			}
		} catch (err) {
			console.warn("Failed to load theme:", err);
		}
	}, []);

	const ensureBackendSessionAndDbUser = useCallback(async (account) => {
		if (backendBootstrapPromiseRef.current) {
			return backendBootstrapPromiseRef.current;
		}

		backendBootstrapPromiseRef.current = (async () => {
			await ensureCsrf();

			const tokenResponse = await pca.acquireTokenSilent({
				scopes: ["User.Read"],
				account,
			});

			const accessToken = tokenResponse.accessToken;
			const theme = localStorage.getItem("theme") ?? "dark";


			await api.post("/api/auth/azure/bootstrap", {
				access_token: accessToken,
				theme,
			});

			const me = await fetchMe();

			setDbUser(me);
			await loadTheme();

			return me;
		})();

		try {
			return await backendBootstrapPromiseRef.current;
		} finally {
			backendBootstrapPromiseRef.current = null;
		}
	}, [loadTheme]);

	useEffect(() => {
		if (initStartedRef.current) return;
		initStartedRef.current = true;

		const initAuth = async () => {

			try {
				await pca.initialize();

				setIsReady(true);

				const accounts = pca.getAllAccounts();

				if (accounts.length > 0) {
					const account = accounts[0];
					setUser(account);

					try {
						const tokenResponse = await pca.acquireTokenSilent({
							scopes: ["User.Read"],
							account,
						});
						setToken(tokenResponse.accessToken);
					} catch (silentErr) {
						console.warn("[auth] token failed", silentErr);
					}

					try {
						await ensureBackendSessionAndDbUser(account);
					} catch (err) {
						console.warn("[auth] backend bootstrap failed", err);
					}
				} else {
					console.log("[auth] no account found");
				}
			} catch (err) {
				console.error("[auth] init failed", err);
			} finally {
				setIsInitialized(true);
			}
		};

		initAuth();
	}, [ensureBackendSessionAndDbUser]);

	const refreshMe = useCallback(async () => {
		try {
			const me = await fetchMe();
			setDbUser(me);
			return me;
		} catch (err) {
			setDbUser(null);
			throw err;
		}
	}, []);

	const login = async () => {
		if (!isReady) {
			console.error("MSAL not initialized yet");
			return;
		}

		try {
			const loginResponse = await pca.loginPopup({ scopes: ["User.Read"] });
			const account = loginResponse.account;
			setUser(account);

			try {
				const tokenResponse = await pca.acquireTokenSilent({
					scopes: ["User.Read"],
					account,
				});
				setToken(tokenResponse.accessToken);
			} catch (silentErr) {
				console.warn("Token acquisition failed after login:", silentErr);
			}

			await ensureBackendSessionAndDbUser(account);
		} catch (err) {
			console.error("Login failed:", err);
		}
	};

	const logout = async () => {
		if (!isReady) {
			console.error("MSAL not initialized yet");
			return;
		}

		try {
			try {
				await ensureCsrf();
				await api.post("/api/auth/logout");
			} catch (_) {}

			await pca.logoutPopup();
			setUser(null);
			setDbUser(null);
			setToken(null);

			localStorage.removeItem("token");
			localStorage.removeItem("user");
		} catch (err) {
			console.error("Error logging out:", err);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				dbUser,
				token,
				login,
				logout,
				refreshMe,
				isInitialized,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}