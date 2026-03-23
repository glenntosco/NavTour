---
name: build-extension
description: Build the NavTour Chrome extension — compiles TypeScript, bumps manifest version, and creates zip for Chrome Web Store
disable-model-invocation: true
---

# Build NavTour Chrome Extension

Build the Chrome extension from TypeScript source, bump the manifest version, and package for distribution.

## Steps

1. Read the current version from `src/NavTour.Extension/manifest.json`
2. Bump the patch version (e.g., 1.3.0 → 1.3.1)
3. Run `npm run build` in `src/NavTour.Extension/`
4. Verify the build succeeded (check `dist/` output)
5. Create a zip file: `navtour-capture-{version}.zip` containing the `dist/` folder contents
6. Report the new version and zip location

## Important Notes

- The actual capture function is `capturePageDOM()` in `background.ts`, NOT `captureDOM()` in `content.ts`
- Always bump the manifest version — the user requires version bumps on every build
- The zip should include: manifest.json, background.js, content.js, popup.html, popup.js, icons/
