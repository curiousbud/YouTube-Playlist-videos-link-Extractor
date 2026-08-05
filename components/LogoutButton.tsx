'use client';

// Logs the current session out by clearing the auth cookie, then navigates to
// the login screen (the proxy gate keeps /login reachable without a session).
export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network errors here; the navigation below still shows /login.
    }
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title="Log out of this site"
    >
      Log out
    </button>
  );
}
