// context/theme/ThemeProvider.jsx

import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext.jsx';

const DEFAULT_THEME = 'dark';

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() =>
		localStorage.getItem('theme') || DEFAULT_THEME
	);

	useEffect(() => {
		document.body.classList.toggle('dark-mode', theme === 'dark');
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = () =>
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
