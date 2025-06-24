import React from 'react';
import { Box, Text, Newline } from 'ink';

interface ProjectsViewProps {
  engines: [string, any][];
}

export function ProjectsView({ engines }: ProjectsViewProps) {
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

  return (
    <Box flexDirection="column">
      <Text bold>Projects Overview</Text>
      <Newline />
      
      {allProjects.length === 0 ? (
        <Text dimColor>No projects found</Text>
      ) : (
        allProjects.map((project, index) => (
          <Box
            key={`${project.engine}-${project.path}`}
            flexDirection="column"
            borderStyle="round"
            borderColor="blue"
            padding={1}
            marginBottom={1}
          >
            <Box justifyContent="space-between">
              <Text bold>{project.path}</Text>
              <Text dimColor>{project.engineName}</Text>
            </Box>
            
            {project.data.lastRun && (
              <Text dimColor>
                Last run: {new Date(project.data.lastRun).toLocaleDateString()}
              </Text>
            )}
            
            <Box>
              {project.data.cost && (
                <Text>Cost: ${project.data.cost.toFixed(4)} </Text>
              )}
              {project.data.duration && (
                <Text>Duration: {project.data.duration}s </Text>
              )}
            </Box>

            {project.data.allowedTools && (
              <Text dimColor>
                Tools: {project.data.allowedTools.join(', ')}
              </Text>
            )}

            {project.data.mcpServers && (
              <Text dimColor>
                MCP: {project.data.mcpServers.join(', ')}
              </Text>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}