import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-4 sm:py-5 bg-white dark:bg-slate-950 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-10 sm:mt-14 border-t border-slate-200 dark:border-slate-800">
      &copy; {new Date().getFullYear()} Areeb Khan. All rights reserved.
    </footer>
  );
}
