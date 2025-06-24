#!/usr/bin/env node
import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
// import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('sfconfig')
  .description('Snowfort Config - AI CLI configuration manager')
  .version('0.0.1');

program
  .command('tui')
  .description('Launch terminal UI')
  .option('--config <path>', 'Custom config path')
  .option('--no-update-check', 'Disable update check')
  .action((options) => {
    const tuiPath = path.join(__dirname, '../apps/tui/dist/index.js');
    
    const args = [];
    if (options.config) args.push('--config', options.config);
    if (options.noUpdateCheck) args.push('--no-update-check');
    
    const child = spawn('node', [tuiPath, ...args], {
      stdio: 'inherit'
    });
    
    child.on('error', (error) => {
      console.error('Failed to start TUI:', error.message);
      process.exit(1);
    });
    
    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  });

program
  .command('web')
  .description('Launch web UI on localhost:4040')
  .option('--config <path>', 'Custom config path')
  .option('--no-update-check', 'Disable update check')
  .option('--port <port>', 'Custom port (default: 4040)', '4040')
  .option('--no-open', 'Don\'t open browser automatically')
  .action(async (options) => {
    const serverPath = path.join(__dirname, '../apps/web/dist-server/index.js');
    
    const env = { ...process.env };
    if (options.port) env.PORT = options.port;
    if (options.config) env.CONFIG_PATH = options.config;
    if (options.noUpdateCheck) env.NO_UPDATE_CHECK = 'true';
    
    const child = spawn('node', [serverPath], {
      stdio: 'inherit',
      env
    });
    
    child.on('error', (error) => {
      console.error('Failed to start web server:', error.message);
      process.exit(1);
    });
    
    if (!options.noOpen) {
      setTimeout(() => {
        console.log(`\nWeb UI available at: http://localhost:${options.port}`);
      }, 2000);
    }
    
    child.on('exit', (code) => {
      process.exit(code || 0);
    });
    
    process.on('SIGINT', () => {
      child.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });
  });

program.parse();