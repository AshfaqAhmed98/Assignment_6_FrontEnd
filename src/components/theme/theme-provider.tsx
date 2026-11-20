"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const storageKey = "gearrent-theme";
const listeners = new Set<() => void>();
let currentTheme: Theme | null = null;

function emitThemeChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getThemeSnapshot(): Theme {
  if (currentTheme !== null) {
    return currentTheme;
  }
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    currentTheme =
      window.localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Could not load the saved theme preference:", error);
    currentTheme = "light";
  }
  return currentTheme;
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== storageKey) {
    return;
  }
  currentTheme = event.newValue === "dark" ? "dark" : "light";
  applyTheme(currentTheme);
  emitThemeChange();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function updateTheme(theme: Theme) {
  let storageError: Error | null = null;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch (error) {
    storageError =
      error instanceof Error
        ? error
        : new Error("Could not save your theme preference.");
  }
  currentTheme = theme;
  applyTheme(theme);
  emitThemeChange();
  if (storageError) {
    throw new Error(
      `Theme changed, but your preference could not be saved: ${storageError.message}`,
    );
  }
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const setTheme = useCallback((nextTheme: Theme) => {
    updateTheme(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  const [error, setError] = useState<string | null>(null);

  if (!context) {
    throw new Error("ThemeToggle must be rendered inside ThemeProvider.");
  }

  return (
    <div className="grid justify-items-end gap-1">
      <label className="gearrent-theme-switch">
        <input
          aria-label="Dark mode"
          checked={context.theme === "dark"}
          className="gearrent-theme-switch__input"
          onChange={(event) => {
            setError(null);
            try {
              context.setTheme(event.currentTarget.checked ? "dark" : "light");
            } catch (toggleError) {
              setError(
                toggleError instanceof Error
                  ? toggleError.message
                  : "Could not save your theme preference.",
              );
            }
          }}
          role="switch"
          type="checkbox"
        />
        <svg
          aria-hidden="true"
          className="gearrent-theme-switch__icon gearrent-theme-switch__icon--light"
          height="12"
          viewBox="0 0 12 12"
          width="12"
        >
          <g
            fill="none"
            stroke="#fff"
            strokeLinecap="round"
            strokeWidth="1"
          >
            <circle cx="6" cy="6" r="2" />
            <g strokeDasharray="1.5 1.5">
              <polyline points="6 10,6 11.5" />
              <polyline points="6 10,6 11.5" transform="rotate(45,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(90,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(135,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(180,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(225,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(270,6,6)" />
              <polyline points="6 10,6 11.5" transform="rotate(315,6,6)" />
            </g>
          </g>
        </svg>
        <svg
          aria-hidden="true"
          className="gearrent-theme-switch__icon gearrent-theme-switch__icon--dark"
          height="12"
          viewBox="0 0 12 12"
          width="12"
        >
          <g
            fill="none"
            stroke="#fff"
            strokeLinejoin="round"
            strokeWidth="1"
            transform="rotate(-45,6,6)"
          >
            <path d="m9,10c-2.209,0-4-1.791-4-4s1.791-4,4-4c.304,0,.598.041.883.105-.995-.992-2.367-1.605-3.883-1.605C2.962.5.5,2.962.5,6s2.462,5.5,5.5,5.5c1.516,0,2.888-.613,3.883-1.605-.285.064-.578.105-.883.105Z" />
          </g>
        </svg>
        <span className="gearrent-theme-switch__sr">Dark mode</span>
      </label>
      {error && (
        <span aria-live="polite" className="max-w-56 text-xs text-rose-200" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
