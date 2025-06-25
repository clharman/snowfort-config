import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { useCore } from '../hooks/useCore.js';
import fs from 'fs/promises';
import path from 'path';

export function Dashboard() {
  const { state, loading, error, patch } = useCore();
  const { stdout } = useStdout();
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState('global');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectSection, setSelectedProjectSection] = useState('mcp');
  const [editingMode, setEditingMode] = useState(false);
  const [selectedSettingIndex, setSelectedSettingIndex] = useState(0);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [mcpFormMode, setMcpFormMode] = useState<'none' | 'add' | 'edit' | 'delete'>('none');
  const [mcpFormData, setMcpFormData] = useState({ name: '', command: '', args: '', env: '' });
  const [mcpFormField, setMcpFormField] = useState(0); // 0: name, 1: command, 2: args, 3: env
  const [claudeMdMode, setClaudeMdMode] = useState<'none' | 'view' | 'edit'>('none');
  const [claudeMdContent, setClaudeMdContent] = useState('');
  const [claudeMdExists, setClaudeMdExists] = useState(false);
  const [claudeMdEditContent, setClaudeMdEditContent] = useState('');
  const [claudeMdEditLine, setClaudeMdEditLine] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpMode, setHelpMode] = useState(false);
  const [stringEditMode, setStringEditMode] = useState<{key: string, value: string, type: 'string' | 'number'} | null>(null);
  const [arrayEditMode, setArrayEditMode] = useState<{key: string, value: string[]} | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const engines = Object.entries(state).filter(([key]) => !key.startsWith('_'));
  
  // Always show both Claude Code and Codex, even if not detected
  const allSupportedEngines = [
    { id: 'claude-code', name: 'Claude Code', detected: engines.find(([id]) => id === 'claude-code')?.[1]?._meta?.detected },
    { id: 'codex', name: 'OpenAI Codex', detected: engines.find(([id]) => id === 'codex')?.[1]?._meta?.detected }
  ];
  
  // Get only detected engines for functionality (backwards compatibility)
  const availableEngines = engines.filter(([engineId, engineData]) => {
    return (engineId === 'claude-code' || engineId === 'codex') && engineData._meta?.detected;
  });

  // Auto-select first engine on load (prefer claude-code, fallback to codex)
  useEffect(() => {
    if (!selectedEngine) {
      const claudeCode = allSupportedEngines.find(engine => engine.id === 'claude-code');
      const codex = allSupportedEngines.find(engine => engine.id === 'codex');
      
      if (claudeCode) {
        setSelectedEngine('claude-code');
      } else if (codex) {
        setSelectedEngine('codex');
      }
    }
  }, [selectedEngine]);

  // Get current engine data and projects
  const currentEngineData = selectedEngine ? state[selectedEngine] : null;
  const projects = currentEngineData?.projects ? Object.keys(currentEngineData.projects) : [];
  
  // Get editable settings for current context
  const getEditableSettings = () => {
    if (!currentEngineData) return [];
    
    if (isProjectMode && selectedProject) {
      const projectData = currentEngineData.projects[selectedProject];
      if (!projectData) return [];
      
      switch (selectedProjectSection) {
        case 'mcp':
          const mcpServers = projectData.mcpServers || {};
          const mcpSettings = [
            { key: 'hasTrustDialogAccepted', label: 'Trust Dialog Accepted', type: 'boolean', value: projectData.hasTrustDialogAccepted },
            { key: 'hasCompletedProjectOnboarding', label: 'Project Onboarding Complete', type: 'boolean', value: projectData.hasCompletedProjectOnboarding },
            { key: 'hasClaudeMdExternalIncludesApproved', label: 'CLAUDE.md External Includes Approved', type: 'boolean', value: projectData.hasClaudeMdExternalIncludesApproved }
          ].filter(s => s.value !== undefined);
          
          // Add MCP servers with detailed information
          const serverEntries = Object.entries(mcpServers).map(([name, config], index) => ({
            key: `mcpServers.${name}`,
            label: `MCP Server: ${name}`,
            type: 'mcp-server' as const,
            value: config,
            serverName: name
          }));
          
          // Add MCP context and server status display
          const mcpContextSettings = [];
          if (projectData.mcpContextUris && Array.isArray(projectData.mcpContextUris)) {
            mcpContextSettings.push({
              key: 'mcpContextUris',
              label: 'MCP Context URIs',
              type: 'array',
              value: projectData.mcpContextUris
            });
          }
          if (projectData.enabledMcpjsonServers && Array.isArray(projectData.enabledMcpjsonServers)) {
            mcpContextSettings.push({
              key: 'enabledMcpjsonServers',
              label: 'Enabled MCP JSON Servers',
              type: 'array',
              value: projectData.enabledMcpjsonServers
            });
          }
          if (projectData.disabledMcpjsonServers && Array.isArray(projectData.disabledMcpjsonServers)) {
            mcpContextSettings.push({
              key: 'disabledMcpjsonServers',
              label: 'Disabled MCP JSON Servers',
              type: 'array',
              value: projectData.disabledMcpjsonServers
            });
          }
          
          return [
            ...mcpSettings,
            ...mcpContextSettings,
            ...serverEntries,
            { key: '__add_mcp__', label: '+ Add MCP Server', type: 'action' as const, value: 'add' },
            { key: '__edit_mcp_json__', label: '📝 Edit Raw MCP JSON', type: 'action' as const, value: 'edit_json' }
          ];
        case 'tools':
          return [
            { key: 'allowedTools', label: 'Allowed Tools', type: 'array', value: projectData.allowedTools || [] }
          ];
        case 'performance':
          const performanceSettings = [];
          
          // Add session metrics
          if (projectData.history && Array.isArray(projectData.history)) {
            performanceSettings.push({
              key: 'history.count',
              label: 'Conversation History Count',
              type: 'readonly',
              value: projectData.history.length
            });
          }
          
          if (projectData.projectOnboardingSeenCount !== undefined) {
            performanceSettings.push({
              key: 'projectOnboardingSeenCount',
              label: 'Project Onboarding Seen Count',
              type: 'readonly',
              value: projectData.projectOnboardingSeenCount
            });
          }
          
          if (projectData.exampleFilesGeneratedAt) {
            performanceSettings.push({
              key: 'exampleFilesGeneratedAt',
              label: 'Example Files Generated At',
              type: 'readonly',
              value: new Date(projectData.exampleFilesGeneratedAt).toLocaleString()
            });
          }
          
          if (projectData.exampleFiles && Array.isArray(projectData.exampleFiles)) {
            performanceSettings.push({
              key: 'exampleFiles.count',
              label: 'Example Files Count',
              type: 'readonly',
              value: projectData.exampleFiles.length
            });
          }
          
          return performanceSettings;
        case 'history':
          if (projectData.history && Array.isArray(projectData.history)) {
            return projectData.history.slice(0, 10).map((item: any, index: number) => ({
              key: `history.${index}`,
              label: `Entry ${index + 1}`,
              type: 'readonly',
              value: item?.display?.slice(0, 60) + (item?.display?.length > 60 ? '...' : '') || 'N/A'
            }));
          }
          return [];
        case 'claude-md':
          return [
            { key: 'hasClaudeMdExternalIncludesApproved', label: 'External Includes Approved', type: 'boolean', value: projectData.hasClaudeMdExternalIncludesApproved },
            { key: 'hasClaudeMdExternalIncludesWarningShown', label: 'External Includes Warning Shown', type: 'boolean', value: projectData.hasClaudeMdExternalIncludesWarningShown },
            { key: '__edit_claude_md__', label: '📝 Edit CLAUDE.md File', type: 'action', value: 'edit' }
          ].filter(s => s.type === 'action' || s.value !== undefined);
        case 'ignore-patterns':
          return [
            { key: 'ignorePatterns', label: 'Ignore Patterns', type: 'array', value: projectData.ignorePatterns || [] },
            { key: '__add_ignore_pattern__', label: '+ Add Ignore Pattern', type: 'action', value: 'add' }
          ];
        case 'examples':
          const exampleSettings = [];
          if (projectData.exampleFiles && Array.isArray(projectData.exampleFiles)) {
            exampleSettings.push({
              key: 'exampleFiles',
              label: 'Example Files',
              type: 'array',
              value: projectData.exampleFiles
            });
          }
          if (projectData.exampleFilesGeneratedAt) {
            exampleSettings.push({
              key: 'exampleFilesGeneratedAt',
              label: 'Generated At',
              type: 'readonly',
              value: new Date(projectData.exampleFilesGeneratedAt).toLocaleString()
            });
          }
          return exampleSettings;
        default:
          return [];
      }
    } else {
      // Global settings - Complete implementation matching web version
      const globalSettings = [];
      
      // Updates & Version Section
      if (currentEngineData.autoUpdates !== undefined) {
        globalSettings.push({ key: 'autoUpdates', label: 'Automatic Updates', type: 'boolean', value: currentEngineData.autoUpdates, section: 'Updates & Version' });
      }
      if (currentEngineData.hasCompletedOnboarding !== undefined) {
        globalSettings.push({ key: 'hasCompletedOnboarding', label: 'Completed Onboarding', type: 'boolean', value: currentEngineData.hasCompletedOnboarding, section: 'Updates & Version' });
      }
      if (currentEngineData.installMethod !== undefined) {
        globalSettings.push({ key: 'installMethod', label: 'Install Method', type: 'readonly', value: currentEngineData.installMethod, section: 'Updates & Version' });
      }
      if (currentEngineData.lastOnboardingVersion !== undefined) {
        globalSettings.push({ key: 'lastOnboardingVersion', label: 'Last Onboarding Version', type: 'readonly', value: currentEngineData.lastOnboardingVersion, section: 'Updates & Version' });
      }
      
      // Permissions & Warnings Section
      if (currentEngineData.fallbackAvailableWarningThreshold !== undefined) {
        globalSettings.push({ key: 'fallbackAvailableWarningThreshold', label: 'Fallback Warning Threshold', type: 'number', value: currentEngineData.fallbackAvailableWarningThreshold, section: 'Permissions & Warnings' });
      }
      if (currentEngineData.bypassPermissionsModeAccepted !== undefined) {
        globalSettings.push({ key: 'bypassPermissionsModeAccepted', label: 'Bypass Permissions Mode Accepted', type: 'boolean', value: currentEngineData.bypassPermissionsModeAccepted, section: 'Permissions & Warnings' });
      }
      
      // Keyboard & Terminal Integration Section
      if (currentEngineData.optionAsMetaKeyInstalled !== undefined) {
        globalSettings.push({ key: 'optionAsMetaKeyInstalled', label: 'Option as Meta Key', type: 'boolean', value: currentEngineData.optionAsMetaKeyInstalled, section: 'Keyboard & Terminal' });
      }
      if (currentEngineData.appleTerminalSetupInProgress !== undefined) {
        globalSettings.push({ key: 'appleTerminalSetupInProgress', label: 'Terminal Setup In Progress', type: 'readonly', value: currentEngineData.appleTerminalSetupInProgress, section: 'Keyboard & Terminal' });
      }
      if (currentEngineData.appleTerminalBackupPath !== undefined) {
        globalSettings.push({ key: 'appleTerminalBackupPath', label: 'Terminal Backup Path', type: 'readonly', value: currentEngineData.appleTerminalBackupPath, section: 'Keyboard & Terminal' });
      }
      
      // Usage & Tips Section
      if (currentEngineData.numStartups !== undefined) {
        globalSettings.push({ key: 'numStartups', label: 'Number of Startups', type: 'number', value: currentEngineData.numStartups, section: 'Usage & Tips' });
      }
      if (currentEngineData.promptQueueUseCount !== undefined) {
        globalSettings.push({ key: 'promptQueueUseCount', label: 'Prompt Queue Use Count', type: 'number', value: currentEngineData.promptQueueUseCount, section: 'Usage & Tips' });
      }
      if (currentEngineData.subscriptionNoticeCount !== undefined) {
        globalSettings.push({ key: 'subscriptionNoticeCount', label: 'Subscription Notice Count', type: 'number', value: currentEngineData.subscriptionNoticeCount, section: 'Usage & Tips' });
      }
      if (currentEngineData.hasAvailableSubscription !== undefined) {
        globalSettings.push({ key: 'hasAvailableSubscription', label: 'Has Available Subscription', type: 'boolean', value: currentEngineData.hasAvailableSubscription, section: 'Usage & Tips' });
      }
      
      // User & Account Section
      if (currentEngineData.userID !== undefined) {
        globalSettings.push({ key: 'userID', label: 'User ID', type: 'readonly', value: currentEngineData.userID, section: 'User & Account' });
      }
      if (currentEngineData.firstStartTime !== undefined) {
        globalSettings.push({ key: 'firstStartTime', label: 'First Start Time', type: 'readonly', value: new Date(currentEngineData.firstStartTime).toLocaleString(), section: 'User & Account' });
      }
      
      // OAuth Account Section (when available)
      if (currentEngineData.oauthAccount) {
        const oauth = currentEngineData.oauthAccount;
        if (oauth.emailAddress) globalSettings.push({ key: 'oauthAccount.emailAddress', label: 'Email Address', type: 'readonly', value: oauth.emailAddress, section: 'OAuth Account' });
        if (oauth.organizationName) globalSettings.push({ key: 'oauthAccount.organizationName', label: 'Organization Name', type: 'readonly', value: oauth.organizationName, section: 'OAuth Account' });
        if (oauth.organizationRole) globalSettings.push({ key: 'oauthAccount.organizationRole', label: 'Organization Role', type: 'readonly', value: oauth.organizationRole, section: 'OAuth Account' });
        if (oauth.workspaceRole) globalSettings.push({ key: 'oauthAccount.workspaceRole', label: 'Workspace Role', type: 'readonly', value: oauth.workspaceRole, section: 'OAuth Account' });
        if (oauth.accountUuid) globalSettings.push({ key: 'oauthAccount.accountUuid', label: 'Account UUID', type: 'readonly', value: oauth.accountUuid, section: 'OAuth Account' });
        if (oauth.organizationUuid) globalSettings.push({ key: 'oauthAccount.organizationUuid', label: 'Organization UUID', type: 'readonly', value: oauth.organizationUuid, section: 'OAuth Account' });
      }
      
      return globalSettings;
    }
  };

  const editableSettings = getEditableSettings();
  
  // Filter settings based on search query
  const filteredSettings = searchQuery 
    ? editableSettings.filter((setting: any) => 
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(setting.value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : editableSettings;

  // Function to load CLAUDE.md content
  const loadClaudeMd = async (projectPath: string) => {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      const content = await fs.readFile(claudeMdPath, 'utf8');
      setClaudeMdContent(content);
      setClaudeMdExists(true);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        setClaudeMdContent('# CLAUDE.md\n\nThis file provides guidance to Claude Code when working with code in this repository.\n\n## Project Overview\n\nDescribe your project here...\n');
        setClaudeMdExists(false);
      } else {
        console.error('Failed to load CLAUDE.md:', error);
        setClaudeMdContent('');
        setClaudeMdExists(false);
      }
    }
  };

  // Function to save CLAUDE.md content
  const saveClaudeMd = async (projectPath: string, content: string) => {
    try {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      await fs.writeFile(claudeMdPath, content, 'utf8');
      setClaudeMdExists(true);
      return true;
    } catch (error) {
      console.error('Failed to save CLAUDE.md:', error);
      return false;
    }
  };

  useInput(async (input, key) => {
    if (input === 'q' && mcpFormMode === 'none') {
      process.exit(0);
    }
    
    if (input === 'h' && !editingMode && mcpFormMode === 'none' && claudeMdMode === 'none' && !searchMode) {
      setHelpMode(!helpMode);
      return;
    }

    // Handle string/number edit mode
    if (stringEditMode) {
      if (key.escape) {
        setStringEditMode(null);
        return;
      }
      
      if (key.return) {
        // Save the edited value
        if (selectedEngine) {
          let finalValue: any = stringEditMode.value;
          if (stringEditMode.type === 'number') {
            finalValue = parseFloat(stringEditMode.value) || 0;
          }
          
          const patchObj: any = {};
          if (isProjectMode && selectedProject) {
            patchObj[selectedEngine] = {
              projects: {
                [selectedProject]: {
                  [stringEditMode.key]: finalValue
                }
              }
            };
          } else {
            patchObj[selectedEngine] = {
              [stringEditMode.key]: finalValue
            };
          }
          await patch(patchObj);
        }
        setStringEditMode(null);
        return;
      }
      
      if (key.backspace) {
        setStringEditMode(prev => prev ? {...prev, value: prev.value.slice(0, -1)} : null);
        return;
      }
      
      if (input && input.length === 1) {
        if (stringEditMode.type === 'number' && !/[0-9.]/.test(input)) {
          return; // Only allow numbers and decimal point for number fields
        }
        setStringEditMode(prev => prev ? {...prev, value: prev.value + input} : null);
        return;
      }
      
      return;
    }

    // Handle array edit mode
    if (arrayEditMode) {
      if (key.escape) {
        setArrayEditMode(null);
        return;
      }
      
      if (key.return) {
        // Save the edited array
        if (selectedEngine) {
          const patchObj: any = {};
          if (isProjectMode && selectedProject) {
            patchObj[selectedEngine] = {
              projects: {
                [selectedProject]: {
                  [arrayEditMode.key]: arrayEditMode.value
                }
              }
            };
          } else {
            patchObj[selectedEngine] = {
              [arrayEditMode.key]: arrayEditMode.value
            };
          }
          await patch(patchObj);
        }
        setArrayEditMode(null);
        return;
      }
      
      // For arrays, we'll implement a simple comma-separated editing interface
      if (input === 'a') {
        // Add new item - for TUI we'll add a placeholder that user can then edit
        const newItem = `new_item_${arrayEditMode.value.length + 1}`;
        setArrayEditMode(prev => prev ? {...prev, value: [...prev.value, newItem]} : null);
        return;
      }
      
      if (input === 'd') {
        // Delete last item
        setArrayEditMode(prev => prev ? {...prev, value: prev.value.slice(0, -1)} : null);
        return;
      }
      
      return;
    }

    // Handle search mode
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setSearchQuery('');
        return;
      }
      
      if (key.return) {
        setSearchMode(false);
        return;
      }
      
      if (key.backspace) {
        setSearchQuery(prev => prev.slice(0, -1));
        return;
      }
      
      if (input && input.length === 1 && /[a-zA-Z0-9\s]/.test(input)) {
        setSearchQuery(prev => prev + input);
        return;
      }
      
      return;
    }

    if (input === 's' && !editingMode && mcpFormMode === 'none' && claudeMdMode === 'none') {
      setSearchMode(true);
      setSearchQuery('');
      return;
    }

    // Handle CLAUDE.md mode
    if (claudeMdMode !== 'none') {
      if (key.escape) {
        if (claudeMdMode === 'edit') {
          setClaudeMdMode('view');
        } else {
          setClaudeMdMode('none');
        }
        return;
      }
      
      if (claudeMdMode === 'view') {
        if (input === 'e') {
          setClaudeMdMode('edit');
          setClaudeMdEditContent(claudeMdContent);
          setClaudeMdEditLine(0);
        }
        return;
      }
      
      if (claudeMdMode === 'edit') {
        if (key.return && input === undefined) {
          // Save and exit edit mode
          if (selectedProject) {
            const success = await saveClaudeMd(selectedProject, claudeMdEditContent);
            if (success) {
              setClaudeMdContent(claudeMdEditContent);
              setClaudeMdMode('view');
            }
          }
          return;
        }
        
        if (input === 's' && key.ctrl) {
          // Ctrl+S to save without exiting
          if (selectedProject) {
            await saveClaudeMd(selectedProject, claudeMdEditContent);
            setClaudeMdContent(claudeMdEditContent);
          }
          return;
        }
        
        // Simple line-based editing
        if (key.upArrow) {
          const lines = claudeMdEditContent.split('\n');
          setClaudeMdEditLine(Math.max(0, claudeMdEditLine - 1));
          return;
        }
        
        if (key.downArrow) {
          const lines = claudeMdEditContent.split('\n');
          setClaudeMdEditLine(Math.min(lines.length - 1, claudeMdEditLine + 1));
          return;
        }
        
        if (input && input.length === 1) {
          const lines = claudeMdEditContent.split('\n');
          lines[claudeMdEditLine] = (lines[claudeMdEditLine] || '') + input;
          setClaudeMdEditContent(lines.join('\n'));
          return;
        }
        
        if (key.backspace) {
          const lines = claudeMdEditContent.split('\n');
          if (lines[claudeMdEditLine]) {
            lines[claudeMdEditLine] = lines[claudeMdEditLine].slice(0, -1);
            setClaudeMdEditContent(lines.join('\n'));
          }
          return;
        }
        
        return;
      }
      
      return;
    }

    // Handle MCP form mode
    if (mcpFormMode !== 'none') {
      if (key.escape) {
        setMcpFormMode('none');
        setMcpFormData({ name: '', command: '', args: '', env: '' });
        return;
      }
      
      if (key.return && mcpFormMode === 'add') {
        // Save new MCP server
        if (mcpFormData.name && mcpFormData.command && selectedEngine && selectedProject) {
          const serverConfig: any = {
            command: mcpFormData.command
          };
          if (mcpFormData.args) {
            serverConfig.args = mcpFormData.args.split(' ').filter(arg => arg.trim());
          }
          if (mcpFormData.env) {
            const envEntries = mcpFormData.env.split(',').map(entry => entry.trim().split('='));
            serverConfig.env = Object.fromEntries(envEntries.filter(([key, value]) => key && value));
          }
          
          await patch({
            [selectedEngine]: {
              projects: {
                [selectedProject]: {
                  mcpServers: {
                    [mcpFormData.name]: serverConfig
                  }
                }
              }
            }
          });
          
          setMcpFormMode('none');
          setMcpFormData({ name: '', command: '', args: '', env: '' });
        }
        return;
      }
      
      if (key.return && mcpFormMode === 'delete') {
        // Delete MCP server
        const setting = filteredSettings[selectedSettingIndex];
        if (setting?.type === 'mcp-server' && 'serverName' in setting && setting.serverName && selectedEngine && selectedProject) {
          const currentProject = currentEngineData?.projects[selectedProject];
          const updatedServers = { ...currentProject?.mcpServers };
          delete updatedServers[(setting as any).serverName];
          
          await patch({
            [selectedEngine]: {
              projects: {
                [selectedProject]: {
                  mcpServers: updatedServers
                }
              }
            }
          });
          
          setMcpFormMode('none');
        }
        return;
      }
      
      if (key.tab && mcpFormMode === 'add') {
        // Switch between form fields
        setMcpFormField((prev) => (prev + 1) % 4);
        return;
      }
      
      // Handle text input for form fields
      if (mcpFormMode === 'add' && input && input.length === 1) {
        const fields = ['name', 'command', 'args', 'env'] as const;
        const currentField = fields[mcpFormField];
        setMcpFormData(prev => ({
          ...prev,
          [currentField]: prev[currentField] + input
        }));
        return;
      }
      
      if (key.backspace && mcpFormMode === 'add') {
        const fields = ['name', 'command', 'args', 'env'] as const;
        const currentField = fields[mcpFormField];
        setMcpFormData(prev => ({
          ...prev,
          [currentField]: prev[currentField].slice(0, -1)
        }));
        return;
      }
      
      return;
    }

    // Legacy editing mode - removing as we now handle different types properly
    if (editingMode) {
      setEditingMode(false);
      return;
    }

    if (key.return) {
      const setting = filteredSettings[selectedSettingIndex];
      if (setting?.type === 'action' && setting.key === '__add_mcp__') {
        setMcpFormMode('add');
        setMcpFormField(0);
        setMcpFormData({ name: '', command: '', args: '', env: '' });
      } else if (setting?.type === 'action' && setting.key === '__edit_claude_md__') {
        if (selectedProject) {
          await loadClaudeMd(selectedProject);
          setClaudeMdMode('view');
        }
      } else if (setting?.type === 'mcp-server') {
        setMcpFormMode('delete');
      } else if (setting?.type === 'boolean') {
        // Toggle boolean directly
        const patchObj: any = {};
        if (isProjectMode && selectedProject && selectedEngine) {
          patchObj[selectedEngine] = {
            projects: {
              [selectedProject]: {
                [setting.key]: !setting.value
              }
            }
          };
        } else if (selectedEngine) {
          patchObj[selectedEngine] = {
            [setting.key]: !setting.value
          };
        }
        await patch(patchObj);
      } else if (setting?.type === 'string' || setting?.type === 'number') {
        // Enter string/number edit mode
        setStringEditMode({
          key: setting.key,
          value: String(setting.value || ''),
          type: setting.type
        });
      } else if (setting?.type === 'array') {
        // Enter array edit mode
        setArrayEditMode({
          key: setting.key,
          value: Array.isArray(setting.value) ? [...setting.value] : []
        });
      }
      return;
    }

    if (input === 'd' && !editingMode) {
      // Delete MCP server shortcut
      const setting = filteredSettings[selectedSettingIndex];
      if (setting?.type === 'mcp-server') {
        setMcpFormMode('delete');
      }
      return;
    }

    if (input === 'p') {
      // Toggle between global and project mode
      setIsProjectMode(!isProjectMode);
      if (!isProjectMode && projects.length > 0) {
        setSelectedProject(projects[0]);
      }
      return;
    }
    
    // Engine switching with Ctrl+Left/Right (works in any mode) - always allow switching
    if ((key.leftArrow || key.rightArrow) && key.ctrl) {
      const currentIndex = allSupportedEngines.findIndex(engine => engine.id === selectedEngine);
      let newIndex;
      if (key.rightArrow) {
        newIndex = (currentIndex + 1) % allSupportedEngines.length;
      } else {
        newIndex = currentIndex - 1 < 0 ? allSupportedEngines.length - 1 : currentIndex - 1;
      }
      if (allSupportedEngines[newIndex]) {
        setSelectedEngine(allSupportedEngines[newIndex].id);
        setSelectedSettingIndex(0); // Reset selection when switching engines
      }
      return; // Don't process other arrow key logic
    }

    if (key.leftArrow || key.rightArrow) {
      if (isProjectMode) {
        // Switch between project sections
        const sections = ['mcp', 'tools', 'performance', 'history', 'claude-md', 'ignore-patterns', 'examples'];
        const currentIndex = sections.indexOf(selectedProjectSection);
        let newIndex;
        if (key.rightArrow) {
          newIndex = (currentIndex + 1) % sections.length;
        } else {
          newIndex = currentIndex - 1 < 0 ? sections.length - 1 : currentIndex - 1;
        }
        setSelectedProjectSection(sections[newIndex]);
        setSelectedSettingIndex(0);
      } else {
        // In Global mode, left/right switches between global sections if we had them
        // For now, this could be reserved for future global sections
      }
    }

    // Project switching with Shift+Left/Right in project mode
    if (isProjectMode && projects.length > 1 && (key.leftArrow || key.rightArrow) && key.shift) {
      const currentIndex = projects.indexOf(selectedProject || '');
      let newIndex;
      if (key.rightArrow) {
        newIndex = (currentIndex + 1) % projects.length;
      } else {
        newIndex = currentIndex - 1 < 0 ? projects.length - 1 : currentIndex - 1;
      }
      setSelectedProject(projects[newIndex]);
      setSelectedSettingIndex(0);
      return; // Don't process other arrow key logic
    }

    if (key.upArrow || key.downArrow) {
      // Navigate settings
      if (filteredSettings.length > 0) {
        let newIndex;
        if (key.downArrow) {
          newIndex = (selectedSettingIndex + 1) % filteredSettings.length;
        } else {
          newIndex = selectedSettingIndex - 1 < 0 ? filteredSettings.length - 1 : selectedSettingIndex - 1;
        }
        setSelectedSettingIndex(newIndex);
      }
    }

    if (key.tab) {
      // Switch between projects if in project mode
      if (isProjectMode && projects.length > 1) {
        const currentIndex = projects.indexOf(selectedProject || '');
        const newIndex = (currentIndex + 1) % projects.length;
        setSelectedProject(projects[newIndex]);
        setSelectedSettingIndex(0);
      }
    }
  });

  if (loading) {
    return (
      <Box>
        <Text>Loading configurations...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  const renderSettingsList = (maxHeight: number) => {
    if (filteredSettings.length === 0) {
      return (
        <Box>
          <Text dimColor>No settings available for this section</Text>
        </Box>
      );
    }

    // Calculate viewport for settings list - account for borders and pagination info
    const itemsPerPage = Math.max(1, maxHeight - 3); // Reserve space for borders and page info
    const totalPages = Math.ceil(filteredSettings.length / itemsPerPage);
    const currentPage = Math.floor(selectedSettingIndex / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(filteredSettings.length, startIndex + itemsPerPage);
    const visibleSettings = filteredSettings.slice(startIndex, endIndex);

    return (
      <Box flexDirection="column" height={maxHeight}>
        <Box flexDirection="column" flexGrow={1}>
          {visibleSettings.map((setting: any, localIndex: number) => {
            const actualIndex = startIndex + localIndex;
            const isSelected = actualIndex === selectedSettingIndex;
            const isEditing = isSelected && editingMode;
          
          return (
            <Box key={setting.key} marginBottom={1}>
              <Box width={40}>
                <Text color={isSelected ? 'blue' : undefined} bold={isSelected}>
                  {isSelected ? '> ' : '  '}{setting.label}:
                </Text>
              </Box>
              <Box>
                {setting.type === 'boolean' ? (
                  <Text color={isEditing ? 'yellow' : (setting.value ? 'green' : 'red')} bold={isEditing}>
                    {isEditing ? `[${setting.value ? 'ON' : 'OFF'}] (Press Enter to toggle)` : (setting.value ? 'ON' : 'OFF')}
                  </Text>
                ) : setting.type === 'array' ? (
                  <Text color={isSelected ? 'blue' : 'dimWhite'}>
                    [{(setting.value as string[]).join(', ')}]
                  </Text>
                ) : setting.type === 'mcp-server' ? (
                  <Box flexDirection="column">
                    <Text color={isSelected ? 'cyan' : 'dimWhite'}>
                      Command: {(setting.value as any)?.command || 'N/A'}
                    </Text>
                    {(setting.value as any)?.args && (
                      <Text dimColor>Args: {(setting.value as any).args.join(' ')}</Text>
                    )}
                    {isSelected && (
                      <Text dimColor>Press Enter to delete, D for quick delete</Text>
                    )}
                  </Box>
                ) : setting.type === 'action' ? (
                  <Text color={isSelected ? 'green' : 'dimWhite'} bold={isSelected}>
                    {isSelected ? '(Press Enter)' : ''}
                  </Text>
                ) : setting.type === 'readonly' ? (
                  <Text dimColor>{String(setting.value)}</Text>
                ) : setting.type === 'string' || setting.type === 'number' ? (
                  <Box>
                    <Text color={isSelected ? 'blue' : undefined}>
                      {String(setting.value)}
                    </Text>
                    {isSelected && (
                      <Text dimColor> (Enter to edit)</Text>
                    )}
                  </Box>
                ) : setting.type === 'array' ? (
                  <Box>
                    <Text color={isSelected ? 'blue' : 'dimWhite'}>
                      [{(setting.value as string[]).join(', ')}]
                    </Text>
                    {isSelected && (
                      <Text dimColor> (Enter to edit)</Text>
                    )}
                  </Box>
                ) : (
                  <Text color={isSelected ? 'blue' : undefined}>{String(setting.value)}</Text>
                )}
              </Box>
            </Box>
          );
        })}
        </Box>
        
        {/* Pagination info at bottom */}
        {totalPages > 1 && (
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text dimColor>
              Page {currentPage + 1} of {totalPages} | Showing {startIndex + 1}-{endIndex} of {filteredSettings.length} settings
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  // Calculate terminal dimensions and layout constraints
  const terminalHeight = stdout.rows || 24;
  const terminalWidth = stdout.columns || 80;
  
  // Reserve space: Header (6 rows) + Status (1 row) + Margins (2 rows)
  const headerHeight = 6;
  const statusHeight = 1;
  const availableContentHeight = Math.max(8, terminalHeight - headerHeight - statusHeight - 2);

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Fixed Header - Always visible */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        {/* Primary navigation line */}
        <Box>
          <Text bold color="white">Snowfort Config</Text>
          <Text> | </Text>
          <Text bold color="blue">
            {selectedEngine === 'claude-code' ? 'Claude Code' : selectedEngine === 'codex' ? 'OpenAI Codex' : 'No Engine'}
            {` (${allSupportedEngines.findIndex(engine => engine.id === selectedEngine) + 1}/${allSupportedEngines.length})`}
          </Text>
          <Text dimColor> [Ctrl+←→]</Text>
          <Text> | </Text>
          <Text bold color={isProjectMode ? 'green' : 'magenta'}>
            {isProjectMode ? 'Project Mode' : 'Global Mode'}
          </Text>
          <Text dimColor> [P]</Text>
          {isProjectMode && selectedProject && (
            <>
              <Text> | </Text>
              <Text color="green">{selectedProject.split('/').pop()}</Text>
              <Text> - </Text>
              <Text color="cyan" bold>{selectedProjectSection.toUpperCase()}</Text>
            </>
          )}
        </Box>
        
        {/* Status/help line */}
        <Box>
          <Text dimColor>
            {stringEditMode ? (
              `EDITING: Type to edit | Enter: Save | Esc: Cancel`
            ) : arrayEditMode ? (
              `ARRAY EDIT: A: Add | D: Remove last | Enter: Save | Esc: Cancel`
            ) : searchMode ? (
              `SEARCH MODE: "${searchQuery}" | Type to filter | Enter: Apply | Esc: Cancel`
            ) : mcpFormMode !== 'none' ? (
              `MCP FORM: Tab: Next field | Enter: Save | Esc: Cancel`
            ) : claudeMdMode !== 'none' ? (
              `CLAUDE.md: ${claudeMdMode} mode | Esc: Close`
            ) : helpMode ? (
              `HELP: Scroll to read | H: Close help`
            ) : isProjectMode ? (
              `Commands: ←→ Sections | Shift+←→ Projects | Ctrl+←→ Engines | ↑↓ Navigate | P: Global | H: Help`
            ) : (
              `Commands: Ctrl+←→ Engines | ↑↓ Navigate | Enter: Edit | P: Projects | S: Search | H: Help | Q: Quit`
            )}
          </Text>
        </Box>
        
        {/* Error indicator */}
        {error && (
          <Box>
            <Text color="red" bold>ERROR: {error}</Text>
          </Box>
        )}
      </Box>

      {/* Content Area - Fixed Height */}
      <Box flexDirection="column" height={availableContentHeight}>
      {!currentEngineData?._meta?.detected ? (
        <Box flexDirection="column" padding={2}>
          <Text bold color="yellow">
            {selectedEngine === 'claude-code' ? 'Claude Code Not Detected' : 'OpenAI Codex Not Detected'}
          </Text>
          <Text></Text>
          <Text>
            {selectedEngine === 'claude-code' 
              ? 'Configure Claude Code to get started:'
              : 'Configure OpenAI Codex to get started:'
            }
          </Text>
          <Text></Text>
          {selectedEngine === 'claude-code' ? (
            <>
              <Text>1. Install Claude Code CLI</Text>
              <Text>2. Run initial setup to create ~/.claude.json</Text>
              <Text>3. Restart this application</Text>
            </>
          ) : (
            <>
              <Text>1. Install OpenAI Codex CLI</Text>
              <Text>2. Run initial setup to create ~/.codex/config.json</Text>
              <Text>3. Restart this application</Text>
            </>
          )}
          <Text></Text>
          <Text dimColor>Use Ctrl+←→ to switch between engines</Text>
        </Box>
      ) : (
        <Box flexDirection="column" height="100%">
          {/* Settings List - Takes up most of available space */}
          {renderSettingsList(availableContentHeight - 2)}
        </Box>
      )}

      {/* Modals - positioned within content area */}
      {mcpFormMode === 'add' && (
        <Box marginTop={1} borderStyle="double" borderColor="blue" padding={1}>
          <Box flexDirection="column">
            <Text bold color="blue">Add MCP Server</Text>
            <Text dimColor>Tab: Next field | Enter: Save | Esc: Cancel</Text>
            <Text></Text>
            
            <Box marginBottom={1}>
              <Box width={15}>
                <Text color={mcpFormField === 0 ? 'yellow' : undefined} bold={mcpFormField === 0}>
                  Server Name:
                </Text>
              </Box>
              <Text color={mcpFormField === 0 ? 'yellow' : 'white'}>
                {mcpFormData.name}{mcpFormField === 0 ? '_' : ''}
              </Text>
            </Box>
            
            <Box marginBottom={1}>
              <Box width={15}>
                <Text color={mcpFormField === 1 ? 'yellow' : undefined} bold={mcpFormField === 1}>
                  Command:
                </Text>
              </Box>
              <Text color={mcpFormField === 1 ? 'yellow' : 'white'}>
                {mcpFormData.command}{mcpFormField === 1 ? '_' : ''}
              </Text>
            </Box>
            
            <Box marginBottom={1}>
              <Box width={15}>
                <Text color={mcpFormField === 2 ? 'yellow' : undefined} bold={mcpFormField === 2}>
                  Args:
                </Text>
              </Box>
              <Text color={mcpFormField === 2 ? 'yellow' : 'white'}>
                {mcpFormData.args}{mcpFormField === 2 ? '_' : ''}
              </Text>
            </Box>
            
            <Box marginBottom={1}>
              <Box width={15}>
                <Text color={mcpFormField === 3 ? 'yellow' : undefined} bold={mcpFormField === 3}>
                  Environment:
                </Text>
              </Box>
              <Text color={mcpFormField === 3 ? 'yellow' : 'white'}>
                {mcpFormData.env}{mcpFormField === 3 ? '_' : ''}
              </Text>
            </Box>
            
            <Text dimColor>Environment format: KEY1=value1,KEY2=value2</Text>
          </Box>
        </Box>
      )}

      {mcpFormMode === 'delete' && (
        <Box marginTop={1} borderStyle="double" borderColor="red" padding={1}>
          <Box flexDirection="column">
            <Text bold color="red">Delete MCP Server</Text>
            <Text>Are you sure you want to delete this MCP server?</Text>
            <Text bold>
              {(filteredSettings[selectedSettingIndex] as any)?.serverName}
            </Text>
            <Text dimColor>Enter: Confirm | Esc: Cancel</Text>
          </Box>
        </Box>
      )}

      {/* CLAUDE.md Viewer */}
      {claudeMdMode === 'view' && (
        <Box marginTop={1} borderStyle="double" borderColor="cyan" padding={1}>
          <Box flexDirection="column">
            <Text bold color="cyan">
              CLAUDE.md {claudeMdExists ? '(Exists)' : '(New File)'}
            </Text>
            <Text dimColor>E: Edit with $EDITOR | Esc: Close</Text>
            <Text></Text>
            
            <Box borderStyle="single" borderColor="gray" padding={1} height={15}>
              <Text>
                {claudeMdContent.slice(0, 800)}
                {claudeMdContent.length > 800 ? '\n\n... (truncated)' : ''}
              </Text>
            </Box>
            
            <Box marginTop={1}>
              <Text dimColor>
                File: {selectedProject ? path.join(selectedProject, 'CLAUDE.md') : 'N/A'}
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {claudeMdMode === 'edit' && (
        <Box marginTop={1} borderStyle="double" borderColor="yellow" padding={1}>
          <Box flexDirection="column">
            <Text bold color="yellow">Edit CLAUDE.md - Line {claudeMdEditLine + 1}</Text>
            <Text dimColor>↑↓: Navigate | Type: Edit | Enter: Save & Exit | Ctrl+S: Save | Esc: Cancel</Text>
            <Text></Text>
            
            <Box borderStyle="single" borderColor="gray" padding={1} height={10}>
              <Box flexDirection="column">
                {claudeMdEditContent.split('\n').map((line, index) => (
                  <Text key={index} color={index === claudeMdEditLine ? 'yellow' : undefined}>
                    {index === claudeMdEditLine ? '> ' : '  '}{line}
                    {index === claudeMdEditLine ? '_' : ''}
                  </Text>
                )).slice(Math.max(0, claudeMdEditLine - 5), claudeMdEditLine + 5)}
              </Box>
            </Box>
            
            <Box marginTop={1}>
              <Text dimColor>
                Line {claudeMdEditLine + 1} of {claudeMdEditContent.split('\n').length}
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Help Modal */}
      {helpMode && (
        <Box marginTop={1} borderStyle="double" borderColor="green" padding={1}>
          <Box flexDirection="column">
            <Text bold color="green">Snowfort Config - Help</Text>
            <Text></Text>
            
            <Text bold>Navigation:</Text>
            <Text>  ↑↓: Navigate Settings | P: Toggle Global ↔ Projects mode</Text>
            <Text></Text>
            
            <Text bold>Engine Switching (Claude Code, Codex, etc.):</Text>
            <Text>  Ctrl+←→: Switch between detected engines</Text>
            <Text></Text>
            
            <Text bold>Project Mode:</Text>
            <Text>  Tab: Next Project | Shift+←→: Previous/Next Project</Text>
            <Text>  ←→: Switch Project Sections (MCP, Tools, etc.)</Text>
            <Text></Text>
            
            <Text bold>Actions:</Text>
            <Text>  Enter: Edit setting / Activate action</Text>
            <Text>  D: Delete MCP server (when selected)</Text>
            <Text>  S: Search settings</Text>
            <Text>  H: Toggle this help</Text>
            <Text>  Q: Quit</Text>
            <Text></Text>
            
            <Text bold>Project Sections:</Text>
            <Text>  - MCP: Server management and trust settings</Text>
            <Text>  - Tools: Allowed tools configuration</Text>
            <Text>  - Performance: Session metrics and statistics</Text>
            <Text>  - History: Conversation history (read-only)</Text>
            <Text>  - CLAUDE.md: Edit project documentation</Text>
            <Text>  - Ignore Patterns: File ignore configuration</Text>
            <Text>  - Examples: Generated example files</Text>
            <Text></Text>
            
            <Text bold>Features:</Text>
            <Text>  * Configuration editing with real-time sync</Text>
            <Text>  * MCP server management (add/delete)</Text>
            <Text>  * CLAUDE.md file viewing</Text>
            <Text>  * Search across all settings</Text>
            <Text>  * Project subsection navigation</Text>
            <Text></Text>
            
            <Text dimColor>Press H again to close help</Text>
          </Box>
        </Box>
      )}

      {/* String/Number Edit Modal */}
      {stringEditMode && (
        <Box marginTop={1} borderStyle="double" borderColor="yellow" padding={1}>
          <Box flexDirection="column">
            <Text bold color="yellow">
              Edit {stringEditMode.type === 'number' ? 'Number' : 'String'}: {stringEditMode.key}
            </Text>
            <Text dimColor>Type to edit | Enter: Save | Esc: Cancel</Text>
            <Text></Text>
            
            <Box>
              <Text>Value: </Text>
              <Text color="yellow" bold>
                {stringEditMode.value}_
              </Text>
            </Box>
            
            {stringEditMode.type === 'number' && (
              <Text dimColor>Only numbers and decimal points allowed</Text>
            )}
          </Box>
        </Box>
      )}

      {/* Array Edit Modal */}
      {arrayEditMode && (
        <Box marginTop={1} borderStyle="double" borderColor="cyan" padding={1}>
          <Box flexDirection="column">
            <Text bold color="cyan">Edit Array: {arrayEditMode.key}</Text>
            <Text dimColor>A: Add item | D: Remove last | Enter: Save | Esc: Cancel</Text>
            <Text></Text>
            
            <Text>Items ({arrayEditMode.value.length}):</Text>
            {arrayEditMode.value.map((item, index) => (
              <Text key={index} dimColor>  {index + 1}. {item}</Text>
            ))}
            
            {arrayEditMode.value.length === 0 && (
              <Text dimColor>  (No items - press A to add)</Text>
            )}
          </Box>
        </Box>
      )}
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          {currentEngineData?._meta?.detected ? filteredSettings.length + ' settings' : 'Configure engine to view settings'} | {availableEngines.length}/{allSupportedEngines.length} engines detected | {isProjectMode ? projects.length + ' projects' : 'Global mode'}
        </Text>
      </Box>
    </Box>
  );
}