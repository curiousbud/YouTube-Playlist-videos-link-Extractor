import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-3 sm:py-4 bg-gray-100 text-center text-gray-600 text-xs sm:text-sm mt-8 sm:mt-12 border-t">
      &copy; {new Date().getFullYear()} Areeb Khan. All rights reserved.
    </footer>
  );
}
