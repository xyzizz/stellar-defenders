import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const distDir = path.join(rootDir, 'dist');

const entriesToCopy = [
  'index.html',
  'src',
  'styles',
  'assets',
  '_headers',
  '_redirects',
];

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of entriesToCopy) {
  const sourcePath = path.join(rootDir, entry);
  if (!(await exists(sourcePath))) {
    continue;
  }

  const targetPath = path.join(distDir, entry);
  await cp(sourcePath, targetPath, { recursive: true });
  console.log(`Copied ${entry}`);
}

console.log(`Prepared Cloudflare Pages output in ${distDir}`);
