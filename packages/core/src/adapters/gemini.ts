import { BaseAdapter } from './base.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class GeminiAdapter extends BaseAdapter {
  id = 'gemini';
  name = 'Gemini CLI';
  configPath = '~/.gemini/settings.json';
  
  schema = {
    type: 'object',
    additionalProperties: true, // Allow unknown properties from real config
    properties: {
      // Core visual and interaction settings
      theme: { 
        type: 'string', 
        description: 'Visual theme for Gemini CLI',
        enum: ['Default', 'GitHub', 'Dark', 'Light']
      },
      selectedAuthType: { 
        type: 'string', 
        description: 'Authentication method',
        enum: ['oauth-personal', 'oauth-workspace', 'api-key']
      },
      contextFileName: { 
        type: 'string', 
        description: 'Name of context file to use (default: GEMINI.md)' 
      },
      preferredEditor: { 
        type: 'string', 
        description: 'Preferred editor for diffs and editing',
        enum: ['vscode', 'vim', 'nano', 'emacs', 'cursor']
      },
      
      // Sandbox and execution settings
      sandbox: { 
        type: ['boolean', 'string'], 
        description: 'Sandboxing configuration (true/false or sandbox type)' 
      },
      autoAccept: { 
        type: 'boolean', 
        description: 'Automatically accept safe tool calls' 
      },
      
      // Tool configuration
      coreTools: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of allowed core tools'
      },
      excludeTools: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of tools to exclude from usage'
      },
      toolDiscoveryCommand: { 
        type: 'string', 
        description: 'Custom command for discovering available tools' 
      },
      toolCallCommand: { 
        type: 'string', 
        description: 'Custom command for calling tools' 
      },
      
      // MCP (Model-Context Protocol) servers
      mcpServers: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            command: { 
              type: 'string',
              description: 'Command to run the MCP server'
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Arguments for the MCP server command'
            },
            env: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Environment variables for the MCP server'
            }
          },
          required: ['command'],
          additionalProperties: true
        },
        description: 'MCP servers configured for this instance'
      },
      
      // State and session management
      checkpointing: { 
        type: 'boolean', 
        description: 'Enable conversation state saving and restoration' 
      },
      
      // Analytics and telemetry
      telemetry: {
        type: 'object',
        properties: {
          enabled: { 
            type: 'boolean', 
            description: 'Enable telemetry data collection' 
          },
          target: { 
            type: 'string', 
            description: 'Target for telemetry data',
            enum: ['local', 'remote', 'none']
          }
        },
        description: 'Telemetry and usage data configuration'
      },
      
      // Advanced configuration
      apiEndpoint: { 
        type: 'string', 
        description: 'Custom API endpoint URL' 
      },
      model: { 
        type: 'string', 
        description: 'Default model to use for conversations' 
      },
      maxTokens: { 
        type: 'number', 
        description: 'Maximum tokens per request' 
      },
      temperature: { 
        type: 'number', 
        description: 'Temperature setting for model responses' 
      },
      
      // Session and conversation settings
      conversationHistory: {
        type: 'object',
        properties: {
          maxEntries: { 
            type: 'number', 
            description: 'Maximum number of conversation entries to retain' 
          },
          saveToFile: { 
            type: 'boolean', 
            description: 'Save conversation history to file' 
          },
          filePath: { 
            type: 'string', 
            description: 'Path to conversation history file' 
          }
        },
        description: 'Conversation history management settings'
      },
      
      // Legacy and compatibility fields
      verbose: { 
        type: 'boolean', 
        description: 'Enable verbose logging output' 
      },
      debug: { 
        type: 'boolean', 
        description: 'Enable debug mode' 
      }
    }
  };

  async read(): Promise<any> {
    // Read the main settings file
    const mainConfig = await super.read();
    
    const geminiDir = path.join(os.homedir(), '.gemini');
    
    // Try to read oauth_creds.json
    try {
      const oauthPath = path.join(geminiDir, 'oauth_creds.json');
      const oauthContent = await fs.readFile(oauthPath, 'utf8');
      const oauthData = JSON.parse(oauthContent);
      mainConfig._oauth = {
        hasCredentials: true,
        tokenType: oauthData.token_type,
        scope: oauthData.scope,
        expiryDate: oauthData.expiry_date ? new Date(oauthData.expiry_date).toISOString() : null,
        // Don't expose sensitive tokens
        hasAccessToken: !!oauthData.access_token,
        hasRefreshToken: !!oauthData.refresh_token,
        hasIdToken: !!oauthData.id_token
      };
    } catch (error) {
      mainConfig._oauth = { hasCredentials: false };
    }
    
    // Try to read user_id
    try {
      const userIdPath = path.join(geminiDir, 'user_id');
      const userId = await fs.readFile(userIdPath, 'utf8');
      mainConfig._userId = userId.trim();
    } catch (error) {
      mainConfig._userId = null;
    }
    
    // Try to read session logs from tmp directories
    try {
      const tmpDir = path.join(geminiDir, 'tmp');
      const tmpDirs = await fs.readdir(tmpDir);
      const sessions = [];
      
      for (const dir of tmpDirs) {
        try {
          const logsPath = path.join(tmpDir, dir, 'logs.json');
          const logsContent = await fs.readFile(logsPath, 'utf8');
          const logs = JSON.parse(logsContent);
          
          sessions.push({
            sessionDir: dir,
            messageCount: logs.length,
            firstMessage: logs.length > 0 ? logs[0] : null,
            lastMessage: logs.length > 0 ? logs[logs.length - 1] : null
          });
        } catch (logError) {
          // Skip directories without valid logs.json
        }
      }
      
      mainConfig._sessions = sessions;
    } catch (error) {
      mainConfig._sessions = [];
    }
    
    // Try to read GEMINI.md context file
    try {
      const contextPath = path.join(geminiDir, 'GEMINI.md');
      const contextContent = await fs.readFile(contextPath, 'utf8');
      mainConfig._contextFile = {
        exists: true,
        path: contextPath,
        content: contextContent,
        size: contextContent.length
      };
    } catch (error) {
      mainConfig._contextFile = {
        exists: false,
        path: path.join(geminiDir, 'GEMINI.md'),
        content: '',
        size: 0
      };
    }
    
    return mainConfig;
  }

  protected parseConfig(content: string): any {
    return JSON.parse(content);
  }

  protected serializeConfig(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}