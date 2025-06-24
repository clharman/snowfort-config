import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  id = 'claude-code';
  name = 'Claude Code CLI';
  configPath = '~/.claude.json';
  
  schema = {
    type: 'object',
    properties: {
      api_key: { type: 'string' },
      model: { type: 'string' },
      max_project_files: { type: 'number' },
      verbose: { type: 'boolean' },
      bypassPermissionsModeAccepted: { type: 'boolean' },
      tipsHistory: {
        type: 'object',
        additionalProperties: { type: 'number' }
      },
      completedOnboarding: { type: 'boolean' },
      projects: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            lastRun: { type: 'string' },
            cost: { type: 'number' },
            duration: { type: 'number' },
            allowedTools: {
              type: 'array',
              items: { type: 'string' }
            },
            mcpServers: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  command: { type: 'string' },
                  args: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
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
}