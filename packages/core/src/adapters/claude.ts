import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  id = 'claude-code';
  name = 'Claude Code CLI';
  configPath = '~/.claude.json';
  
  schema = {
    type: 'object',
    additionalProperties: true, // Allow unknown properties from real config
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
        additionalProperties: true, // Allow unknown OAuth properties
        properties: {
          accountUuid: { 
            type: 'string', 
            description: 'Unique account identifier' 
          },
          emailAddress: { 
            type: 'string', 
            description: 'Account email address' 
          },
          organizationUuid: { 
            type: 'string', 
            description: 'Organization unique identifier' 
          },
          organizationRole: { 
            type: 'string', 
            description: 'Role within the organization (e.g., admin, member)' 
          },
          workspaceRole: { 
            type: ['string', 'null'], 
            description: 'Role within the workspace (can be null)' 
          },
          organizationName: { 
            type: 'string', 
            description: 'Name of the organization' 
          }
        },
        description: 'OAuth account information including user and organization details'
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
        type: ['string', 'number'], 
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
          additionalProperties: true, // Allow unknown project properties
          properties: {
            // Runtime data (read-only)
            lastRun: { 
              type: 'string', 
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
            
            // Session and cost tracking (read-only)
            lastCost: {
              type: 'number',
              description: 'Cost of the last session'
            },
            lastAPIDuration: {
              type: 'number',
              description: 'API duration of the last session in milliseconds'
            },
            lastDuration: {
              type: 'number',
              description: 'Total duration of the last session in milliseconds'
            },
            lastLinesAdded: {
              type: 'number',
              description: 'Lines added in the last session'
            },
            lastLinesRemoved: {
              type: 'number',
              description: 'Lines removed in the last session'
            },
            lastTotalInputTokens: {
              type: 'number',
              description: 'Total input tokens used in the last session'
            },
            lastTotalOutputTokens: {
              type: 'number',
              description: 'Total output tokens generated in the last session'
            },
            lastTotalCacheCreationInputTokens: {
              type: 'number',
              description: 'Cache creation input tokens in the last session'
            },
            lastTotalCacheReadInputTokens: {
              type: 'number',
              description: 'Cache read input tokens in the last session'
            },
            lastSessionId: {
              type: 'string',
              description: 'Unique identifier for the last session'
            },
            
            // Project configuration (editable)
            allowedTools: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tools allowed for this project'
            },
            
            // MCP context and server configuration
            mcpContextUris: {
              type: 'array',
              items: { type: 'string' },
              description: 'Context URIs for MCP servers'
            },
            enabledMcpjsonServers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Enabled MCP JSON servers'
            },
            disabledMcpjsonServers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Disabled MCP JSON servers'
            },
            
            // Trust and security settings
            hasTrustDialogAccepted: {
              type: 'boolean',
              description: 'Whether the trust dialog has been accepted for this project'
            },
            hasClaudeMdExternalIncludesApproved: {
              type: 'boolean',
              description: 'Whether external includes in CLAUDE.md have been approved'
            },
            hasClaudeMdExternalIncludesWarningShown: {
              type: 'boolean',
              description: 'Whether the external includes warning has been shown'
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
    }
  };

  protected parseConfig(content: string): any {
    return JSON.parse(content);
  }

  protected serializeConfig(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}