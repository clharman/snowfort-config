
import React, { useState } from 'react';

interface MainContentProps {
  selectedEngine: string | null;
  selectedItem: string | null;
  engines: Array<[string, any]>;
  onToggle: (engineId: string, key: string, value: boolean) => void;
  onArrayUpdate: (engineId: string, key: string, value: string[]) => void;
  onStringUpdate: (engineId: string, key: string, value: string) => void;
  onProjectUpdate: (engineId: string, projectPath: string, updates: any) => void;
}

export function MainContent({
  selectedEngine,
  selectedItem,
  engines,
  onToggle,
  onArrayUpdate: _onArrayUpdate,
  onStringUpdate: _onStringUpdate,
  onProjectUpdate: _onProjectUpdate
}: MainContentProps) {
  // State for editing fields - moved to top level to avoid hooks violations
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  
  // State for MCP server management
  const [editingMcpServer, setEditingMcpServer] = useState<string | null>(null);
  const [showAddMcpForm, setShowAddMcpForm] = useState(false);
  const [newMcpServer, setNewMcpServer] = useState({
    name: '',
    command: '',
    args: '',
    env: ''
  });
  const [showMcpJsonEditor, setShowMcpJsonEditor] = useState(false);
  const [mcpJsonValue, setMcpJsonValue] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  // State for CLAUDE.md file management
  const [claudeMdContent, setClaudeMdContent] = useState<string>('');
  const [claudeMdLoading, setClaudeMdLoading] = useState<boolean>(false);
  const [claudeMdExists, setClaudeMdExists] = useState<boolean>(false);
  const [claudeMdSaving, setClaudeMdSaving] = useState<boolean>(false);
  
  // State for Tool Permissions management
  const [toolsData, setToolsData] = useState<string[]>([]);
  const [toolsLoading, setToolsLoading] = useState<boolean>(false);
  const [newTool, setNewTool] = useState<string>('');
  const [showAddTool, setShowAddTool] = useState<boolean>(false);
  
  // State for Ignore Patterns management
  const [patternsData, setPatternsData] = useState<string[]>([]);
  const [patternsLoading, setPatternsLoading] = useState<boolean>(false);
  const [newPattern, setNewPattern] = useState<string>('');
  const [showAddPattern, setShowAddPattern] = useState<boolean>(false);
  
  // State for Examples management
  const [examplesData, setExamplesData] = useState<Array<{id: string, title: string, description: string, prompt: string}>>([]);
  const [examplesLoading, setExamplesLoading] = useState<boolean>(false);
  const [showAddExample, setShowAddExample] = useState<boolean>(false);
  const [editingExample, setEditingExample] = useState<string | null>(null);
  const [newExample, setNewExample] = useState({title: '', description: '', prompt: ''});
  
  // State for Codex History management
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyExists, setHistoryExists] = useState<boolean>(false);
  
  // State for Codex Sessions management
  const [sessionsData, setSessionsData] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  
  // Load CLAUDE.md content when claude-md section is selected
  React.useEffect(() => {
    const isProjectItem = selectedItem?.startsWith('project-');
    if (isProjectItem && selectedItem?.endsWith('-claude-md')) {
      const parts = selectedItem!.split('-');
      if (parts.length >= 2) {
        try {
          const projectPath = atob(parts[1]);
          loadClaudeMd(projectPath);
        } catch (e) {
          console.error('Failed to decode project path:', e);
        }
      }
    }
  }, [selectedItem]);
  
  // Function to load CLAUDE.md content
  const loadClaudeMd = async (projectPath: string) => {
    setClaudeMdLoading(true);
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/claude-md`);
      const data = await response.json();
      
      if (data.success) {
        setClaudeMdContent(data.content);
        setClaudeMdExists(data.exists);
      } else {
        console.error('Failed to load CLAUDE.md:', data.error);
        setClaudeMdContent('');
        setClaudeMdExists(false);
      }
    } catch (error) {
      console.error('Error loading CLAUDE.md:', error);
      setClaudeMdContent('');
      setClaudeMdExists(false);
    } finally {
      setClaudeMdLoading(false);
    }
  };
  
  // Load data when sections are selected
  React.useEffect(() => {
    const isProjectItem = selectedItem?.startsWith('project-');
    if (isProjectItem) {
      const parts = selectedItem!.split('-');
      if (parts.length >= 2) {
        try {
          const projectPath = atob(parts[1]);
          
          if (selectedItem?.endsWith('-tools')) {
            loadTools(projectPath);
          } else if (selectedItem?.endsWith('-ignore')) {
            loadPatterns(projectPath);
          } else if (selectedItem?.endsWith('-examples')) {
            loadExamples(projectPath);
          }
        } catch (e) {
          console.error('Failed to decode project path:', e);
        }
      }
    } else if (selectedEngine === 'codex') {
      if (selectedItem === 'history-json') {
        loadHistory();
      } else if (selectedItem === 'sessions') {
        loadSessions();
      }
    }
  }, [selectedItem, selectedEngine]);
  
  // Function to load tools
  const loadTools = async (projectPath: string) => {
    setToolsLoading(true);
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/tools`);
      const data = await response.json();
      
      if (data.success) {
        setToolsData(data.tools);
      } else {
        console.error('Failed to load tools:', data.error);
        setToolsData([]);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
      setToolsData([]);
    } finally {
      setToolsLoading(false);
    }
  };
  
  // Function to save tools
  const saveTools = async (projectPath: string, tools: string[]) => {
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };
  
  // Function to load patterns
  const loadPatterns = async (projectPath: string) => {
    setPatternsLoading(true);
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/ignore-patterns`);
      const data = await response.json();
      
      if (data.success) {
        setPatternsData(data.patterns);
      } else {
        console.error('Failed to load patterns:', data.error);
        setPatternsData([]);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
      setPatternsData([]);
    } finally {
      setPatternsLoading(false);
    }
  };
  
  // Function to save patterns
  const savePatterns = async (projectPath: string, patterns: string[]) => {
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/ignore-patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };
  
  // Function to load examples
  const loadExamples = async (projectPath: string) => {
    setExamplesLoading(true);
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/examples`);
      const data = await response.json();
      
      if (data.success) {
        setExamplesData(data.examples);
      } else {
        console.error('Failed to load examples:', data.error);
        setExamplesData([]);
      }
    } catch (error) {
      console.error('Error loading examples:', error);
      setExamplesData([]);
    } finally {
      setExamplesLoading(false);
    }
  };
  
  // Function to save examples
  const saveExamples = async (projectPath: string, examples: any[]) => {
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examples })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };
  
  // Function to load history
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/codex/history');
      const data = await response.json();
      
      if (data.success) {
        setHistoryData(data.history);
        setHistoryExists(data.exists);
      } else {
        console.error('Failed to load history:', data.error);
        setHistoryData([]);
        setHistoryExists(false);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistoryData([]);
      setHistoryExists(false);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Function to clear history
  const clearHistory = async () => {
    try {
      const response = await fetch('/api/codex/history', { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setHistoryData([]);
        setHistoryExists(false);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };
  
  // Function to load sessions
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch('/api/codex/sessions');
      const data = await response.json();
      
      if (data.success) {
        setSessionsData(data.sessions);
      } else {
        console.error('Failed to load sessions:', data.error);
        setSessionsData([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessionsData([]);
    } finally {
      setSessionsLoading(false);
    }
  };
  
  // Function to load session content
  const loadSession = async (filename: string) => {
    try {
      const response = await fetch(`/api/codex/sessions/${filename}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedSession(data.session);
        setShowSessionModal(true);
      } else {
        console.error('Failed to load session:', data.error);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };
  
  // Function to delete session
  const deleteSession = async (filename: string) => {
    try {
      const response = await fetch(`/api/codex/sessions/${filename}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        // Reload sessions list
        loadSessions();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };
  
  // Function to save CLAUDE.md content
  const saveClaudeMd = async (projectPath: string, content: string) => {
    setClaudeMdSaving(true);
    try {
      const encodedPath = btoa(projectPath);
      const response = await fetch(`/api/project/${encodedPath}/claude-md`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClaudeMdExists(true);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    } finally {
      setClaudeMdSaving(false);
    }
  };
  
  if (!selectedEngine || !selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select a Configuration Section
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an engine and settings section from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  const selectedEngineData = engines.find(([id]) => id === selectedEngine)?.[1];
  if (!selectedEngineData?._meta?.detected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Engine Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The selected engine is not detected or configured
          </p>
        </div>
      </div>
    );
  }

  const renderSettingsContent = () => {
    // Decode project path if this is a project-specific item
    const isProjectItem = selectedItem.startsWith('project-');
    let projectPath = '';
    if (isProjectItem) {
      const parts = selectedItem.split('-');
      if (parts.length >= 2) {
        try {
          projectPath = atob(parts[1]);
        } catch (e) {
          console.error('Failed to decode project path:', e);
        }
      }
    }

    const renderBooleanSetting = (key: string, label: string, description?: string) => {
      const value = selectedEngineData[key];
      if (value === undefined) return null;

      return (
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{label}</div>
            {description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
            )}
          </div>
          <button
            onClick={() => onToggle(selectedEngine, key, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    };

    const renderStringSetting = (key: string, label: string, description?: string, editable: boolean = false) => {
      const value = selectedEngineData[key];
      if (value === undefined) return null;

      const isEditing = editingFields[key] || false;
      const editValue = editingValues[key] ?? (value || '');

      const handleSave = () => {
        _onStringUpdate(selectedEngine, key, editValue);
        setEditingFields(prev => ({ ...prev, [key]: false }));
      };

      const handleCancel = () => {
        setEditingValues(prev => ({ ...prev, [key]: value || '' }));
        setEditingFields(prev => ({ ...prev, [key]: false }));
      };

      return (
        <div className="py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{label}</div>
              {description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
              )}
            </div>
            {editable && !isEditing && (
              <button
                onClick={() => {
                  setEditingFields(prev => ({ ...prev, [key]: true }));
                  setEditingValues(prev => ({ ...prev, [key]: value?.toString() || '0' }));
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditingValues(prev => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {value || 'Not set'}
            </div>
          )}
        </div>
      );
    };

    const renderNumberSetting = (key: string, label: string, description?: string, editable: boolean = false) => {
      const value = selectedEngineData[key];
      if (value === undefined) return null;

      const isEditing = editingFields[key] || false;
      const editValue = editingValues[key] ?? (value?.toString() || '0');

      const handleSave = () => {
        const numValue = parseFloat(editValue);
        if (!isNaN(numValue)) {
          _onStringUpdate(selectedEngine, key, numValue.toString());
          setEditingFields(prev => ({ ...prev, [key]: false }));
        }
      };

      const handleCancel = () => {
        setEditingValues(prev => ({ ...prev, [key]: value?.toString() || '0' }));
        setEditingFields(prev => ({ ...prev, [key]: false }));
      };

      return (
        <div className="py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{label}</div>
              {description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
              )}
            </div>
            {editable && !isEditing && (
              <button
                onClick={() => {
                  setEditingFields(prev => ({ ...prev, [key]: true }));
                  setEditingValues(prev => ({ ...prev, [key]: value?.toString() || '0' }));
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditingValues(prev => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          )}
        </div>
      );
    };

    const renderOAuthAccountField = (field: string, label: string, description?: string) => {
      const value = selectedEngineData.oauthAccount?.[field];
      if (value === undefined) return null;

      return (
        <div className="py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white">{label}</div>
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {value}
          </div>
        </div>
      );
    };

    switch (selectedItem) {
      case 'updates-version':
        return (
          <div>
            {renderBooleanSetting('autoUpdates', 'Automatic Updates', 'Turn automatic update checks on/off')}
            {renderStringSetting('installMethod', 'Install Method', 'How Claude Code was installed (brew, npm, unknown, ...)', false)}
            {renderStringSetting('lastOnboardingVersion', 'Last Onboarding Version', undefined, false)}
            {renderBooleanSetting('hasCompletedOnboarding', 'Completed Onboarding', 'Reset to force interactive onboarding again')}
          </div>
        );

      case 'permissions-warnings':
        return (
          <div>
            {renderNumberSetting('fallbackAvailableWarningThreshold', 'Fallback Warning Threshold', '% threshold before Claude warns about model quota', true)}
            {renderBooleanSetting('bypassPermissionsModeAccepted', 'Bypass Permissions Mode Accepted', 'If true, no permission prompts for tool calls')}
          </div>
        );

      case 'keyboard-terminal':
        return (
          <div>
            {renderBooleanSetting('optionAsMetaKeyInstalled', 'Option as Meta Key', 'Whether macOS "⌥ as Meta" key-remap was applied')}
            {renderBooleanSetting('appleTerminalSetupInProgress', 'Terminal Setup In Progress')}
            {renderStringSetting('appleTerminalBackupPath', 'Terminal Backup Path')}
          </div>
        );

      case 'usage-tips':
        return (
          <div>
            {renderNumberSetting('numStartups', 'Number of Startups', 'Counter you may reset to "start fresh"')}
            {renderNumberSetting('promptQueueUseCount', 'Prompt Queue Use Count')}
            {renderNumberSetting('subscriptionNoticeCount', 'Subscription Notice Count')}
            {renderBooleanSetting('hasAvailableSubscription', 'Has Available Subscription')}
          </div>
        );

      case 'readonly-info':
        return (
          <div>
            {renderStringSetting('userID', 'User ID', 'Anonymized hash that ties your installs together')}
            {renderStringSetting('firstStartTime', 'First Start Time', 'Timestamp when you first ran Claude Code')}
            {selectedEngineData.oauthAccount && (
              <>
                {renderOAuthAccountField('emailAddress', 'Email Address', 'Your Claude account email')}
                {renderOAuthAccountField('organizationName', 'Organization Name', 'Your Claude organization')}
                {renderOAuthAccountField('organizationRole', 'Organization Role', 'Your role in the organization')}
                {renderOAuthAccountField('workspaceRole', 'Workspace Role', 'Your role in the workspace')}
                {renderOAuthAccountField('accountUuid', 'Account UUID', 'Your unique account identifier')}
                {renderOAuthAccountField('organizationUuid', 'Organization UUID', 'Your organization identifier')}
              </>
            )}
          </div>
        );

      // Codex-specific settings
      case 'model-provider':
        return (
          <div>
            {renderStringSetting('model', 'Model', 'Choose which OpenAI model Codex should use (e.g. gpt-4o, o4-mini)', true)}
            {renderStringSetting('provider', 'Active Provider', 'Select the active provider key (must match a key inside providers)', true)}
            
            <div className="mt-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Provider Definitions</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure provider definitions (name, baseURL, envKey) that you can add/edit/remove
              </p>
              
              {selectedEngineData.providers && Object.keys(selectedEngineData.providers).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(selectedEngineData.providers).map(([providerKey, provider]: [string, any]) => (
                    <div key={providerKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-gray-900 dark:text-white">{providerKey}</h6>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {provider.name || 'Not set'}</div>
                        <div><span className="font-medium">Base URL:</span> {provider.baseURL || 'Not set'}</div>
                        <div><span className="font-medium">Environment Key:</span> {provider.envKey || 'Not set'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No providers configured</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Provider
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'conversation-storage':
        return (
          <div>
            {renderBooleanSetting('disableResponseStorage', 'Disable Response Storage', 'Toggle whether Codex writes completed responses to disk')}
            {selectedEngineData.history && (
              <>
                {renderNumberSetting('history.maxSize', 'Maximum Messages', 'Maximum messages retained in a session transcript', true)}
                {renderBooleanSetting('history.saveHistory', 'Save History', 'On/off switch for recording conversation history')}
              </>
            )}
          </div>
        );

      case 'privacy-redaction':
        return (
          <div>
            {renderBooleanSetting('flexMode', 'Flex Mode', 'Enable automatic model fallback when quota/limits are reached')}
            {renderStringSetting('reasoningEffort', 'Reasoning Effort', 'Low / Medium / High; controls chain-of-thought depth', true)}
            
            <div className="mt-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Sensitive Patterns</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                List of strings/regexes to redact before storage
              </p>
              
              {selectedEngineData.history?.sensitivePatterns && selectedEngineData.history.sensitivePatterns.length > 0 ? (
                <div className="space-y-2">
                  {selectedEngineData.history.sensitivePatterns.map((pattern: string, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{pattern}</span>
                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  ))}
                  <button className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Pattern
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No sensitive patterns configured</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Pattern
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'tools-resource-limits':
        return (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure resource limits for tools like the Shell tool
            </p>
            
            {selectedEngineData.tools?.shell && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Shell Tool Limits</h5>
                {renderNumberSetting('tools.shell.maxBytes', 'Maximum Bytes', 'Maximum bytes captured by Shell tool', true)}
                {renderNumberSetting('tools.shell.maxLines', 'Maximum Lines', 'Maximum lines captured by Shell tool', true)}
              </div>
            )}
            
            {(!selectedEngineData.tools || !selectedEngineData.tools.shell) && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No tool limits configured</p>
              </div>
            )}
          </div>
        );

      case 'updates-diagnostics':
        return (
          <div>
            {renderStringSetting('lastUpdateCheck', 'Last Update Check', 'Timestamp of the most recent update ping')}
          </div>
        );

      case 'history-json':
        const handleClearHistory = async () => {
          if (!confirm('Are you sure you want to clear all command history? This action cannot be undone.')) {
            return;
          }
          
          const result = await clearHistory();
          if (result.success) {
            alert(result.message);
          } else {
            alert(`Failed to clear history: ${result.error}`);
          }
        };
        
        return (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Quick-command history stored in history.json file
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">History File</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Location: ~/.codex/history.json</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={loadHistory}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={historyLoading}
                  >
                    {historyLoading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button 
                    onClick={handleClearHistory}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={!historyExists || historyData.length === 0}
                  >
                    Clear History
                  </button>
                </div>
              </div>
              
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading history...</div>
                </div>
              ) : historyData.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {historyData.length} command{historyData.length !== 1 ? 's' : ''} in history
                  </div>
                  {historyData.map((command: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <div className="font-mono text-gray-900 dark:text-white">{command.command || command}</div>
                      {command.timestamp && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(command.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {historyExists ? 'No commands in history' : 'No history file found'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Command history will appear here when available
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'sessions':
        const handleDeleteSession = async (filename: string) => {
          if (!confirm(`Are you sure you want to delete session "${filename}"? This action cannot be undone.`)) {
            return;
          }
          
          const result = await deleteSession(filename);
          if (result.success) {
            alert(result.message);
          } else {
            alert(`Failed to delete session: ${result.error}`);
          }
        };
        
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        return (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Archived transcripts stored in the sessions/ directory
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Sessions Directory</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Location: ~/.codex/sessions/</div>
                </div>
                <button 
                  onClick={loadSessions}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={sessionsLoading}
                >
                  {sessionsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading sessions...</div>
                </div>
              ) : sessionsData.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {sessionsData.length} session{sessionsData.length !== 1 ? 's' : ''} found
                  </div>
                  {sessionsData.map((session: any) => (
                    <div key={session.filename} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{session.filename}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(session.size)} • Modified {new Date(session.modified).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadSession(session.filename)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleDeleteSession(session.filename)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No session archives found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Session archives will appear here when available
                  </p>
                </div>
              )}
            </div>
            
            {/* Session Viewer Modal */}
            {showSessionModal && selectedSession && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Archive</h3>
                    <button
                      onClick={() => {
                        setShowSessionModal(false);
                        setSelectedSession(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-900 p-4 rounded">
                    <pre className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                      {JSON.stringify(selectedSession, null, 2)}
                    </pre>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        setShowSessionModal(false);
                        setSelectedSession(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'instructions-md':
        return (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Markdown editor for the persistent system prompt applied to every new session
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Instructions File</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Location: ~/.codex/instructions.md</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Edit
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                    Save
                  </button>
                </div>
              </div>
              
              <textarea
                className="w-full h-96 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
                placeholder="# System Instructions

Enter your system prompt instructions here. This content will be applied to every new Codex session.

## Example Instructions:
- Always write clean, well-documented code
- Follow best practices for the programming language being used
- Explain complex logic with comments
- Suggest improvements when appropriate"
              />
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                This system prompt will be prepended to every new conversation with Codex
              </div>
            </div>
          </div>
        );

      // Gemini-specific settings
      case 'core-settings':
        return (
          <div>
            {renderStringSetting('theme', 'Theme', 'Visual theme for Gemini CLI (Default, GitHub, Dark, Light)', true)}
            {renderStringSetting('contextFileName', 'Context File Name', 'Name of context file to use (default: GEMINI.md)', true)}
            {renderStringSetting('preferredEditor', 'Preferred Editor', 'Preferred editor for diffs and editing', true)}
            {renderBooleanSetting('sandbox', 'Sandbox Mode', 'Enable sandboxing for code execution')}
            {renderBooleanSetting('autoAccept', 'Auto Accept', 'Automatically accept safe tool calls')}
          </div>
        );

      case 'authentication':
        return (
          <div>
            {renderStringSetting('selectedAuthType', 'Authentication Method', 'Authentication method to use (oauth-personal, oauth-workspace, api-key)', false)}
          </div>
        );

      case 'oauth-credentials':
        return (
          <div>
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">OAuth Credentials Status</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                OAuth authentication credentials stored in ~/.gemini/oauth_creds.json
              </p>
            </div>
            
            {selectedEngineData._oauth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Credentials Status</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Whether OAuth credentials are configured</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEngineData._oauth.hasCredentials 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedEngineData._oauth.hasCredentials ? 'Configured' : 'Not Configured'}
                  </div>
                </div>

                {selectedEngineData._oauth.hasCredentials && (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Token Type</div>
                      </div>
                      <div className="text-gray-900 dark:text-white">{selectedEngineData._oauth.tokenType || 'Unknown'}</div>
                    </div>

                    <div className="py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">Scope</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                        {selectedEngineData._oauth.scope || 'Not specified'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Token Expiry</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">When the current token expires</div>
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        {selectedEngineData._oauth.expiryDate 
                          ? new Date(selectedEngineData._oauth.expiryDate).toLocaleString()
                          : 'Unknown'
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Access Token</div>
                        <div className={`font-medium ${
                          selectedEngineData._oauth.hasAccessToken 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedEngineData._oauth.hasAccessToken ? '✓ Present' : '✗ Missing'}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Refresh Token</div>
                        <div className={`font-medium ${
                          selectedEngineData._oauth.hasRefreshToken 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedEngineData._oauth.hasRefreshToken ? '✓ Present' : '✗ Missing'}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID Token</div>
                        <div className={`font-medium ${
                          selectedEngineData._oauth.hasIdToken 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedEngineData._oauth.hasIdToken ? '✓ Present' : '✗ Missing'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No OAuth credential information available</p>
              </div>
            )}
          </div>
        );

      case 'user-info':
        return (
          <div>
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">User Information</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                User identification and account details
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">User ID</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Unique identifier from ~/.gemini/user_id</div>
                </div>
                <div className="text-gray-900 dark:text-white font-mono text-sm">
                  {selectedEngineData._userId || 'Not configured'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'context-file':
        return (
          <div>
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Context File (GEMINI.md)</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Global context file that provides instructions and memory to Gemini CLI
              </p>
            </div>
            
            {selectedEngineData._contextFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">File Status</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Whether the context file exists</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEngineData._contextFile.exists 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {selectedEngineData._contextFile.exists ? 'Exists' : 'Not Created'}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">File Path</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Location of the context file</div>
                  </div>
                  <div className="text-gray-900 dark:text-white font-mono text-sm">
                    {selectedEngineData._contextFile.path}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">File Size</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Size of the context file</div>
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedEngineData._contextFile.size} bytes
                  </div>
                </div>

                {selectedEngineData._contextFile.exists && selectedEngineData._contextFile.content && (
                  <div className="py-4">
                    <div className="font-medium text-gray-900 dark:text-white mb-3">File Content</div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedEngineData._contextFile.content}
                      </pre>
                    </div>
                  </div>
                )}

                {!selectedEngineData._contextFile.exists && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <div className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>Tip:</strong> Create a GEMINI.md file in ~/.gemini/ to provide persistent instructions and context to Gemini CLI.
                      This file will be included in every conversation as "memory".
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No context file information available</p>
              </div>
            )}
          </div>
        );

      case 'session-logs':
        return (
          <div>
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Session Logs</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Conversation logs from ~/.gemini/tmp/ directories
              </p>
            </div>
            
            {selectedEngineData._sessions && selectedEngineData._sessions.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Found {selectedEngineData._sessions.length} session{selectedEngineData._sessions.length === 1 ? '' : 's'}
                </div>
                
                {selectedEngineData._sessions.map((session: any, index: number) => (
                  <div key={session.sessionDir} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900 dark:text-white">Session {index + 1}</h6>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {session.messageCount} message{session.messageCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Session ID:</span> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{session.sessionDir}</code></div>
                      
                      {session.firstMessage && (
                        <div>
                          <span className="font-medium">First Message:</span>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              {new Date(session.firstMessage.timestamp).toLocaleString()}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 truncate">
                              {session.firstMessage.message}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {session.lastMessage && session.lastMessage.messageId !== session.firstMessage?.messageId && (
                        <div>
                          <span className="font-medium">Last Message:</span>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            <div className="text-gray-500 dark:text-gray-400 mb-1">
                              {new Date(session.lastMessage.timestamp).toLocaleString()}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 truncate">
                              {session.lastMessage.message}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No session logs found</p>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Session logs are created when you use Gemini CLI and are stored in ~/.gemini/tmp/
                </div>
              </div>
            )}
          </div>
        );

      case 'tools-configuration':
        return (
          <div>
            {renderStringSetting('toolDiscoveryCommand', 'Tool Discovery Command', 'Custom command for discovering available tools', true)}
            {renderStringSetting('toolCallCommand', 'Tool Call Command', 'Custom command for calling tools', true)}
            
            {selectedEngineData.coreTools && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Core Tools</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  List of allowed core tools
                </p>
                <div className="space-y-2">
                  {selectedEngineData.coreTools.map((tool: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEngineData.excludeTools && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Excluded Tools</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  List of tools to exclude from usage
                </p>
                <div className="space-y-2">
                  {selectedEngineData.excludeTools.map((tool: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'mcp-servers':
        return (
          <div>
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">MCP Servers</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure Model-Context Protocol servers for enhanced functionality
              </p>
            </div>
            
            {selectedEngineData.mcpServers && Object.keys(selectedEngineData.mcpServers).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(selectedEngineData.mcpServers).map(([serverName, server]: [string, any]) => (
                  <div key={serverName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900 dark:text-white">{serverName}</h6>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Command:</span> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{server.command}</code></div>
                      {server.args && server.args.length > 0 && (
                        <div><span className="font-medium">Args:</span> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{server.args.join(' ')}</code></div>
                      )}
                      {server.env && Object.keys(server.env).length > 0 && (
                        <div>
                          <span className="font-medium">Environment:</span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(server.env).map(([key, value]: [string, any]) => (
                              <div key={key} className="text-xs">
                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{key}={value}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No MCP servers configured</p>
              </div>
            )}
          </div>
        );

      case 'advanced-settings':
        return (
          <div>
            {renderStringSetting('apiEndpoint', 'API Endpoint', 'Custom API endpoint URL', true)}
            {renderStringSetting('model', 'Default Model', 'Default model to use for conversations', true)}
            {renderNumberSetting('maxTokens', 'Max Tokens', 'Maximum tokens per request', true)}
            {renderNumberSetting('temperature', 'Temperature', 'Temperature setting for model responses', true)}
            {renderBooleanSetting('verbose', 'Verbose Logging', 'Enable verbose logging output')}
            {renderBooleanSetting('debug', 'Debug Mode', 'Enable debug mode')}

            {selectedEngineData.telemetry && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Telemetry Settings</h5>
                <div className="space-y-4">
                  {renderBooleanSetting('telemetry.enabled', 'Telemetry Enabled', 'Enable telemetry data collection')}
                  {renderStringSetting('telemetry.target', 'Telemetry Target', 'Target for telemetry data (local, remote, none)', true)}
                </div>
              </div>
            )}
          </div>
        );

      case 'session-management':
        return (
          <div>
            {renderBooleanSetting('checkpointing', 'Checkpointing', 'Enable conversation state saving and restoration')}
            
            {selectedEngineData.conversationHistory && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Conversation History</h5>
                <div className="space-y-4">
                  {renderNumberSetting('conversationHistory.maxEntries', 'Max Entries', 'Maximum number of conversation entries to retain', true)}
                  {renderBooleanSetting('conversationHistory.saveToFile', 'Save to File', 'Save conversation history to file')}
                  {renderStringSetting('conversationHistory.filePath', 'File Path', 'Path to conversation history file', true)}
                </div>
              </div>
            )}
          </div>
        );

      default:
        if (isProjectItem) {
          const projectData = selectedEngineData.projects?.[projectPath];
          if (!projectData) {
            return (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Project not found: {projectPath}</p>
              </div>
            );
          }

          return (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {projectPath}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Project-specific configuration
                </p>
              </div>
              
              {/* Show project-specific settings based on the sub-item */}
              {(() => {
                const parts = selectedItem.split('-');
                // Handle claude-md specially since it contains a dash
                let subSection = 'mcp'; // Default to MCP if no subsection
                if (parts.length > 2) {
                  const lastPart = parts[parts.length - 1];
                  const secondLastPart = parts[parts.length - 2];
                  if (secondLastPart === 'claude' && lastPart === 'md') {
                    subSection = 'claude-md';
                  } else {
                    subSection = lastPart;
                  }
                }
                
                switch (subSection) {
                  case 'mcp':
                    const handleMcpServerEdit = (serverName: string) => {
                      const serverConfig = projectData.mcpServers[serverName];
                      setEditingMcpServer(serverName);
                      setEditingValues(prev => ({
                        ...prev,
                        [`mcpServer_${serverName}_command`]: serverConfig.command || '',
                        [`mcpServer_${serverName}_args`]: serverConfig.args ? serverConfig.args.join(' ') : '',
                        [`mcpServer_${serverName}_env`]: serverConfig.env ? Object.entries(serverConfig.env).map(([k, v]) => `${k}=${v}`).join('\n') : ''
                      }));
                    };
                    
                    const handleMcpServerSave = async (serverName: string) => {
                      const command = editingValues[`mcpServer_${serverName}_command`] || '';
                      const argsStr = editingValues[`mcpServer_${serverName}_args`] || '';
                      const envStr = editingValues[`mcpServer_${serverName}_env`] || '';
                      
                      const args = argsStr.trim() ? argsStr.split(' ').filter(arg => arg.trim()) : [];
                      const env: Record<string, string> = {};
                      if (envStr.trim()) {
                        envStr.split('\n').forEach(line => {
                          const [key, ...valueParts] = line.split('=');
                          if (key && key.trim() && valueParts.length > 0) {
                            env[key.trim()] = valueParts.join('=').trim();
                          }
                        });
                      }
                      
                      const serverConfig: any = { command };
                      if (args.length > 0) serverConfig.args = args;
                      if (Object.keys(env).length > 0) serverConfig.env = env;
                      
                      _onProjectUpdate(selectedEngine, projectPath, {
                        mcpServers: {
                          ...projectData.mcpServers,
                          [serverName]: serverConfig
                        }
                      });
                      
                      setEditingMcpServer(null);
                    };
                    
                    const handleMcpServerCancel = () => {
                      setEditingMcpServer(null);
                    };
                    
                    const handleAddMcpServer = async () => {
                      if (!newMcpServer.name.trim() || !newMcpServer.command.trim()) {
                        return;
                      }
                      
                      const args = newMcpServer.args.trim() ? newMcpServer.args.split(' ').filter(arg => arg.trim()) : [];
                      const env: Record<string, string> = {};
                      if (newMcpServer.env.trim()) {
                        newMcpServer.env.split('\n').forEach(line => {
                          const [key, ...valueParts] = line.split('=');
                          if (key && key.trim() && valueParts.length > 0) {
                            env[key.trim()] = valueParts.join('=').trim();
                          }
                        });
                      }
                      
                      const serverConfig: any = { command: newMcpServer.command };
                      if (args.length > 0) serverConfig.args = args;
                      if (Object.keys(env).length > 0) serverConfig.env = env;
                      
                      _onProjectUpdate(selectedEngine, projectPath, {
                        mcpServers: {
                          ...(projectData.mcpServers || {}),
                          [newMcpServer.name]: serverConfig
                        }
                      });
                      
                      setNewMcpServer({ name: '', command: '', args: '', env: '' });
                      setShowAddMcpForm(false);
                    };
                    
                    const handleRemoveMcpServer = async (serverName: string) => {
                      const currentServers = projectData.mcpServers || {};
                      const { [serverName]: removed, ...remainingServers } = currentServers;
                      await _onProjectUpdate(selectedEngine, projectPath, {
                        mcpServers: remainingServers
                      });
                    };
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white">MCP Servers</h4>
                          <button
                            onClick={() => {
                              setMcpJsonValue(JSON.stringify(projectData.mcpServers || {}, null, 2));
                              setShowMcpJsonEditor(true);
                            }}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Edit Raw JSON
                          </button>
                        </div>
                        {projectData.mcpServers && Object.keys(projectData.mcpServers).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(projectData.mcpServers).map(([serverName, serverConfig]: [string, any]) => (
                              <div key={serverName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-gray-900 dark:text-white">{serverName}</h5>
                                  <div className="flex gap-2">
                                    {editingMcpServer === serverName ? (
                                      <>
                                        <button 
                                          onClick={() => handleMcpServerSave(serverName)}
                                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                          Save
                                        </button>
                                        <button 
                                          onClick={handleMcpServerCancel}
                                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => handleMcpServerEdit(serverName)}
                                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleRemoveMcpServer(serverName)}
                                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                          Remove
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Command
                                    </label>
                                    {editingMcpServer === serverName ? (
                                      <input
                                        type="text"
                                        value={editingValues[`mcpServer_${serverName}_command`] || ''}
                                        onChange={(e) => setEditingValues(prev => ({ ...prev, [`mcpServer_${serverName}_command`]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      />
                                    ) : (
                                      <div className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        {serverConfig.command}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Arguments (space-separated)
                                    </label>
                                    {editingMcpServer === serverName ? (
                                      <input
                                        type="text"
                                        value={editingValues[`mcpServer_${serverName}_args`] || ''}
                                        onChange={(e) => setEditingValues(prev => ({ ...prev, [`mcpServer_${serverName}_args`]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="--option1 value1 --option2 value2"
                                      />
                                    ) : (
                                      <div className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        {serverConfig.args && serverConfig.args.length > 0 ? serverConfig.args.join(' ') : 'No arguments'}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Environment Variables (one per line: KEY=value)
                                    </label>
                                    {editingMcpServer === serverName ? (
                                      <textarea
                                        value={editingValues[`mcpServer_${serverName}_env`] || ''}
                                        onChange={(e) => setEditingValues(prev => ({ ...prev, [`mcpServer_${serverName}_env`]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        rows={3}
                                        placeholder="API_KEY=your_key&#10;DEBUG=true"
                                      />
                                    ) : (
                                      <div className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        {serverConfig.env && Object.keys(serverConfig.env).length > 0 ? (
                                          Object.entries(serverConfig.env).map(([key, value]) => (
                                            <div key={key}>{key}={String(value)}</div>
                                          ))
                                        ) : (
                                          'No environment variables'
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {showAddMcpForm ? (
                              <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Add New MCP Server</h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Server Name
                                    </label>
                                    <input
                                      type="text"
                                      value={newMcpServer.name}
                                      onChange={(e) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="my-server"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Command
                                    </label>
                                    <input
                                      type="text"
                                      value={newMcpServer.command}
                                      onChange={(e) => setNewMcpServer(prev => ({ ...prev, command: e.target.value }))}
                                      className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="npx"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Arguments (space-separated)
                                    </label>
                                    <input
                                      type="text"
                                      value={newMcpServer.args}
                                      onChange={(e) => setNewMcpServer(prev => ({ ...prev, args: e.target.value }))}
                                      className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="@my/mcp-server@latest --option value"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Environment Variables (one per line: KEY=value)
                                    </label>
                                    <textarea
                                      value={newMcpServer.env}
                                      onChange={(e) => setNewMcpServer(prev => ({ ...prev, env: e.target.value }))}
                                      className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      rows={3}
                                      placeholder="API_KEY=your_key&#10;DEBUG=true"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <button 
                                      onClick={handleAddMcpServer}
                                      disabled={!newMcpServer.name.trim() || !newMcpServer.command.trim()}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      Add Server
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setShowAddMcpForm(false);
                                        setNewMcpServer({ name: '', command: '', args: '', env: '' });
                                      }}
                                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setShowAddMcpForm(true)}
                                  className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                                >
                                  + Add MCP Server
                                </button>
                                <button 
                                  onClick={() => setShowCopyModal(true)}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                  Copy from Project
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No MCP servers configured</p>
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => setShowAddMcpForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Add MCP Server
                              </button>
                              <button 
                                onClick={() => setShowCopyModal(true)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                Copy from Project
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {showAddMcpForm && (!projectData.mcpServers || Object.keys(projectData.mcpServers).length === 0) && (
                          <div className="mt-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Add New MCP Server</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Server Name
                                </label>
                                <input
                                  type="text"
                                  value={newMcpServer.name}
                                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="my-server"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Command
                                </label>
                                <input
                                  type="text"
                                  value={newMcpServer.command}
                                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, command: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="npx"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Arguments (space-separated)
                                </label>
                                <input
                                  type="text"
                                  value={newMcpServer.args}
                                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, args: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  placeholder="@my/mcp-server@latest --option value"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Environment Variables (one per line: KEY=value)
                                </label>
                                <textarea
                                  value={newMcpServer.env}
                                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, env: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  rows={3}
                                  placeholder="API_KEY=your_key&#10;DEBUG=true"
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={handleAddMcpServer}
                                  disabled={!newMcpServer.name.trim() || !newMcpServer.command.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  Add Server
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowAddMcpForm(false);
                                    setNewMcpServer({ name: '', command: '', args: '', env: '' });
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* JSON Editor Modal */}
                        {showMcpJsonEditor && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit MCP Servers JSON</h3>
                                <button
                                  onClick={() => setShowMcpJsonEditor(false)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="mb-4">
                                <textarea
                                  value={mcpJsonValue}
                                  onChange={(e) => setMcpJsonValue(e.target.value)}
                                  className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                  placeholder="Enter MCP servers JSON configuration..."
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setShowMcpJsonEditor(false)}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const parsedConfig = JSON.parse(mcpJsonValue);
                                      await _onProjectUpdate(selectedEngine, projectPath, {
                                        mcpServers: parsedConfig
                                      });
                                      setShowMcpJsonEditor(false);
                                    } catch (error) {
                                      alert('Invalid JSON: ' + (error instanceof Error ? error.message : String(error)));
                                    }
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Copy from Project Modal */}
                        {showCopyModal && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Copy MCP Servers from Another Project</h3>
                                <button
                                  onClick={() => setShowCopyModal(false)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="overflow-y-auto max-h-96">
                                {Object.entries(selectedEngineData.projects || {})
                                  .filter(([path]) => path !== projectPath) // Exclude current project
                                  .map(([path, data]: [string, any]) => {
                                    const mcpServers = data.mcpServers || {};
                                    const serverCount = Object.keys(mcpServers).length;
                                    
                                    if (serverCount === 0) return null;
                                    
                                    return (
                                      <div key={path} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{path}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{serverCount} MCP server{serverCount !== 1 ? 's' : ''}</p>
                                          </div>
                                          <button
                                            onClick={async () => {
                                              const currentServers = projectData.mcpServers || {};
                                              const mergedServers = { ...currentServers };
                                              
                                              // Add servers with conflict resolution
                                              Object.entries(mcpServers).forEach(([name, config]) => {
                                                let finalName = name;
                                                let counter = 1;
                                                while (mergedServers[finalName]) {
                                                  finalName = `${name}_${counter}`;
                                                  counter++;
                                                }
                                                mergedServers[finalName] = config;
                                              });
                                              
                                              await _onProjectUpdate(selectedEngine, projectPath, {
                                                mcpServers: mergedServers
                                              });
                                              setShowCopyModal(false);
                                            }}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                          >
                                            Copy All
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {Object.entries(mcpServers).map(([serverName, serverConfig]: [string, any]) => (
                                            <div key={serverName} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                              <div>
                                                <span className="font-mono text-sm text-gray-900 dark:text-white">{serverName}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{serverConfig.command}</span>
                                              </div>
                                              <button
                                                onClick={async () => {
                                                  const currentServers = projectData.mcpServers || {};
                                                  let finalName = serverName;
                                                  let counter = 1;
                                                  while (currentServers[finalName]) {
                                                    finalName = `${serverName}_${counter}`;
                                                    counter++;
                                                  }
                                                  
                                                  await _onProjectUpdate(selectedEngine, projectPath, {
                                                    mcpServers: {
                                                      ...currentServers,
                                                      [finalName]: serverConfig
                                                    }
                                                  });
                                                  setShowCopyModal(false);
                                                }}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                              >
                                                Copy
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                  .filter(Boolean)}
                                {Object.entries(selectedEngineData.projects || {})
                                  .filter(([path]) => path !== projectPath)
                                  .every(([, data]: [string, any]) => !data.mcpServers || Object.keys(data.mcpServers).length === 0) && (
                                  <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">No other projects with MCP servers found</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end mt-4">
                                <button
                                  onClick={() => setShowCopyModal(false)}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* MCP Context & Additional Settings */}
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-4">MCP Context & Status</h5>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Context URIs</label>
                              {projectData.mcpContextUris && projectData.mcpContextUris.length > 0 ? (
                                <div className="space-y-1">
                                  {projectData.mcpContextUris.map((uri: string, index: number) => (
                                    <div key={index} className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                      {uri}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No MCP context URIs configured</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enabled MCP JSON Servers</label>
                                {projectData.enabledMcpjsonServers && projectData.enabledMcpjsonServers.length > 0 ? (
                                  <div className="space-y-1">
                                    {projectData.enabledMcpjsonServers.map((server: string, index: number) => (
                                      <div key={index} className="text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-2 rounded">
                                        {server}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">No enabled MCP JSON servers</p>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disabled MCP JSON Servers</label>
                                {projectData.disabledMcpjsonServers && projectData.disabledMcpjsonServers.length > 0 ? (
                                  <div className="space-y-1">
                                    {projectData.disabledMcpjsonServers.map((server: string, index: number) => (
                                      <div key={index} className="text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded">
                                        {server}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">No disabled MCP JSON servers</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    
                  case 'tools':
                    const handleAddTool = async () => {
                      if (!newTool.trim()) return;
                      
                      const updatedTools = [...toolsData, newTool.trim()];
                      const result = await saveTools(projectPath, updatedTools);
                      
                      if (result.success) {
                        setToolsData(updatedTools);
                        setNewTool('');
                        setShowAddTool(false);
                      } else {
                        console.error('Failed to add tool:', result.error);
                        alert(`Failed to add tool: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    const handleRemoveTool = async (toolToRemove: string) => {
                      const updatedTools = toolsData.filter(tool => tool !== toolToRemove);
                      const result = await saveTools(projectPath, updatedTools);
                      
                      if (result.success) {
                        setToolsData(updatedTools);
                      } else {
                        console.error('Failed to remove tool:', result.error);
                        alert(`Failed to remove tool: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    return (
                      <div>
                        {toolsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">Loading tools...</div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Allowed Tools
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Specify which tools Claude Code can use in this project. Empty list means all tools are allowed.
                                </p>
                              </div>
                              <button
                                onClick={() => setShowAddTool(true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Add Tool
                              </button>
                            </div>
                            
                            {toolsData.length > 0 ? (
                              <div className="space-y-2">
                                {toolsData.map((tool: string, index: number) => (
                                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <span className="text-sm font-mono text-gray-900 dark:text-white">{tool}</span>
                                    <button 
                                      onClick={() => handleRemoveTool(tool)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No tool restrictions configured</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">All tools are allowed by default</p>
                              </div>
                            )}
                            
                            {showAddTool && (
                              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Add New Tool</h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Tool Name
                                    </label>
                                    <input
                                      type="text"
                                      value={newTool}
                                      onChange={(e) => setNewTool(e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g., bash, edit, read"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTool();
                                        if (e.key === 'Escape') setShowAddTool(false);
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={handleAddTool}
                                      disabled={!newTool.trim()}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      Add Tool
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setShowAddTool(false);
                                        setNewTool('');
                                      }}
                                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'ignore':
                    const handleAddPattern = async () => {
                      if (!newPattern.trim()) return;
                      
                      const updatedPatterns = [...patternsData, newPattern.trim()];
                      const result = await savePatterns(projectPath, updatedPatterns);
                      
                      if (result.success) {
                        setPatternsData(updatedPatterns);
                        setNewPattern('');
                        setShowAddPattern(false);
                      } else {
                        console.error('Failed to add pattern:', result.error);
                        alert(`Failed to add pattern: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    const handleRemovePattern = async (patternToRemove: string) => {
                      const updatedPatterns = patternsData.filter(pattern => pattern !== patternToRemove);
                      const result = await savePatterns(projectPath, updatedPatterns);
                      
                      if (result.success) {
                        setPatternsData(updatedPatterns);
                      } else {
                        console.error('Failed to remove pattern:', result.error);
                        alert(`Failed to remove pattern: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    return (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Configure file and directory patterns that Claude Code should ignore when reading your project.
                        </p>
                        
                        {patternsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">Loading patterns...</div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Ignore Patterns
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Use glob patterns like *.log, node_modules/, or specific file paths.
                                </p>
                              </div>
                              <button
                                onClick={() => setShowAddPattern(true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Add Pattern
                              </button>
                            </div>
                            
                            {patternsData.length > 0 ? (
                              <div className="space-y-2">
                                {patternsData.map((pattern: string, index: number) => (
                                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <span className="text-sm font-mono text-gray-900 dark:text-white">{pattern}</span>
                                    <button 
                                      onClick={() => handleRemovePattern(pattern)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No ignore patterns configured</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Patterns help control which files Claude Code can access
                                </p>
                              </div>
                            )}
                            
                            {showAddPattern && (
                              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Add New Pattern</h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Pattern
                                    </label>
                                    <input
                                      type="text"
                                      value={newPattern}
                                      onChange={(e) => setNewPattern(e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g., *.log, node_modules/, .env"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddPattern();
                                        if (e.key === 'Escape') setShowAddPattern(false);
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={handleAddPattern}
                                      disabled={!newPattern.trim()}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      Add Pattern
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setShowAddPattern(false);
                                        setNewPattern('');
                                      }}
                                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'trust':
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Trust & Onboarding</h4>
                        <div className="space-y-4">
                          {renderBooleanSetting('hasTrustDialogAccepted', 'Trust Dialog Accepted', 'Whether the trust dialog has been accepted for this project')}
                          {renderNumberSetting('projectOnboardingSeenCount', 'Onboarding Seen Count', 'Number of times project onboarding was shown', false)}
                        </div>
                      </div>
                    );
                    
                  case 'examples':
                    const handleAddExample = async () => {
                      if (!newExample.title.trim() || !newExample.prompt.trim()) return;
                      
                      const newId = Date.now().toString();
                      const exampleToAdd = {
                        id: newId,
                        title: newExample.title.trim(),
                        description: newExample.description.trim(),
                        prompt: newExample.prompt.trim()
                      };
                      
                      const updatedExamples = [...examplesData, exampleToAdd];
                      const result = await saveExamples(projectPath, updatedExamples);
                      
                      if (result.success) {
                        setExamplesData(updatedExamples);
                        setNewExample({title: '', description: '', prompt: ''});
                        setShowAddExample(false);
                      } else {
                        console.error('Failed to add example:', result.error);
                        alert(`Failed to add example: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    const handleEditExample = async (exampleId: string) => {
                      const example = examplesData.find(e => e.id === exampleId);
                      if (!example) return;
                      
                      setNewExample({
                        title: example.title,
                        description: example.description,
                        prompt: example.prompt
                      });
                      setEditingExample(exampleId);
                    };
                    
                    const handleSaveExample = async () => {
                      if (!editingExample || !newExample.title.trim() || !newExample.prompt.trim()) return;
                      
                      const updatedExamples = examplesData.map(example => 
                        example.id === editingExample 
                          ? {
                              ...example,
                              title: newExample.title.trim(),
                              description: newExample.description.trim(),
                              prompt: newExample.prompt.trim()
                            }
                          : example
                      );
                      
                      const result = await saveExamples(projectPath, updatedExamples);
                      
                      if (result.success) {
                        setExamplesData(updatedExamples);
                        setNewExample({title: '', description: '', prompt: ''});
                        setEditingExample(null);
                      } else {
                        console.error('Failed to save example:', result.error);
                        alert(`Failed to save example: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    const handleRemoveExample = async (exampleId: string) => {
                      const updatedExamples = examplesData.filter(example => example.id !== exampleId);
                      const result = await saveExamples(projectPath, updatedExamples);
                      
                      if (result.success) {
                        setExamplesData(updatedExamples);
                      } else {
                        console.error('Failed to remove example:', result.error);
                        alert(`Failed to remove example: ${result.error || 'Unknown error'}`);
                      }
                    };
                    
                    return (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Manage example prompts and workflows for this project.
                        </p>
                        
                        {examplesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">Loading examples...</div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Examples
                              </label>
                              <button
                                onClick={() => setShowAddExample(true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Add Example
                              </button>
                            </div>
                            
                            {examplesData.length > 0 ? (
                              <div className="space-y-4">
                                {examplesData.map((example: any) => (
                                  <div key={example.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-900 dark:text-white">{example.title}</h5>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleEditExample(example.id)}
                                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleRemoveExample(example.id)}
                                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    {example.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{example.description}</p>
                                    )}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                                      {example.prompt}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No examples configured</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Examples help provide context and guidance for Claude Code
                                </p>
                              </div>
                            )}
                            
                            {(showAddExample || editingExample) && (
                              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                                  {editingExample ? 'Edit Example' : 'Add New Example'}
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={newExample.title}
                                      onChange={(e) => setNewExample(prev => ({...prev, title: e.target.value}))}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="e.g., Create React Component"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Description
                                    </label>
                                    <input
                                      type="text"
                                      value={newExample.description}
                                      onChange={(e) => setNewExample(prev => ({...prev, description: e.target.value}))}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      placeholder="Optional description of what this example does"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Prompt *
                                    </label>
                                    <textarea
                                      value={newExample.prompt}
                                      onChange={(e) => setNewExample(prev => ({...prev, prompt: e.target.value}))}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      rows={4}
                                      placeholder="Create a React functional component that..."
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={editingExample ? handleSaveExample : handleAddExample}
                                      disabled={!newExample.title.trim() || !newExample.prompt.trim()}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      {editingExample ? 'Save Changes' : 'Add Example'}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setShowAddExample(false);
                                        setEditingExample(null);
                                        setNewExample({title: '', description: '', prompt: ''});
                                      }}
                                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'history':
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Conversation History</h4>
                        {projectData.history ? (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {projectData.history.length} conversation{projectData.history.length !== 1 ? 's' : ''} in history
                            </p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {projectData.history.slice(0, 10).map((entry: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                                  <div className="font-medium text-gray-900 dark:text-white">{entry.display}</div>
                                  {entry.pastedContents && entry.pastedContents.length > 0 && (
                                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                                      {entry.pastedContents.length} pasted item{entry.pastedContents.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {projectData.history.length > 10 && (
                                <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                                  ... and {projectData.history.length - 10} more
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No conversation history</p>
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'claude-md':
                    const handleSaveClaudeMd = async () => {
                      const result = await saveClaudeMd(projectPath, claudeMdContent);
                      if (result.success) {
                        // Could add a toast notification here
                        console.log('CLAUDE.md saved successfully');
                      } else {
                        console.error('Failed to save CLAUDE.md:', result.error);
                        alert(`Failed to save CLAUDE.md: ${result.error}`);
                      }
                    };
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-md font-semibold text-gray-900 dark:text-white">CLAUDE.md File Editor</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Edit the CLAUDE.md file for this project. This file provides instructions to Claude Code.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              claudeMdExists 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {claudeMdExists ? 'File exists' : 'New file'}
                            </span>
                            <button
                              onClick={handleSaveClaudeMd}
                              disabled={claudeMdSaving}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {claudeMdSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                        
                        {claudeMdLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">Loading CLAUDE.md...</div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <textarea
                              value={claudeMdContent}
                              onChange={(e) => setClaudeMdContent(e.target.value)}
                              className="w-full h-96 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
                              placeholder="# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Description
Describe what this project does and its main purpose.

## Development Instructions
- How to set up the development environment
- Key commands and workflows
- Important architectural decisions

## Context and Guidelines
- Coding standards and conventions
- Important files and their purposes
- Any specific instructions for AI assistance"
                            />
                            
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              File path: {projectPath}/CLAUDE.md
                            </div>
                            
                            {/* Project configuration section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Project Configuration</h5>
                              <div className="space-y-4">
                                {renderBooleanSetting('hasClaudeMdExternalIncludesApproved', 'External Includes Approved', 'Whether external includes in CLAUDE.md have been approved')}
                                {renderBooleanSetting('hasClaudeMdExternalIncludesWarningShown', 'External Includes Warning Shown', 'Whether the external includes warning has been shown')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'performance':
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Performance & Sessions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Session metrics and performance data for this project.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Project Statistics */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Project Statistics</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">Conversation History</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Number of recorded conversations</div>
                                </div>
                                <div className="text-gray-900 dark:text-white">
                                  {projectData.history ? projectData.history.length : 0}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">Project Onboarding Count</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Times project onboarding was seen</div>
                                </div>
                                <div className="text-gray-900 dark:text-white">
                                  {projectData.projectOnboardingSeenCount || 0}
                                </div>
                              </div>
                              
                              {projectData.exampleFiles && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Example Files</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Generated example files count</div>
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {projectData.exampleFiles.length}
                                  </div>
                                </div>
                              )}
                              
                              {projectData.exampleFilesGeneratedAt && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Examples Generated</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">When example files were generated</div>
                                  </div>
                                  <div className="text-gray-900 dark:text-white text-sm">
                                    {new Date(projectData.exampleFilesGeneratedAt).toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Global Performance Data */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Global Statistics</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">Total Startups</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Claude Code startup count</div>
                                </div>
                                <div className="text-gray-900 dark:text-white">
                                  {selectedEngineData.numStartups || 0}
                                </div>
                              </div>
                              
                              {selectedEngineData.firstStartTime && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">First Start Time</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">When Claude Code was first started</div>
                                  </div>
                                  <div className="text-gray-900 dark:text-white text-sm">
                                    {new Date(selectedEngineData.firstStartTime).toLocaleString()}
                                  </div>
                                </div>
                              )}
                              
                              {selectedEngineData.promptQueueUseCount && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Prompt Queue Usage</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Times prompt queue was used</div>
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {selectedEngineData.promptQueueUseCount}
                                  </div>
                                </div>
                              )}
                              
                              {selectedEngineData.oauthAccount && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Account</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Logged in account</div>
                                  </div>
                                  <div className="text-gray-900 dark:text-white text-sm">
                                    {selectedEngineData.oauthAccount.emailAddress}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    
                  default:
                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                          Project settings for {subSection} coming soon...
                        </p>
                      </div>
                    );
                }
              })()}
            </div>
          );
        }

        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Settings for "{selectedItem}" coming soon...
            </p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'updates-version': 'Updates & Version',
      'permissions-warnings': 'Permissions & Warnings',
      'keyboard-terminal': 'Keyboard & Terminal Integration',
      'usage-tips': 'Usage & Tips',
      'readonly-info': 'User & Account',
      'model-provider': 'Model & Provider',
      'conversation-storage': 'Conversation Storage',
      'privacy-redaction': 'Privacy & Redaction',
      'tools-resource-limits': 'Tools & Resource Limits',
      'updates-diagnostics': 'Updates & Diagnostics',
      'history-json': 'Command History',
      'sessions': 'Session Archives',
      'instructions-md': 'System Prompt',
      // Gemini titles
      'core-settings': 'Core Settings',
      'authentication': 'Authentication',
      'oauth-credentials': 'OAuth Credentials',
      'user-info': 'User & Account',
      'context-file': 'Context File (GEMINI.md)',
      'session-logs': 'Session Logs',
      'tools-configuration': 'Tools Configuration',
      'mcp-servers': 'MCP Servers',
      'advanced-settings': 'Advanced Settings',
      'session-management': 'Session Management'
    };

    return titles[selectedItem] || selectedItem;
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure {selectedEngine === 'claude-code' ? 'Claude Code' : 
                        selectedEngine === 'codex' ? 'OpenAI Codex' :
                        selectedEngine === 'gemini' ? 'Gemini CLI' : selectedEngine} settings
            </p>
          </div>
          
          <div className="p-6">
            {renderSettingsContent()}
          </div>
        </div>
      </div>
    </div>
  );
}