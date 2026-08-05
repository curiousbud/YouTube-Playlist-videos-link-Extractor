import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ytdl-core writes player-script caches to the working directory at
    // runtime; they are minified third-party JS and must never be linted.
    "**/*-player-script.js",
    // Downloaded yt-dlp binary (see lib/youtube/ytdlp.ts) is not source code.
    ".yt-dlp/**",
  ]),
]);

export default eslintConfig;
