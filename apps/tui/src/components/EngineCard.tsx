import React from 'react';
import { Box, Text } from 'ink';

interface EngineCardProps {
  engineId: string;
  engineData: any;
}

export function EngineCard({ engineId, engineData }: EngineCardProps) {
  const meta = engineData._meta;
  const detected = meta?.detected ?? false;
  const lastModified = meta?.lastModified ? new Date(meta.lastModified) : null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={detected ? 'green' : 'yellow'}
      padding={1}
      marginBottom={1}
    >
      <Box justifyContent="space-between">
        <Text bold color={detected ? 'green' : 'yellow'}>
          {meta?.name || engineId}
        </Text>
        <Text dimColor>
          {detected ? '●' : '○'} {detected ? 'Detected' : 'Not Found'}
        </Text>
      </Box>
      
      <Text dimColor>{meta?.configPath}</Text>
      
      {lastModified && (
        <Text dimColor>
          Last modified: {lastModified.toLocaleDateString()}
        </Text>
      )}

      {detected && (
        <Box flexDirection="column" marginTop={1}>
          {engineData.verbose !== undefined && (
            <Box>
              <Text>Verbose: </Text>
              <Text color={engineData.verbose ? 'green' : 'red'}>
                {engineData.verbose ? 'ON' : 'OFF'}
              </Text>
            </Box>
          )}
          
          {engineData.completedOnboarding !== undefined && (
            <Box>
              <Text>Onboarding: </Text>
              <Text color={engineData.completedOnboarding ? 'green' : 'yellow'}>
                {engineData.completedOnboarding ? 'Complete' : 'Pending'}
              </Text>
            </Box>
          )}

          {engineData.projects && Object.keys(engineData.projects).length > 0 && (
            <Text>
              Projects: {Object.keys(engineData.projects).length}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}