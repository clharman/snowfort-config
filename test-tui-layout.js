#!/usr/bin/env node

// Quick test to verify TUI header layout structure
import React from 'react';
import { render, Box, Text } from 'ink';

// Simple mock component to test layout structure
function TestLayout() {
  return (
    <Box flexDirection="column">
      {/* Header - Always at top */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        <Box>
          <Text bold color="white">Snowfort Config</Text>
          <Text> | </Text>
          <Text bold color="blue">Claude Code</Text>
          <Text> | </Text>
          <Text bold color="magenta">Global Mode</Text>
        </Box>
        
        <Box>
          <Text dimColor>Commands: ←→ Switch | ↑↓ Navigate | Enter: Edit | P: Projects | S: Search | H: Help | Q: Quit</Text>
        </Box>
      </Box>

      {/* Content Area */}
      <Box flexDirection="column" flexGrow={1}>
        <Box>
          <Text bold>Global Configuration</Text>
        </Box>
        
        <Box flexDirection="column" marginTop={1}>
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
            <Text key={i}>Setting {i}: Some configuration value</Text>
          ))}
        </Box>
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>15 settings | 1 engines detected | Global mode</Text>
      </Box>
    </Box>
  );
}

render(<TestLayout />);
console.log('\nLayout Test: Header should be visible at top, content scrollable, status at bottom');