import React from 'react';
import ThemeSwitcher from '@/app/theme';
import { LinkedInIcon, GitHubIcon } from './SocialIcons';

export default function Header() {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-2 sm:px-6 py-3 sm:py-4 bg-white shadow-md gap-2 sm:gap-0">
      {/* Left: Name */}
      <div className="text-lg sm:text-xl font-bold text-gray-900">Areeb Khan</div>
      {/* Center: Repo Link Button */}
      <a
        href="https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
      >
        Repo
      </a>
      {/* Right: Social Links + Theme Switcher */}
      <div className="flex gap-2 sm:gap-4 items-center">
        <a
          href="https://www.linkedin.com/in/curiousbud/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="flex items-center justify-center"
          style={{ height: 28, width: 28, borderRadius: 6, background: 'transparent' }}
        >
          <LinkedInIcon size={22} />
        </a>
        <a
          href="https://github.com/curiousbud"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center justify-center"
          style={{ height: 28, width: 28, borderRadius: 6, background: 'transparent' }}
        >
          <GitHubIcon size={22} />
        </a>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
