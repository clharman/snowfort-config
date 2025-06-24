
import { useState } from 'react';
import { ProjectCard } from './ProjectCard';

interface ProjectsViewProps {
  engines: [string, any][];
  onProjectUpdate: (engineId: string, projectPath: string, updates: any) => void;
}

export function ProjectsView({ engines, onProjectUpdate }: ProjectsViewProps) {
  const [filter, setFilter] = useState<'all' | 'claude-code' | 'openai-codex'>('all');

  const allProjects: Array<{
    engine: string;
    engineName: string;
    path: string;
    data: any;
  }> = [];

  engines.forEach(([engineId, engineData]) => {
    if (engineData.projects) {
      Object.entries(engineData.projects).forEach(([projectPath, projectData]) => {
        allProjects.push({
          engine: engineId,
          engineName: engineData._meta?.name || engineId,
          path: projectPath,
          data: projectData as any
        });
      });
    }
  });

  const filteredProjects = allProjects.filter(project => {
    if (filter === 'all') return true;
    return project.engine === filter;
  });

  const claudeCount = allProjects.filter(p => p.engine === 'claude-code').length;
  const codexCount = allProjects.filter(p => p.engine === 'openai-codex').length;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Overview</h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({allProjects.length})
            </button>
            <button
              onClick={() => setFilter('claude-code')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'claude-code'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              Claude ({claudeCount})
            </button>
            <button
              onClick={() => setFilter('openai-codex')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'openai-codex'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300'
              }`}
            >
              Codex ({codexCount})
            </button>
          </div>
        </div>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'No projects found' : `No ${filter === 'claude-code' ? 'Claude' : 'Codex'} projects found`}
          </p>
        </div>
      ) : (
        <div className="w-full grid gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={`${project.engine}-${project.path}`}
              project={project}
              onUpdate={onProjectUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}