import { readFile } from 'node:fs/promises';

const configText = await readFile(new URL('../capacitor.config.ts', import.meta.url), 'utf8');
const packageText = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const packageJson = JSON.parse(packageText);

const failures = [];

if (!configText.includes("webDir: 'dist'") && !configText.includes('webDir: "dist"')) {
  failures.push('capacitor.config.ts must keep webDir pointed at dist.');
}

if (packageJson.scripts?.build !== 'vite build') {
  failures.push('package.json scripts.build must remain "vite build".');
}

if (packageJson.scripts?.['cap:sync:ios'] !== 'npm run build && npx cap sync ios') {
  failures.push('package.json scripts.cap:sync:ios must build before syncing iOS.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Capacitor config check passed.');
