import { BaseAdapter } from './base.js';

export class ClaudeSettingsAdapter extends BaseAdapter {
  id = 'claude-settings';
  name = 'Claude Code Settings';
  configPath = '~/.claude/settings.json';
  
  schema = {
    type: 'object',
    properties: {
      permissions: {
        type: 'object',
        properties: {
          allowedTools: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of allowed tools'
          },
          deniedTools: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of denied tools'
          }
        },
        additionalProperties: false
      },
      env: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Environment variables for Claude sessions'
      },
      apiKeyHelper: {
        type: 'string',
        description: 'Path to script that generates authentication values'
      },
      cleanupPeriodDays: {
        type: 'number',
        minimum: 1,
        description: 'Number of days to retain chat transcripts'
      },
      includeCoAuthoredBy: {
        type: 'boolean',
        description: 'Include Claude byline in git commits'
      },
      defaultModel: {
        type: 'string',
        description: 'Default model to use for new sessions'
      },
      maxTokens: {
        type: 'number',
        minimum: 1,
        description: 'Maximum tokens per request'
      },
      temperature: {
        type: 'number',
        minimum: 0,
        maximum: 2,
        description: 'Temperature setting for model responses'
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        description: 'Request timeout in milliseconds'
      }
    },
    additionalProperties: true
  };

  protected parseConfig(content: string): any {
    return JSON.parse(content);
  }

  protected serializeConfig(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  // Override detect to check for either global or project-level settings
  async detect(): Promise<boolean> {
    const paths = [
      '~/.claude/settings.json',
      '.claude/settings.json',
      '.claude/settings.local.json'
    ];
    
    for (const path of paths) {
      try {
        const originalPath = this.configPath;
        this.configPath = path;
        const resolvedPath = this.getConfigPath();
        const fs = await import('fs/promises');
        await fs.access(resolvedPath);
        return true; // Keep the found path
      } catch {
        continue;
      }
    }
    
    // Reset to default if none found
    this.configPath = '~/.claude/settings.json';
    return false;
  }

  // Get config path priority for display
  getConfigPaths(): { path: string; type: 'global' | 'shared' | 'local'; description: string }[] {
    return [
      {
        path: '~/.claude/settings.json',
        type: 'global',
        description: 'Global user settings (applies to all projects)'
      },
      {
        path: '.claude/settings.json',
        type: 'shared',
        description: 'Project settings (shared with team, checked into git)'
      },
      {
        path: '.claude/settings.local.json',
        type: 'local',
        description: 'Local project settings (personal, not checked into git)'
      }
    ];
  }

  // Read settings with precedence handling
  async read(): Promise<any> {
    const paths = this.getConfigPaths();
    let mergedSettings = {};

    // Read settings in reverse priority order (global first, local last)
    for (const { path } of paths) {
      try {
        const originalPath = this.configPath;
        this.configPath = path;
        const resolvedPath = this.getConfigPath();
        this.configPath = originalPath; // Restore original
        
        const fs = await import('fs/promises');
        const content = await fs.readFile(resolvedPath, 'utf-8');
        const settings = this.parseConfig(content);
        
        // Merge settings with later files taking precedence
        mergedSettings = { ...mergedSettings, ...settings };
      } catch (error) {
        // File doesn't exist or can't be read, continue
        continue;
      }
    }

    return mergedSettings;
  }
}