
import { useState } from 'react';

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
                      </div>
                    );
                    
                  case 'tools':
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Tool Permissions</h4>
                        {projectData.allowedTools ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Allowed Tools
                            </label>
                            <div className="space-y-2">
                              {projectData.allowedTools.map((tool: string, index: number) => (
                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                  <span className="text-sm font-mono text-gray-900 dark:text-white">{tool}</span>
                                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                </div>
                              ))}
                            </div>
                            <button className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                              Add Tool
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">All tools allowed by default</p>
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'ignore':
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Ignore Patterns</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Configure file and directory patterns that Claude Code should ignore when reading your project.
                        </p>
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400 mb-4">No ignore patterns configured</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ignore patterns are typically managed through .gitignore files and project-specific settings.
                          </p>
                        </div>
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
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Examples</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Manage example prompts and workflows for this project.
                        </p>
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400 mb-4">No examples configured</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Examples help provide context and guidance for Claude Code when working with your project.
                          </p>
                        </div>
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
                    return (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">CLAUDE.md Configuration</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Manage CLAUDE.md file settings and external includes approval for this project.
                        </p>
                        <div className="space-y-4">
                          {renderBooleanSetting('hasClaudeMdExternalIncludesApproved', 'External Includes Approved', 'Whether external includes in CLAUDE.md have been approved')}
                          {renderBooleanSetting('hasClaudeMdExternalIncludesWarningShown', 'External Includes Warning Shown', 'Whether the external includes warning has been shown')}
                        </div>
                        {(!projectData.hasClaudeMdExternalIncludesApproved && !projectData.hasClaudeMdExternalIncludesWarningShown) && (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No CLAUDE.md external includes configured</p>
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
                          {/* Session Information */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Latest Session</h5>
                            {renderStringSetting('lastSessionId', 'Session ID', 'Unique identifier for the last session')}
                            {renderNumberSetting('lastCost', 'Session Cost', 'Cost of the last session in USD', false)}
                            {renderNumberSetting('lastAPIDuration', 'API Duration', 'API duration in milliseconds', false)}
                            {renderNumberSetting('lastDuration', 'Total Duration', 'Total session duration in milliseconds', false)}
                          </div>
                          
                          {/* Code Changes */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Code Changes</h5>
                            {renderNumberSetting('lastLinesAdded', 'Lines Added', 'Lines added in the last session', false)}
                            {renderNumberSetting('lastLinesRemoved', 'Lines Removed', 'Lines removed in the last session', false)}
                          </div>
                          
                          {/* Token Usage */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Token Usage</h5>
                            {renderNumberSetting('lastTotalInputTokens', 'Input Tokens', 'Total input tokens used', false)}
                            {renderNumberSetting('lastTotalOutputTokens', 'Output Tokens', 'Total output tokens generated', false)}
                          </div>
                          
                          {/* Cache Performance */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">Cache Performance</h5>
                            {renderNumberSetting('lastTotalCacheCreationInputTokens', 'Cache Creation', 'Cache creation input tokens', false)}
                            {renderNumberSetting('lastTotalCacheReadInputTokens', 'Cache Reads', 'Cache read input tokens', false)}
                          </div>
                        </div>
                        
                        {/* MCP Context URIs */}
                        <div className="mt-8">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-4">MCP Context & Servers</h5>
                          <div className="space-y-4">
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
      'instructions-md': 'System Prompt'
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
              Configure {selectedEngine === 'claude-code' ? 'Claude Code' : 'OpenAI Codex'} settings
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