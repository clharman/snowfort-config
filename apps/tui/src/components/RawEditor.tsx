import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';

interface RawEditorProps {
  engines: [string, any][];
}

export function RawEditor({ engines }: RawEditorProps) {
  const [selectedEngine, setSelectedEngine] = useState(0);

  if (engines.length === 0) {
    return (
      <Box>
        <Text dimColor>No engines detected</Text>
      </Box>
    );
  }

  const [engineId, engineData] = engines[selectedEngine];
  const meta = engineData._meta;

  return (
    <Box flexDirection="column">
      <Text bold>Raw Configuration Editor</Text>
      <Text dimColor>↑↓: Select engine | E: Edit with $EDITOR</Text>
      <Newline />
      
      <Box flexDirection="column">
        {engines.map(([id, data], index) => (
          <Text
            key={id}
            color={index === selectedEngine ? 'blue' : undefined}
            bold={index === selectedEngine}
          >
            {index === selectedEngine ? '► ' : '  '}
            {data._meta?.name || id} ({data._meta?.detected ? 'detected' : 'not found'})
          </Text>
        ))}
      </Box>
      
      <Newline />
      
      <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
        <Text bold>Configuration Preview</Text>
        <Text dimColor>Path: {meta?.configPath}</Text>
        <Newline />
        
        {meta?.detected ? (
          <Box flexDirection="column">
            <Text>{JSON.stringify(
              Object.fromEntries(
                Object.entries(engineData).filter(([key]) => !key.startsWith('_'))
              ),
              null,
              2
            )}</Text>
          </Box>
        ) : (
          <Text dimColor>Configuration file not found</Text>
        )}
      </Box>
    </Box>
  );
}