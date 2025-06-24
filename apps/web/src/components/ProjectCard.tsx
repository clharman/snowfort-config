import { useState } from 'react';
import { McpServerEditor } from './McpServerEditor';

interface ProjectCardProps {
  project: {
    engine: string;
    engineName: string;
    path: string;
    data: any;
  };
  onUpdate: (engineId: string, projectPath: string, updates: any) => void;
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [isEditingMcp, setIsEditingMcp] = useState(false);

  const handleMcpSave = (newMcpServers: any) => {
    onUpdate(project.engine, project.path, {
      mcpServers: newMcpServers
    });
    setIsEditingMcp(false);
  };

  // Color scheme based on engine
  const getEngineColors = () => {
    if (project.engine === 'claude-code') {
      return {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950',
        title: 'text-blue-800 dark:text-blue-200',
        subtitle: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      };
    } else {
      return {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-950',
        title: 'text-green-800 dark:text-green-200',
        subtitle: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      };
    }
  };

  const colors = getEngineColors();

  return (
    <>
      <div className={`border ${colors.border} ${colors.bg} rounded-lg p-6`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${colors.title} font-mono break-all`}>
              {project.path}
            </h3>
            <div className="flex items-center gap-2">
              <p className={`text-sm ${colors.subtitle}`}>
                {project.engineName}
              </p>
              <span className={`px-2 py-1 text-xs rounded ${colors.badge}`}>
                {project.engine === 'claude-code' ? 'Claude' : 'Codex'}
              </span>
            </div>
          </div>
        </div>
      
      {project.data.lastRun && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Last run: {new Date(project.data.lastRun).toLocaleDateString()} {new Date(project.data.lastRun).toLocaleTimeString()}
        </p>
      )}
      
      <div className="flex gap-6 mb-4">
        {project.data.cost && (
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Cost: </span>
            <span className="text-green-600 dark:text-green-400">${project.data.cost.toFixed(4)}</span>
          </div>
        )}
        {project.data.duration && (
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Duration: </span>
            <span className="text-blue-600 dark:text-blue-400">{project.data.duration}s</span>
          </div>
        )}
      </div>

      {project.data.allowedTools && Array.isArray(project.data.allowedTools) && project.data.allowedTools.length > 0 && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tools: </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {project.data.allowedTools.map((tool: string) => (
              <span
                key={tool}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

        <div className={`border-t ${colors.border} pt-4`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">MCP Servers:</span>
            <button
              onClick={() => setIsEditingMcp(true)}
              className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Edit JSON
            </button>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded p-3">
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {JSON.stringify(project.data.mcpServers || {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {isEditingMcp && (
        <McpServerEditor
          mcpServers={project.data.mcpServers || {}}
          onSave={handleMcpSave}
          onCancel={() => setIsEditingMcp(false)}
        />
      )}
    </>
  );
}