import { BaseAdapter } from './base.js';

export class CodexAdapter extends BaseAdapter {
  id = 'codex';
  name = 'OpenAI Codex CLI';
  configPath = '~/.codex/config.json';
  
  schema = {
    type: 'object',
    properties: {
      // Model & Provider settings
      model: { type: 'string' },
      provider: { type: 'string' },
      providers: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            baseURL: { type: 'string' },
            envKey: { type: 'string' }
          }
        }
      },
      
      // Conversation Storage settings
      disableResponseStorage: { type: 'boolean' },
      history: {
        type: 'object',
        properties: {
          maxSize: { type: 'number' },
          saveHistory: { type: 'boolean' },
          sensitivePatterns: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      
      // Privacy & Redaction settings
      flexMode: { type: 'boolean' },
      reasoningEffort: { 
        type: 'string',
        enum: ['Low', 'Medium', 'High']
      },
      
      // Tools & Resource Limits
      tools: {
        type: 'object',
        properties: {
          shell: {
            type: 'object',
            properties: {
              maxBytes: { type: 'number' },
              maxLines: { type: 'number' }
            }
          }
        }
      },
      
      // Updates & Diagnostics
      lastUpdateCheck: { type: 'string' },
      
      // Legacy fields for backward compatibility
      api_key: { type: 'string' },
      temperature: { type: 'number' },
      max_tokens: { type: 'number' },
      verbose: { type: 'boolean' },
      organization: { type: 'string' },
      proxy: { type: 'string' },
      projects: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            lastRun: { type: 'string' },
            cost: { type: 'number' },
            duration: { type: 'number' },
            model: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                prompt_tokens: { type: 'number' },
                completion_tokens: { type: 'number' },
                total_tokens: { type: 'number' }
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