#!/usr/bin/env node

import React from 'react';
import { render, Box, Text, useStdout } from 'ink';

function TestDashboard() {
  const { stdout } = useStdout();
  
  // Calculate terminal dimensions and layout constraints
  const terminalHeight = stdout.rows || 24;
  const terminalWidth = stdout.columns || 80;
  
  // Reserve space: Header (6 rows) + Status (1 row) + Margins (2 rows)
  const headerHeight = 6;
  const statusHeight = 1;
  const availableContentHeight = Math.max(8, terminalHeight - headerHeight - statusHeight - 2);

  const mockSettings = Array.from({length: 20}, (_, i) => ({
    key: `setting${i}`,
    label: `Setting ${i + 1}`,
    value: `Value ${i + 1}`,
    type: 'string'
  }));

  const renderSettingsList = (maxHeight) => {
    const itemsPerPage = Math.max(1, maxHeight - 3);
    const totalPages = Math.ceil(mockSettings.length / itemsPerPage);
    const currentPage = 0;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(mockSettings.length, startIndex + itemsPerPage);
    const visibleSettings = mockSettings.slice(startIndex, endIndex);

    return (
      <Box flexDirection="column" height={maxHeight}>
        <Box flexDirection="column" flexGrow={1}>
          {visibleSettings.map((setting, localIndex) => {
            const isSelected = localIndex === 0;
            
            return (
              <Box key={setting.key} marginBottom={1}>
                <Box width={40}>
                  <Text color={isSelected ? 'blue' : undefined} bold={isSelected}>
                    {isSelected ? '> ' : '  '}{setting.label}:
                  </Text>
                </Box>
                <Box>
                  <Text color={isSelected ? 'blue' : undefined}>{String(setting.value)}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {totalPages > 1 && (
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text dimColor>
              Page {currentPage + 1} of {totalPages} | Showing {startIndex + 1}-{endIndex} of {mockSettings.length} settings
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Fixed Header - Always visible */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        {/* Primary navigation line */}
        <Box>
          <Text bold color="white">Snowfort Config</Text>
          <Text> | </Text>
          <Text bold color="blue">Claude Code</Text>
          <Text> | </Text>
          <Text bold color="magenta">Global Mode</Text>
        </Box>
        
        {/* Status/help line */}
        <Box>
          <Text dimColor>Commands: Arrow keys to navigate | Enter to edit | H for help</Text>
        </Box>
        
        <Box>
          <Text dimColor>Terminal: {terminalWidth}x{terminalHeight} | Content: {availableContentHeight} rows</Text>
        </Box>
      </Box>

      {/* Content Area - Fixed Height */}
      <Box flexDirection="column" height={availableContentHeight}>
        <Box flexDirection="column" height="100%">
          {/* Settings List - Takes up most of available space */}
          {renderSettingsList(availableContentHeight - 2)}
        </Box>
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          {mockSettings.length} settings | 1 engine detected | Global mode
        </Text>
      </Box>
    </Box>
  );
}

render(<TestDashboard />);

setTimeout(() => {
  console.log('\n✅ Layout test completed');
  process.exit(0);
}, 2000);