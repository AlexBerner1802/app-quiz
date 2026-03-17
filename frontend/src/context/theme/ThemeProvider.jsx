import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext.jsx";
import { AuthContext } from "../auth";
import api, { ensureCsrf } from "../../services/axiosClient";

const DEFAULT_THEME = "dark";

export const ThemeProvider = ({ children }) => {
  const { user, backendReady } = useContext(AuthContext);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || DEFAULT_THEME);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const sync = async () => {
      if (!backendReady) return;
      if (!user?.localAccountId) return;

      try {
        await ensureCsrf();
        await api.put("/api/user/theme", {
          is_dark_mode: true,
        });
      } catch (err) {
        console.error("Failed to sync theme:", err);
      }
    };

    sync();
  }, [theme, user?.localAccountId, backendReady]);

  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};