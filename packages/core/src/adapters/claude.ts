import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  id = 'claude-code';
  name = 'Claude Code CLI';
  configPath = '~/.claude.json';
  
  schema = {
    type: 'object',
    properties: {
      // Core configuration
      api_key: { type: 'string', description: 'API key for Claude service' },
      model: { type: 'string', description: 'Default model to use' },
      max_project_files: { type: 'number', description: 'Maximum number of project files to include' },
      verbose: { type: 'boolean', description: 'Enable verbose logging' },
      
      // Permissions and onboarding
      bypassPermissionsModeAccepted: { 
        type: 'boolean', 
        description: 'User has accepted bypass permissions mode' 
      },
      hasCompletedOnboarding: { 
        type: 'boolean', 
        description: 'User has completed initial onboarding' 
      },
      lastOnboardingVersion: { 
        type: 'string', 
        description: 'Last onboarding version seen' 
      },
      
      // Session and usage tracking
      firstStartTime: { 
        type: 'string', 
        format: 'date-time',
        description: 'First time Claude Code was started'
      },
      numStartups: { 
        type: 'number', 
        description: 'Number of times Claude Code has been started' 
      },
      installMethod: { 
        type: 'string', 
        description: 'Method used to install Claude Code' 
      },
      
      // Tips and help
      tipsHistory: {
        type: 'object',
        additionalProperties: { type: 'number' },
        description: 'History of tips shown to user'
      },
      lastReleaseNotesSeen: { 
        type: 'string', 
        description: 'Last release notes version seen by user' 
      },
      
      // Subscription and account
      hasAvailableSubscription: { 
        type: 'boolean', 
        description: 'User has available subscription' 
      },
      subscriptionNoticeCount: { 
        type: 'number', 
        description: 'Number of subscription notices shown' 
      },
      oauthAccount: {
        type: 'object',
        description: 'OAuth account information'
      },
      
      // Updates and changelog
      autoUpdates: { 
        type: 'boolean', 
        description: 'Automatic updates enabled' 
      },
      cachedChangelog: { 
        type: 'string', 
        description: 'Cached changelog content' 
      },
      changelogLastFetched: { 
        type: 'string', 
        format: 'date-time',
        description: 'Last time changelog was fetched' 
      },
      
      // System integration
      appleTerminalSetupInProgress: { 
        type: 'boolean', 
        description: 'Apple Terminal setup is in progress' 
      },
      appleTerminalBackupPath: { 
        type: 'string', 
        description: 'Path to Apple Terminal backup' 
      },
      optionAsMetaKeyInstalled: { 
        type: 'boolean', 
        description: 'Option as meta key is installed' 
      },
      
      // Performance and warnings
      fallbackAvailableWarningThreshold: { 
        type: 'number', 
        description: 'Threshold for fallback availability warnings' 
      },
      
      // Projects configuration
      projects: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            // Runtime data (read-only)
            lastRun: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last time this project was used'
            },
            cost: { 
              type: 'number', 
              description: 'Total cost for this project' 
            },
            duration: { 
              type: 'number', 
              description: 'Total duration for this project in seconds' 
            },
            
            // Project configuration (editable)
            allowedTools: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tools allowed for this project'
            },
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
                additionalProperties: false
              },
              description: 'MCP servers configured for this project'
            },
            
            // Conversation history (read-only, can be large)
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  display: { 
                    type: 'string',
                    description: 'Display text for this history entry'
                  },
                  pastedContents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        data: { type: 'string' }
                      }
                    },
                    description: 'Content pasted in this conversation'
                  }
                }
              },
              description: 'Conversation history for this project (can be very large)'
            },
            
            // Project onboarding
            projectOnboardingSeenCount: { 
              type: 'number', 
              description: 'Number of times project onboarding was seen' 
            }
          }
        },
        description: 'Per-project configuration and runtime data'
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