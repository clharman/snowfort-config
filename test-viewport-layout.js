#!/usr/bin/env node

// Test the viewport-constrained layout
import React from 'react';
import { render, Box, Text, useStdout } from 'ink';

function TestViewportLayout() {
  const { stdout } = useStdout();
  const terminalHeight = stdout.rows || 24;
  const availableContentHeight = terminalHeight - 8; // Reserve for header + status

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Fixed Header */}
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
        <Text bold>HEADER: Snowfort Config | Claude Code | Global Mode</Text>
        <Text dimColor>Commands: ←→ Switch | ↑↓ Navigate | Enter: Edit | H: Help</Text>
        <Text dimColor>Terminal: {stdout.columns}x{stdout.rows} | Content: {availableContentHeight} rows</Text>
      </Box>

      {/* Content Area - Fixed Height */}
      <Box flexDirection="column" height={availableContentHeight} borderStyle="single" borderColor="green">
        <Text>CONTENT AREA (height: {availableContentHeight})</Text>
        {Array.from({length: 20}, (_, i) => (
          <Text key={i}>Setting {i + 1}: Some value here</Text>
        ))}
      </Box>

      {/* Fixed Status Bar */}
      <Box borderStyle="single" borderColor="yellow" paddingX={1}>
        <Text dimColor>STATUS: 20 settings | 1 engine | Layout test</Text>
      </Box>
    </Box>
  );
}

render(<TestViewportLayout />);

setTimeout(() => {
  console.log('\n✅ Layout Test Complete');
  console.log('Header should be blue box at top');
  console.log('Content should be green box in middle (scrollable)');
  console.log('Status should be yellow box at bottom');
  process.exit(0);
}, 2000);