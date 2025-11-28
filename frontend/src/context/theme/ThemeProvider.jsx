// context/theme/ThemeProvider.jsx

import {useContext, useEffect, useState} from 'react';
import { ThemeContext } from './ThemeContext.jsx';
import {AuthContext} from "../auth";
import axios from "axios";

const DEFAULT_THEME = 'dark';
const apiUrl = (import.meta?.env?.VITE_API_URL || "http://localhost:8000");

export const ThemeProvider = ({ children }) => {
	const { user } = useContext(AuthContext);

	const [theme, setTheme] = useState(() =>
		localStorage.getItem('theme') || DEFAULT_THEME
	);

	useEffect(() => {
		if (!user) return; // user might be undefined while loading auth

		const userTheme = user.is_dark_mode ? "dark" : "light";
		setTheme(userTheme);

		document.body.classList.toggle("dark-mode", userTheme === "dark");
	}, [user]);


	useEffect(() => {
		document.body.classList.toggle("dark-mode", theme === "dark");
		localStorage.setItem("theme", theme);

		// Sync theme to Laravel only if logged in
		if (user?.localAccountId) {
			axios.put(`${apiUrl}/api/user/theme`, {
				azure_id: user.localAccountId,
				is_dark_mode: theme === "dark"
			}).catch(err => {
				console.error("Failed to sync theme:", err);
			});
		}
	}, [theme, user]);

	const toggleTheme = () =>
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
