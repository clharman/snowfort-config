#!/usr/bin/env node
import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('sfconfig')
  .description('Snowfort Config - AI CLI configuration manager')
  .version('0.0.7')
  .option('--port <port>', 'Custom port for web UI (default: 4040)', '4040')
  .option('--config <path>', 'Custom config path')
  .option('--no-update-check', 'Disable update check')
  .option('--no-open', 'Don\'t open browser automatically')
  .action((options, command) => {
    // Default behavior: launch web UI
    const args = command.args;
    if (args.length === 0) {
      console.log('Starting web interface...');
      launchWeb(options);
    }
  });

function launchWeb(options) {
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
      const url = `http://localhost:${options.port}`;
      console.log(`\nWeb UI available at: ${url}`);
      console.log('Opening browser...');
      open(url).catch(() => {
        console.log('Could not open browser automatically. Please visit the URL above.');
      });
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
}

program
  .command('web')
  .description('Launch web UI')
  .option('--config <path>', 'Custom config path')
  .option('--no-update-check', 'Disable update check')
  .option('--port <port>', 'Custom port (default: 4040)', '4040')
  .option('--no-open', 'Don\'t open browser automatically')
  .action((options) => {
    launchWeb(options);
  });

program.parse();