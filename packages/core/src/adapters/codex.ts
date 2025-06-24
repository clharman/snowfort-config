import { BaseAdapter } from './base.js';

export class CodexAdapter extends BaseAdapter {
  id = 'openai-codex';
  name = 'OpenAI Codex CLI';
  configPath = '~/.codex/config.json';
  
  schema = {
    type: 'object',
    properties: {
      api_key: { type: 'string' },
      model: { type: 'string' },
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