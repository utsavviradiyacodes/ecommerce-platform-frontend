import { useEffect, useState } from "react";

import { ThemeContext } from "./themeContext.js";

const THEME_STORAGE_KEY = "theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

const THEME_MODE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const VALID_THEME_MODES = new Set(Object.values(THEME_MODE));

function getInitialTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return VALID_THEME_MODES.has(storedTheme)
      ? storedTheme
      : THEME_MODE.SYSTEM;
  } catch {
    return THEME_MODE.SYSTEM;
  }
}

function getSystemThemeMediaQuery() {
  try {
    return typeof window.matchMedia === "function"
      ? window.matchMedia(SYSTEM_THEME_QUERY)
      : null;
  } catch {
    return null;
  }
}

function resolveTheme(theme, systemThemeMediaQuery) {
  if (theme === THEME_MODE.SYSTEM) {
    return systemThemeMediaQuery?.matches
      ? THEME_MODE.DARK
      : THEME_MODE.LIGHT;
  }

  return theme;
}

function applyResolvedTheme(resolvedTheme) {
  const documentElement = document.documentElement;
  const isDarkTheme = resolvedTheme === THEME_MODE.DARK;

  documentElement.classList.toggle("dark", isDarkTheme);
  documentElement.style.colorScheme = resolvedTheme;
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The in-memory preference remains usable when browser storage is blocked.
  }
}

function observeSystemThemeChanges(systemThemeMediaQuery, listener) {
  if (typeof systemThemeMediaQuery.addEventListener === "function") {
    systemThemeMediaQuery.addEventListener("change", listener);

    return () => {
      systemThemeMediaQuery.removeEventListener("change", listener);
    };
  }

  systemThemeMediaQuery.addListener(listener);

  return () => {
    systemThemeMediaQuery.removeListener(listener);
  };
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const systemThemeMediaQuery = getSystemThemeMediaQuery();

    const syncResolvedTheme = () => {
      applyResolvedTheme(resolveTheme(theme, systemThemeMediaQuery));
    };

    syncResolvedTheme();

    if (theme !== THEME_MODE.SYSTEM || !systemThemeMediaQuery) {
      return undefined;
    }

    return observeSystemThemeChanges(
      systemThemeMediaQuery,
      syncResolvedTheme
    );
  }, [theme]);

  function toggleTheme() {
    const resolvedTheme = resolveTheme(theme, getSystemThemeMediaQuery());

    const nextTheme =
      resolvedTheme === THEME_MODE.LIGHT
        ? THEME_MODE.DARK
        : THEME_MODE.LIGHT;

    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
