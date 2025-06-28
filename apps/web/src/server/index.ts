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

// Tool Permissions API endpoints
app.get('/api/project/:projectPath/tools', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const state = await core.getState();
    const claudeCodeData = state['claude-code'];
    const projectData = claudeCodeData?.projects?.[projectPath];
    const allowedTools = projectData?.allowedTools || [];
    
    res.json({ 
      success: true, 
      tools: allowedTools,
      path: projectPath
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to get tools: ${errorMessage}`
    });
  }
});

app.post('/api/project/:projectPath/tools', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const { tools } = req.body;
    
    if (!Array.isArray(tools)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tools must be an array' 
      });
    }
    
    const patchObj = {
      'claude-code': {
        projects: {
          [projectPath]: {
            allowedTools: tools
          }
        }
      }
    };
    
    const result = await core.patch(patchObj);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to update tools: ${errorMessage}`
    });
  }
});

// Ignore Patterns API endpoints
app.get('/api/project/:projectPath/ignore-patterns', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const state = await core.getState();
    const claudeCodeData = state['claude-code'];
    const projectData = claudeCodeData?.projects?.[projectPath];
    const ignorePatterns = projectData?.ignorePatterns || [];
    
    res.json({ 
      success: true, 
      patterns: ignorePatterns,
      path: projectPath
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to get ignore patterns: ${errorMessage}`
    });
  }
});

app.post('/api/project/:projectPath/ignore-patterns', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const { patterns } = req.body;
    
    if (!Array.isArray(patterns)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patterns must be an array' 
      });
    }
    
    const patchObj = {
      'claude-code': {
        projects: {
          [projectPath]: {
            ignorePatterns: patterns
          }
        }
      }
    };
    
    const result = await core.patch(patchObj);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to update ignore patterns: ${errorMessage}`
    });
  }
});

// Examples API endpoints
app.get('/api/project/:projectPath/examples', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const state = await core.getState();
    const claudeCodeData = state['claude-code'];
    const projectData = claudeCodeData?.projects?.[projectPath];
    const examples = projectData?.examples || [];
    
    res.json({ 
      success: true, 
      examples: examples,
      path: projectPath
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to get examples: ${errorMessage}`
    });
  }
});

app.post('/api/project/:projectPath/examples', async (req, res) => {
  try {
    const projectPath = Buffer.from(req.params.projectPath, 'base64').toString();
    const { examples } = req.body;
    
    if (!Array.isArray(examples)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Examples must be an array' 
      });
    }
    
    const patchObj = {
      'claude-code': {
        projects: {
          [projectPath]: {
            examples: examples
          }
        }
      }
    };
    
    const result = await core.patch(patchObj);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to update examples: ${errorMessage}`
    });
  }
});

// Codex History API endpoints
app.get('/api/codex/history', async (_req, res) => {
  try {
    const codexHistoryPath = path.join(process.env.HOME || '/tmp', '.codex', 'history.json');
    
    try {
      const content = await fs.readFile(codexHistoryPath, 'utf8');
      const history = JSON.parse(content);
      res.json({ 
        success: true, 
        history: Array.isArray(history) ? history : [],
        path: codexHistoryPath,
        exists: true
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.json({ 
          success: true, 
          history: [], 
          path: codexHistoryPath,
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
      error: `Failed to read history: ${errorMessage}`
    });
  }
});

app.delete('/api/codex/history', async (_req, res) => {
  try {
    const codexHistoryPath = path.join(process.env.HOME || '/tmp', '.codex', 'history.json');
    
    try {
      await fs.unlink(codexHistoryPath);
      res.json({ 
        success: true, 
        message: 'History cleared successfully'
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.json({ 
          success: true, 
          message: 'History file not found (already cleared)'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to clear history: ${errorMessage}`
    });
  }
});

// Codex Sessions API endpoints  
app.get('/api/codex/sessions', async (_req, res) => {
  try {
    const sessionsDir = path.join(process.env.HOME || '/tmp', '.codex', 'sessions');
    
    try {
      const files = await fs.readdir(sessionsDir);
      const sessions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(sessionsDir, file);
          const stats = await fs.stat(filePath);
          sessions.push({
            filename: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          });
        }
      }
      
      // Sort by modification time, newest first
      sessions.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      
      res.json({ 
        success: true, 
        sessions: sessions,
        path: sessionsDir,
        exists: true
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.json({ 
          success: true, 
          sessions: [], 
          path: sessionsDir,
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
      error: `Failed to list sessions: ${errorMessage}`
    });
  }
});

app.get('/api/codex/sessions/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const sessionsDir = path.join(process.env.HOME || '/tmp', '.codex', 'sessions');
    const filePath = path.join(sessionsDir, filename);
    
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(content);
      res.json({ 
        success: true, 
        session: session,
        filename: filename,
        path: filePath
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.status(404).json({ 
          success: false, 
          error: 'Session file not found'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to read session: ${errorMessage}`
    });
  }
});

app.delete('/api/codex/sessions/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const sessionsDir = path.join(process.env.HOME || '/tmp', '.codex', 'sessions');
    const filePath = path.join(sessionsDir, filename);
    
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }
    
    try {
      await fs.unlink(filePath);
      res.json({ 
        success: true, 
        message: `Session ${filename} deleted successfully`
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.status(404).json({ 
          success: false, 
          error: 'Session file not found'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      success: false, 
      error: `Failed to delete session: ${errorMessage}`
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
    try {
      res.write('data: {"type":"ping"}\n\n');
    } catch (error) {
      // Client disconnected, clean up
      clearInterval(keepAlive);
      connectedClients = connectedClients.filter(client => client !== res);
    }
  }, 30000);

  const cleanup = () => {
    clearInterval(keepAlive);
    connectedClients = connectedClients.filter(client => client !== res);
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
  
  // Send initial ping to establish connection
  res.write('data: {"type":"ping"}\n\n');
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
      const detectedCount = Object.values(initialState).filter((engine: any) => engine._meta?.detected).length;
      const totalCount = Object.keys(initialState).length;
      console.log(`   Detected ${detectedCount} configuration engines (${totalCount} supported)`);
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