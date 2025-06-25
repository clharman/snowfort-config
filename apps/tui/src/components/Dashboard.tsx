import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useCore } from '../hooks/useCore.js';

export function Dashboard() {
  const { state, loading, error } = useCore();
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState('global');

  const engines = Object.entries(state).filter(([key]) => !key.startsWith('_'));
  
  // Filter available engines (Claude Code and Codex)
  const availableEngines = engines.filter(([engineId, engineData]) => {
    return (engineId === 'claude-code' || engineId === 'codex') && engineData._meta?.detected;
  });

  // Auto-select first available engine on load
  useEffect(() => {
    if (!selectedEngine && availableEngines.length > 0) {
      const claudeCode = availableEngines.find(([id]) => id === 'claude-code');
      const codex = availableEngines.find(([id]) => id === 'codex');
      
      if (claudeCode) {
        setSelectedEngine('claude-code');
      } else if (codex) {
        setSelectedEngine('codex');
      }
    }
  }, [availableEngines, selectedEngine]);

  useInput((input, key) => {
    if (input === 'q') {
      process.exit(0);
    }
    
    if (key.leftArrow || key.rightArrow) {
      // Switch between engines
      if (availableEngines.length > 1) {
        const currentIndex = availableEngines.findIndex(([id]) => id === selectedEngine);
        let newIndex;
        if (key.rightArrow) {
          newIndex = (currentIndex + 1) % availableEngines.length;
        } else {
          newIndex = currentIndex - 1 < 0 ? availableEngines.length - 1 : currentIndex - 1;
        }
        if (availableEngines[newIndex]) {
          setSelectedEngine(availableEngines[newIndex][0]);
        }
      }
    }

    if (key.upArrow || key.downArrow) {
      // Switch between sections
      const sections = ['global', 'projects', 'raw'];
      const currentIndex = sections.indexOf(selectedSection);
      let newIndex;
      if (key.downArrow) {
        newIndex = (currentIndex + 1) % sections.length;
      } else {
        newIndex = currentIndex - 1 < 0 ? sections.length - 1 : currentIndex - 1;
      }
      setSelectedSection(sections[newIndex]);
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

  const renderEngineCard = (engineId: string, engineData: any) => {
    const meta = engineData._meta;
    const isSelected = engineId === selectedEngine;
    
    return (
      <Box key={engineId} flexDirection="column" borderStyle={isSelected ? 'double' : 'single'} 
           borderColor={isSelected ? 'blue' : 'gray'} padding={1} marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color={isSelected ? 'blue' : undefined}>
            {meta?.name || engineId}
          </Text>
          <Text dimColor> [{meta?.detected ? 'DETECTED' : 'NOT DETECTED'}]</Text>
        </Box>
        
        {meta?.detected && (
          <Box flexDirection="column">
            <Text>Path: <Text dimColor>{meta.configPath}</Text></Text>
            <Text>Modified: <Text dimColor>{new Date(meta.lastModified).toLocaleString()}</Text></Text>
            
            {selectedSection === 'global' && engineId === selectedEngine && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Global Settings:</Text>
                {engineData.autoUpdates !== undefined && (
                  <Text>Auto Updates: <Text color={engineData.autoUpdates ? 'green' : 'red'}>
                    {engineData.autoUpdates ? 'Yes' : 'No'}
                  </Text></Text>
                )}
                {engineData.installMethod && (
                  <Text>Install Method: <Text dimColor>{engineData.installMethod}</Text></Text>
                )}
                {engineData.hasCompletedOnboarding !== undefined && (
                  <Text>Onboarding Complete: <Text color={engineData.hasCompletedOnboarding ? 'green' : 'red'}>
                    {engineData.hasCompletedOnboarding ? 'Yes' : 'No'}
                  </Text></Text>
                )}
                {engineData.numStartups && (
                  <Text>Startups: <Text>{engineData.numStartups.toLocaleString()}</Text></Text>
                )}
              </Box>
            )}

            {selectedSection === 'projects' && engineId === selectedEngine && engineData.projects && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Projects ({Object.keys(engineData.projects).length}):</Text>
                {Object.keys(engineData.projects).slice(0, 3).map(projectPath => (
                  <Text key={projectPath} dimColor>• {projectPath.split('/').pop()}</Text>
                ))}
                {Object.keys(engineData.projects).length > 3 && (
                  <Text dimColor>... and {Object.keys(engineData.projects).length - 3} more</Text>
                )}
              </Box>
            )}

            {selectedSection === 'raw' && engineId === selectedEngine && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Raw Configuration Preview:</Text>
                <Text dimColor>{JSON.stringify(engineData, null, 2).slice(0, 200)}...</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold>Snowfort Config Dashboard - </Text>
        <Text>
          {selectedEngine ? 
            (selectedEngine === 'claude-code' ? 'Claude Code' : 'OpenAI Codex') : 
            'No Engine Selected'
          }
        </Text>
      </Box>
      
      {/* Navigation Help */}
      <Box marginBottom={1}>
        <Text dimColor>
          ←→: Switch Engine | ↑↓: Switch Section ({selectedSection}) | q: Quit
        </Text>
      </Box>

      {/* Engines Status */}
      <Box marginBottom={1}>
        <Text>Engines: </Text>
        {availableEngines.map(([engineId]) => (
          <Text key={engineId} color={engineId === selectedEngine ? 'blue' : 'green'}>
            {engineId === 'claude-code' ? 'Claude Code' : 'OpenAI Codex'}
            {engineId !== availableEngines[availableEngines.length - 1][0] && ' | '}
          </Text>
        ))}
        {availableEngines.length === 0 && (
          <Text color="yellow">Initialize Claude Code or OpenAI Codex to continue</Text>
        )}
      </Box>

      {/* Content */}
      {availableEngines.length === 0 ? (
        <Box>
          <Text color="yellow">No AI CLI tools detected. Please set up Claude Code or OpenAI Codex first.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>
              {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} Configuration
            </Text>
          </Box>
          {availableEngines
            .filter(([engineId]) => engineId === selectedEngine)
            .map(([engineId, engineData]) => renderEngineCard(engineId, engineData))
          }
        </Box>
      )}
    </Box>
  );
}