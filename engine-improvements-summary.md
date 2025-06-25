# ✅ Engine Discovery & Navigation Improvements - COMPLETED

## Key Improvements Made

### 1. **Always Show All Supported Engines**
- **Before**: Only showed engines when detected/configured
- **After**: Always shows Claude Code and OpenAI Codex, even when not configured
- **Benefit**: Users can discover and switch to unconfigured engines to see setup instructions

### 2. **Inline Navigation Hints**
- **Engine Switching**: Shows `[Ctrl+←→]` next to engine name in header
- **Mode Switching**: Shows `[P]` next to mode (Global/Project) in header
- **Header Example**: `Snowfort Config | Claude Code (1/2) [Ctrl+←→] | Global Mode [P]`

### 3. **Helpful Setup Instructions**
When switching to an unconfigured engine, users see:
```
Claude Code Not Detected

Configure Claude Code to get started:

1. Install Claude Code CLI
2. Run initial setup to create ~/.claude.json  
3. Restart this application

Use Ctrl+←→ to switch between engines
```

### 4. **Enhanced Status Bar**
- **Before**: `15 settings | 1 engines detected | Global mode`
- **After**: `Configure engine to view settings | 1/2 engines detected | Global mode`

Shows detected vs total engines (e.g., "1/2 engines detected")

### 5. **Always-Available Engine Switching**
- **Ctrl + →**: Next engine (Claude Code → OpenAI Codex → Claude Code)
- **Ctrl + ←**: Previous engine (reverse order)
- Works even when engines aren't configured (shows setup instructions)

## User Experience Flow

### Scenario 1: First-Time User
1. Launches TUI → Automatically shows Claude Code (1/2)
2. Sees "Claude Code Not Detected" with setup instructions
3. Uses `Ctrl+→` to switch to OpenAI Codex (2/2)
4. Sees "OpenAI Codex Not Detected" with setup instructions
5. **Discovers**: Both engines exist and how to configure them

### Scenario 2: Claude Code User Discovering Codex
1. Using Claude Code normally (configured)
2. Notices header shows "Claude Code (1/2) [Ctrl+←→]"
3. Presses `Ctrl+→` to see OpenAI Codex
4. Sees setup instructions for Codex
5. **Discovers**: How to add second engine to their workflow

### Scenario 3: Power User with Both Engines
1. Header shows current engine and position: "Claude Code (1/2)"
2. Uses `Ctrl+←→` to quickly switch between engines
3. Each engine maintains independent Global/Project configurations
4. Seamless workflow across multiple AI CLI tools

## Technical Implementation

### Engine Discovery Logic
```typescript
// Always show both engines, even if not detected
const allSupportedEngines = [
  { id: 'claude-code', name: 'Claude Code', detected: /* check detection */ },
  { id: 'codex', name: 'OpenAI Codex', detected: /* check detection */ }
];

// Use allSupportedEngines for navigation, availableEngines for functionality
```

### Dynamic Content Based on Detection
- **Detected**: Shows normal settings interface
- **Not Detected**: Shows configuration instructions and setup steps
- **Header**: Always shows engine switching hints and current position

### Navigation Hierarchy
```
Ctrl+←→    : Switch Engines (Claude Code ↔ OpenAI Codex)
P          : Switch Modes (Global ↔ Project)
Shift+←→   : Switch Projects (when in Project mode)
←→         : Switch Sections (when in Project mode)
↑↓         : Navigate Settings
```

## Benefits

1. **Discoverability**: Users learn about all supported engines
2. **Guided Setup**: Clear instructions for configuring new engines  
3. **Visual Cues**: Navigation hints directly in the interface
4. **Consistent UX**: Same interface whether engines are configured or not
5. **Easy Switching**: Intuitive Ctrl+arrow navigation between engines

Users no longer need to know about OpenAI Codex beforehand - they can discover it through the interface and get guided setup instructions!