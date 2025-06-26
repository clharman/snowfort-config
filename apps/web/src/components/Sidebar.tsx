import { useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export interface NavigationItem {
  id: string;
  label: string;
  type: 'section' | 'subsection' | 'project';
  children?: NavigationItem[];
  parentId?: string;
}

interface SidebarProps {
  engines: Array<[string, any]>;
  selectedEngine: string | null;
  onEngineSelect: (engineId: string | null) => void;
  selectedItem: string | null;
  onItemSelect: (itemId: string | null) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Sidebar({
  engines,
  selectedEngine,
  onEngineSelect,
  selectedItem,
  onItemSelect,
  darkMode,
  onToggleDarkMode
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global']));

  // Filter available engines (Claude Code, Codex, and Gemini)
  const availableEngines = engines.filter(([engineId, engineData]) => {
    return (engineId === 'claude-code' || engineId === 'codex' || engineId === 'gemini') && engineData._meta?.detected;
  });

  const unavailableEngines = ['claude-code', 'codex', 'gemini'].filter(engineId => 
    !engines.find(([id, data]) => id === engineId && data._meta?.detected)
  );

  // Generate navigation structure based on selected engine
  const getNavigationItems = (): NavigationItem[] => {
    if (!selectedEngine) return [];

    const selectedEngineData = engines.find(([id]) => id === selectedEngine)?.[1];
    if (!selectedEngineData?._meta?.detected) return [];

    if (selectedEngine === 'claude-code') {
      const projects = selectedEngineData.projects ? Object.keys(selectedEngineData.projects) : [];
      
      return [
        {
          id: 'global',
          label: 'Global',
          type: 'section',
          children: [
            { id: 'updates-version', label: 'Updates & Version', type: 'subsection' },
            { id: 'permissions-warnings', label: 'Permissions & Warnings', type: 'subsection' },
            { id: 'keyboard-terminal', label: 'Keyboard & Terminal Integration', type: 'subsection' },
            { id: 'usage-tips', label: 'Usage & Tips', type: 'subsection' },
            { id: 'readonly-info', label: 'User & Account', type: 'subsection' }
          ]
        },
        {
          id: 'projects',
          label: 'Projects',
          type: 'section',
          children: projects.map(projectPath => ({
            id: `project-${btoa(projectPath)}`,
            label: projectPath.split('/').pop() || projectPath,
            type: 'project' as const,
            children: [
              { id: `project-${btoa(projectPath)}-mcp`, label: 'MCP Servers', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-tools`, label: 'Tool Permissions', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-ignore`, label: 'Ignore Patterns', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-trust`, label: 'Trust & Onboarding', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-examples`, label: 'Examples', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-history`, label: 'History', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-claude-md`, label: 'CLAUDE.md', type: 'subsection' },
              { id: `project-${btoa(projectPath)}-performance`, label: 'Performance & Sessions', type: 'subsection' }
            ]
          }))
        }
      ];
    } else if (selectedEngine === 'codex') {
      return [
        {
          id: 'global',
          label: 'Global',
          type: 'section',
          children: [
            { id: 'model-provider', label: 'Model & Provider', type: 'subsection' },
            { id: 'conversation-storage', label: 'Conversation Storage', type: 'subsection' },
            { id: 'privacy-redaction', label: 'Privacy & Redaction', type: 'subsection' },
            { id: 'tools-resource-limits', label: 'Tools & Resource Limits', type: 'subsection' },
            { id: 'updates-diagnostics', label: 'Updates & Diagnostics', type: 'subsection' }
          ]
        },
        {
          id: 'logs',
          label: 'Logs',
          type: 'section',
          children: [
            { id: 'history-json', label: 'history.json', type: 'subsection' },
            { id: 'sessions', label: 'sessions/', type: 'subsection' }
          ]
        },
        {
          id: 'system-prompt',
          label: 'System Prompt',
          type: 'section',
          children: [
            { id: 'instructions-md', label: 'instructions.md', type: 'subsection' }
          ]
        }
      ];
    } else if (selectedEngine === 'gemini') {
      return [
        {
          id: 'global',
          label: 'Global',
          type: 'section',
          children: [
            { id: 'core-settings', label: 'Core Settings', type: 'subsection' },
            { id: 'authentication', label: 'Authentication', type: 'subsection' },
            { id: 'oauth-credentials', label: 'OAuth Credentials', type: 'subsection' },
            { id: 'user-info', label: 'User & Account', type: 'subsection' },
            { id: 'context-file', label: 'Context File (GEMINI.md)', type: 'subsection' },
            { id: 'session-logs', label: 'Session Logs', type: 'subsection' },
            { id: 'tools-configuration', label: 'Tools Configuration', type: 'subsection' },
            { id: 'mcp-servers', label: 'MCP Servers', type: 'subsection' },
            { id: 'advanced-settings', label: 'Advanced Settings', type: 'subsection' },
            { id: 'session-management', label: 'Session Management', type: 'subsection' }
          ]
        }
      ];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  const toggleSection = (sectionId: string, item: NavigationItem) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      // Auto-select first subsection when expanding a section
      if (item.children && item.children.length > 0) {
        onItemSelect(item.children[0].id);
      }
    }
    setExpandedSections(newExpanded);
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedSections.has(item.id);
    const isSelected = selectedItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={`ml-${level * 4}`}>
        <div
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id, item);
            } else {
              onItemSelect(item.id);
            }
          }}
        >
          <span className="flex items-center">
            {hasChildren && (
              <span className={`mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            )}
            {item.label}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header with engine selector and dark mode toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <a 
            href="https://snowfort.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={darkMode ? "/snowfort-logo-inverted-no-bg.png" : "/snowfort-logo.png"} 
              alt="Snowfort Logo" 
              className="h-8 w-8"
            />
            <h1 
              className="text-lg text-gray-900 dark:text-white"
              style={{ 
                fontFamily: 'Courier, "Courier New", monospace',
                fontWeight: '600',
                letterSpacing: '0.1em'
              }}
            >
              CONFIG
            </h1>
          </a>
          <button
            onClick={onToggleDarkMode}
            className="p-3 rounded-full transition-all duration-300 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5 text-gray-900 dark:text-white" />
            ) : (
              <MoonIcon className="w-5 h-5 text-gray-900 dark:text-white" />
            )}
          </button>
        </div>

        {/* Engine Selector */}
        {availableEngines.length > 0 ? (
          <select
            value={selectedEngine || ''}
            onChange={(e) => onEngineSelect(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select Engine</option>
            {availableEngines.map(([engineId]) => (
              <option key={engineId} value={engineId}>
                {engineId === 'claude-code' ? 'Claude Code' : 
                 engineId === 'codex' ? 'OpenAI Codex' : 
                 engineId === 'gemini' ? 'Gemini CLI' : engineId}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No engines detected
          </div>
        )}

        {/* Show unavailable engines */}
        {unavailableEngines.length > 0 && (
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Available: {unavailableEngines.map(id => 
              id === 'claude-code' ? 'Claude Code' : 
              id === 'codex' ? 'OpenAI Codex' : 
              id === 'gemini' ? 'Gemini CLI' : id
            ).join(', ')} (not detected)
          </div>
        )}
      </div>

      {/* Search */}
      {selectedEngine && (
        <div className="p-4">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {selectedEngine ? (
          navigationItems.map(item => renderNavigationItem(item))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {availableEngines.length === 0 ? (
              <div>
                <p className="mb-2">Initialize Claude Code or OpenAI Codex to continue</p>
                <p className="text-xs">No configuration files detected</p>
              </div>
            ) : (
              'Select an engine to view settings'
            )}
          </div>
        )}
      </div>
    </div>
  );
}