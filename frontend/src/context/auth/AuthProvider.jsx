import { useState, useEffect } from "react";
import * as msal from "@azure/msal-browser";
import { AuthContext } from "./AuthContext";

const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
const apiUrl = (import.meta?.env?.VITE_API_URL || "http://localhost:8000");

const pca = new msal.PublicClientApplication({
	auth: {
		clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
		redirectUri: redirectUri,
	},
});

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isReady, setIsReady] = useState(false); // ensures initialize is finished

	useEffect(() => {
		const initAuth = async () => {
			try {
				await pca.initialize();
				setIsReady(true); // mark MSAL as ready

				const accounts = pca.getAllAccounts();
				if (accounts.length > 0) {
					setUser(accounts[0]);
					try {
						const tokenResponse = await pca.acquireTokenSilent({
							scopes: ["User.Read"],
							account: accounts[0],
						});
						setToken(tokenResponse.accessToken);
					} catch (silentErr) {
						console.warn("Silent token acquisition failed:", silentErr);
					}
				}
			} catch (err) {
				console.error("Auth init failed:", err);
			} finally {
				setIsInitialized(true);
			}
		};
		initAuth();
	}, []);

	const personalLogin = async (azureRes) => {
		const account = azureRes.account;
		const name = account.name;
		const username = account.username;
		const azure_id = account.localAccountId;
		const res = await fetch(`${apiUrl}/api/user`, {
			method: "POST",
			headers: { Accept: "application/json" },
			body: JSON.stringify({name: name, username: username, azure_id: azure_id}),
		});

		console.log(await res.json())
	}

	const login = async () => {
		if (!isReady) {
			console.error("MSAL not initialized yet");
			return;
		}

		try {
			const loginResponse = await pca.loginPopup({ scopes: ["User.Read"] });
			setUser(loginResponse.account);

			const tokenResponse = await pca.acquireTokenSilent({
				scopes: ["User.Read"],
				account: loginResponse.account,
			});
			setToken(tokenResponse.accessToken);
			personalLogin(loginResponse);


		} catch (err) {
			console.error("Login failed", err);
		}
	};

	const logout = async () => {
		if (!isReady) {
			console.error("MSAL not initialized yet");
			return;
		}

		try {
			await pca.logoutPopup();
			setUser(null);
			setToken(null);
			localStorage.clear();
		} catch (err) {
			console.error("Error logging out:", err);
		}
	};

	if (!isInitialized) return null;

	return (
		<AuthContext.Provider value={{ user, token, login, logout, isInitialized }}>
			{children}
		</AuthContext.Provider>
	);
}
