#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

async function replaceImports(filePath, fromPattern, toPattern) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = content.replace(fromPattern, toPattern);
    
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Fixing import paths for npm bundle...');
  
  // Fix web server imports - change @snowfort/config-core to relative path to packages/core/dist
  const webServerFile = path.join(rootDir, 'apps/web/dist-server/index.js');
  await replaceImports(
    webServerFile,
    /from ['"]@snowfort\/config-core['"]/g,
    "from '../packages/core/dist/index.js'"
  );
  
  // Fix TUI imports - change @snowfort/config-core to relative path to packages/core/dist
  const tuiFile = path.join(rootDir, 'apps/tui/dist/hooks/useCore.js');
  await replaceImports(
    tuiFile,
    /from ['"]@snowfort\/config-core['"]/g,
    "from '../../packages/core/dist/index.js'"
  );
  
  console.log('Import paths fixed for npm bundle!');
}

main().catch(console.error);