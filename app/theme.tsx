"use client";
import { useState, useEffect } from "react";

export default function ThemeSwitcher() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      // Avoid direct setState in effect body
      Promise.resolve().then(() => setDark(true));
    }
  }, []);

  return (
    <button
      className="ml-4 p-2 rounded-full bg-white dark:bg-gray-700 text-black dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-colors flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        // Sun icon for light mode
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ color: dark ? '#fff' : 'inherit' }}>
          <path d="M12 4.5V2m0 20v-2.5m7.07-12.57l1.42-1.42M4.51 19.49l1.42-1.42M19.5 12h2.5M2 12h2.5m12.57 7.07l1.42 1.42M4.51 4.51l1.42 1.42M12 7a5 5 0 100 10 5 5 0 000-10z" stroke={dark ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ color: dark ? '#fff' : 'inherit' }}>
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      )}
    </button>
  );
}
