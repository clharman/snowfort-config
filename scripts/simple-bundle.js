#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('Creating npm bundle with core dependencies...');
  
  // Copy core package files to where apps expect them  
  const coreSource = path.join(rootDir, 'packages/core/dist');
  
  // For web app: copy to apps/web/packages/core/dist
  const webCoreDest = path.join(rootDir, 'apps/web/packages/core/dist');
  await fs.mkdir(path.dirname(webCoreDest), { recursive: true });
  await copyDir(coreSource, webCoreDest);
  console.log('Copied core to web app location');
  
  // For TUI app: copy to apps/tui/packages/core/dist  
  const tuiCoreDest = path.join(rootDir, 'apps/tui/packages/core/dist');
  await fs.mkdir(path.dirname(tuiCoreDest), { recursive: true });
  await copyDir(coreSource, tuiCoreDest);
  console.log('Copied core to TUI app location');
  
  console.log('Bundle ready for npm publication!');
}

main().catch(console.error);