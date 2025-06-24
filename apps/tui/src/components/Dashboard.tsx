import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';
import { useCore } from '../hooks/useCore.js';
import { EngineCard } from './EngineCard.js';
import { ProjectsView } from './ProjectsView.js';
import { RawEditor } from './RawEditor.js';

type View = 'global' | 'projects' | 'raw';

export function Dashboard() {
  const { state, loading, error } = useCore();
  const [currentView, setCurrentView] = useState<View>('global');

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

  const engines = Object.entries(state).filter(([key]) => !key.startsWith('_'));

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Snowfort Config Dashboard</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text dimColor>
          Tab: Global ↔ Projects ↔ Raw | q: Quit
        </Text>
      </Box>

      {currentView === 'global' && (
        <Box flexDirection="column">
          <Text bold>Global Configuration</Text>
          <Newline />
          {engines.map(([engineId, engineData]) => (
            <EngineCard
              key={engineId}
              engineId={engineId}
              engineData={engineData}
            />
          ))}
        </Box>
      )}

      {currentView === 'projects' && (
        <ProjectsView engines={engines} />
      )}

      {currentView === 'raw' && (
        <RawEditor engines={engines} />
      )}
    </Box>
  );
}