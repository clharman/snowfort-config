#!/usr/bin/env node
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { CoreService } from '@snowfort/config-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4040;

let core: CoreService;
let connectedClients: express.Response[] = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  if (!core) {
    return res.status(503).json({ status: 'initializing', message: 'CoreService not ready' });
  }
  res.json({ status: 'ready', message: 'Server is ready' });
});

app.get('/api/state', async (_req, res) => {
  try {
    const state = await core.getState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get state' });
  }
});

app.post('/api/patch', async (req, res) => {
  try {
    const result = await core.patch(req.body);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      errors: [`Server error: ${errorMessage}`],
      warnings: []
    });
  }
});

app.get('/api/backups', async (req, res) => {
  try {
    const engine = req.query.engine as string | undefined;
    const backups = await core.listBackups(engine);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.post('/api/restore', async (req, res) => {
  try {
    const { path } = req.body;
    const success = await core.restoreBackup(path);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get('/api/update-check', async (_req, res) => {
  try {
    const update = await core.checkUpdate();
    res.json(update);
  } catch (error) {
    res.status(500).json({ latest: '0.0.1', current: '0.0.1', url: '' });
  }
});

// Read CLAUDE.md file from project path
app.get('/api/project/:projectPath/claude-md', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    
    try {
      const content = await fs.readFile(claudeMdPath, 'utf8');
      res.json({ 
        success: true, 
        content,
        path: claudeMdPath,
        exists: true
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.json({ 
          success: true, 
          content: '', 
          path: claudeMdPath,
          exists: false
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to read CLAUDE.md: ${errorMessage}`
    });
  }
});

// Write CLAUDE.md file to project path
app.post('/api/project/:projectPath/claude-md', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    const { content } = req.body;
    
    if (typeof content !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Content must be a string' 
      });
    }
    
    await fs.writeFile(claudeMdPath, content, 'utf8');
    res.json({ 
      success: true, 
      path: claudeMdPath,
      message: 'CLAUDE.md saved successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to write CLAUDE.md: ${errorMessage}`
    });
  }
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  connectedClients.push(res);

  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    connectedClients = connectedClients.filter(client => client !== res);
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

function broadcastState(state: any) {
  const message = `data: ${JSON.stringify({ type: 'state', payload: state })}\n\n`;
  connectedClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Failed to send state to client:', error);
    }
  });
}

async function startServer() {
  try {
    console.log('Initializing Snowfort Config server...');
    
    core = new CoreService();
    core.on('stateChanged', broadcastState);
    
    console.log('Initializing CoreService...');
    await core.initialize();
    
    console.log('Loading initial state...');
    const initialState = await core.getState();
    
    console.log('Starting HTTP server...');
    const server = app.listen(port, () => {
      console.log(`✅ Snowfort Config web server ready at http://localhost:${port}`);
      console.log(`   Detected ${Object.keys(initialState).length} configuration engines`);
    });
    
    // Wait for server to actually be listening
    await new Promise<void>((resolve) => {
      server.on('listening', resolve);
    });
    
    broadcastState(initialState);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();