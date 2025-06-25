#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Create temporary copies for publishing that don't affect local development
async function createTempCopy(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await createTempCopy(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function replaceImports(filePath, relativePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = content.replace(
      /from ['"]@snowfort\/config-core['"]/g,
      `from '${relativePath}'`
    );
    
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`Updated imports in: ${filePath} -> ${relativePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function replaceImportsInDir(dir, relativePath) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await replaceImportsInDir(fullPath, relativePath);
    } else if (entry.name.endsWith('.js')) {
      await replaceImports(fullPath, relativePath);
    }
  }
}

async function updatePackageFiles() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  
  // Update files array to include temp dirs instead of original dist dirs
  packageJson.files = [
    "bin/",
    "temp-build/apps/tui/dist/",
    "temp-build/apps/web/dist/",
    "temp-build/apps/web/dist-server/",
    "packages/core/dist/",
    "README.md",
    "LICENSE"
  ];
  
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function restorePackageFiles() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  
  // Restore original files array
  packageJson.files = [
    "bin/",
    "apps/tui/dist/",
    "apps/web/dist/",
    "apps/web/dist-server/",
    "packages/core/dist/",
    "README.md",
    "LICENSE"
  ];
  
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function main() {
  console.log('Building bundle for npm publication...');
  
  try {
    // First build everything normally
    console.log('Building packages...');
    const { spawn } = await import('child_process');
    
    await new Promise((resolve, reject) => {
      const child = spawn('pnpm', ['build'], { stdio: 'inherit', cwd: rootDir });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });
    
    // Create temporary build directory
    const tempBuildDir = path.join(rootDir, 'temp-build');
    await fs.rm(tempBuildDir, { recursive: true, force: true });
    
    // Copy apps to temp directory
    console.log('Creating temporary build copies...');
    await createTempCopy(path.join(rootDir, 'apps'), path.join(tempBuildDir, 'apps'));
    
    // Fix imports in temp copies
    console.log('Fixing imports in temporary copies...');
    
    const tempWebServerDist = path.join(tempBuildDir, 'apps/web/dist-server');
    const tempTuiDist = path.join(tempBuildDir, 'apps/tui/dist');
    
    // Web server: from temp-build/apps/web/dist-server to packages/core/dist
    await replaceImportsInDir(tempWebServerDist, '../../../packages/core/dist/index.js');
    
    // TUI: from temp-build/apps/tui/dist to packages/core/dist  
    await replaceImportsInDir(tempTuiDist, '../../packages/core/dist/index.js');
    
    // Update package.json to point to temp directories
    await updatePackageFiles();
    
    console.log('Bundle ready for npm publication!');
    
    // Clean up function for after publishing
    global.cleanupBundle = async () => {
      await restorePackageFiles();
      await fs.rm(tempBuildDir, { recursive: true, force: true });
      console.log('Cleaned up temporary build files');
    };
    
  } catch (error) {
    console.error('Bundle preparation failed:', error);
    throw error;
  }
}

main().catch(console.error);