"use client";
import { useState, useEffect } from "react";

export default function ThemeSwitcher() {
  // Initialise from the class the inline boot script already applied, so the
  // toggle's state matches the rendered theme with no flash on hydration.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Defer to a microtask so we sync with the DOM (set by the boot script)
    // without calling setState synchronously inside the effect body.
    if (document.documentElement.classList.contains("dark")) {
      Promise.resolve().then(() => setDark(true));
    }
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <button
      className="ml-1 sm:ml-2 p-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        // Sun icon — switch to light mode
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4.5V2m0 20v-2.5m7.07-12.57l1.42-1.42M4.51 19.49l1.42-1.42M19.5 12h2.5M2 12h2.5m12.57 7.07l1.42 1.42M4.51 4.51l1.42 1.42M12 7a5 5 0 100 10 5 5 0 000-10z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ) : (
        // Moon icon — switch to dark mode
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
