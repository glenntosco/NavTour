/**
 * esbuild config — mirrors Navattic's multi-entry-point build
 * Each content script, worker, and supporting script is a separate IIFE bundle.
 */

import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const commonOptions = {
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
};

// All entry points matching Navattic's file structure
const entryPoints = [
  // Main service worker
  { in: 'src/worker.ts', out: 'worker' },
  // Content scripts
  { in: 'src/content-script-isolated.ts', out: 'content-script-isolated' },
  { in: 'src/content-script-main.ts', out: 'content-script-main' },
  // Supporting scripts (injected by content scripts or loaded directly)
  { in: 'src/check-if-active.ts', out: 'check-if-active' },
  { in: 'src/message-manager.ts', out: 'message-manager' },
  { in: 'src/html-patch.ts', out: 'html-patch' },
  { in: 'src/patch.ts', out: 'patch' },
  { in: 'src/storage-overwrite.ts', out: 'storage-overwrite' },
  { in: 'src/service-workers.ts', out: 'service-workers' },
  { in: 'src/offscreen.ts', out: 'offscreen' },
  // Popup
  { in: 'src/popup.ts', out: 'popup' },
];

async function build() {
  const builds = entryPoints.map(({ in: input, out }) =>
    esbuild.build({
      ...commonOptions,
      entryPoints: [input],
      outfile: `dist/${out}.js`,
    })
  );

  await Promise.all(builds);
  console.log(`Built ${entryPoints.length} entry points`);
}

if (isWatch) {
  // Watch mode — rebuild on changes
  const contexts = await Promise.all(
    entryPoints.map(({ in: input, out }) =>
      esbuild.context({
        ...commonOptions,
        entryPoints: [input],
        outfile: `dist/${out}.js`,
      })
    )
  );

  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('Watching for changes...');
} else {
  await build();
}
