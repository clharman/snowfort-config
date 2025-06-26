# Snowfort Config

A lightweight, cross-platform utility for reading, displaying, and safely editing local configuration files for generative AI CLIs including **Claude Code CLI**, **OpenAI Codex**, and **Gemini CLI**.

## 🚀 Quick Install & Run

```bash
# Launch Web UI (no installation required)
npx sfconfig

# Or install globally
npm install -g sfconfig
sfconfig --help
```

## ✨ Features

- **Multi-Engine Support**: Manages configurations for Claude Code CLI, OpenAI Codex, and Gemini CLI
- **Web Interface**: Clean, intuitive browser-based configuration management
- **Real-time Updates**: File watching with live configuration updates
- **Safe Editing**: Automatic backups and JSON schema validation
- **MCP Server Management**: Complete MCP (Model Context Protocol) server configuration editing
- **Color-coded Interface**: Visual distinction between different AI engines
- **Dark/Light Themes**: Full theme support

## 📖 Usage Examples

### Web Interface

<img width="1440" alt="image" src="https://github.com/user-attachments/assets/5b3c8cc7-3fa6-4efd-b4d0-6642eb1070bc" />

```bash
# Launch Web UI (default)
npx sfconfig
# or: sfconfig (if installed globally)

# Launch Web UI with custom port
npx sfconfig --port 3000
# or: sfconfig --port 3000
```

### Cross-Engine MCP Server Management

One of the key features is the ability to copy MCP server configurations between different AI engines and projects:

![MCP Server Copying Interface](copy-mcp.png)

*Copy MCP servers from other engines (like Gemini CLI) or projects directly into any configuration*

## 🛠️ Installation Options

### Via npm/npx (Recommended)
```bash
# Install globally
npm install -g sfconfig

# Or use with npx (no installation required)
npx sfconfig
```

### From Source
```bash
# Clone the repository
git clone https://github.com/snowfort-ai/config.git
cd config

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## 🎯 All Available Commands

```bash
# Default behavior (launches web UI)
sfconfig                    # Launch web UI on port 4040

# Web UI options
sfconfig --port 3000        # Custom port
sfconfig --no-open          # Don't auto-open browser
sfconfig --no-update-check  # Disable update notifications
sfconfig --config /path     # Custom config path

# Subcommand style (also supported)
sfconfig web [options]      # Web UI subcommand

# Show help
sfconfig --help
```

## 🛠️ Development

### Essential Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Build all packages and apps
pnpm build

# Build only core package
pnpm --filter @snowfort/config-core run build

# Build only web app (includes server)
pnpm --filter @snowfort/config-web run build

# IMPORTANT: Web development uses build-first workflow
# Start development server (builds frontend + starts server)
./start-dev.sh

# Alternative: Manual development setup
cd apps/web && pnpm build && node dist-server/index.js &

# Run linting across all packages
pnpm lint

# Run type checking
pnpm typecheck

# Clean all build outputs
pnpm clean

# Run tests
pnpm test
```

### API Testing
```bash
# Test API endpoints (server must be running)
curl http://localhost:4040/api/state
curl -X POST -H "Content-Type: application/json" \
  -d '{"claude-code": {"verbose": true}}' \
  http://localhost:4040/api/patch
```

## Architecture

### Core Service Pattern
The application uses a centralized **CoreService** that manages configuration state and acts as an event emitter. The web interface consumes this service:

- **Web**: Express server hosts CoreService and exposes REST API + Server-Sent Events

### Engine Adapter System
New AI CLI tools are supported through the **EngineAdapter** interface. Each adapter implements:
- `detect()` - Check if configuration file exists
- `read()` - Parse configuration from disk  
- `validate(data)` - JSON schema validation
- `write(data)` - Safe atomic writes with backup
- `getConfigPath()` - Resolve configuration file location

Current adapters: `ClaudeAdapter` (`~/.claude.json`), `CodexAdapter` (`~/.codex/config.json`), `GeminiAdapter` (`~/.gemini/settings.json`)

## Configuration Schemas & File Formats

Snowfort Config supports **3 engine adapters** with comprehensive configuration management:

### 1. Claude Code CLI (`claude-code`)

**Configuration File**: `~/.claude.json`

**Core Settings:**
- `api_key` (string): API key for Claude service
- `model` (string): Default model to use
- `max_project_files` (number): Maximum project files to include
- `verbose` (boolean): Enable verbose logging

**Account & Authentication:**
- `oauthAccount` (object): OAuth account information
  - `accountUuid`, `emailAddress`, `organizationUuid`
  - `organizationRole`, `workspaceRole`, `organizationName`

**System Integration:**
- `bypassPermissionsModeAccepted`, `hasCompletedOnboarding` (boolean)
- `appleTerminalSetupInProgress`, `optionAsMetaKeyInstalled` (boolean)
- `installMethod` (string): Installation method used

**Projects Configuration:**
Each project path contains:
- **Runtime Data**: `lastRun`, `cost`, `duration`, token usage metrics
- **Tool Permissions**: `allowedTools` (array): Permitted tools for project
- **MCP Integration**: `mcpContextUris`, `enabledMcpjsonServers`, `disabledMcpjsonServers`
- **MCP Servers**: Server definitions with `command`, `args`, `env`

**Example Project Structure:**
```json
{
  "/Users/user/project": {
    "allowedTools": ["bash", "str_replace_editor"],
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest", "--image-responses", "allow"],
        "env": { "NODE_ENV": "development" }
      }
    },
    "lastRun": "2024-01-15T10:30:00Z",
    "cost": 0.45,
    "duration": 1200
  }
}
```

### 2. OpenAI Codex (`codex`)

**Configuration File**: `~/.codex/config.json`

**Provider & Model Configuration:**
- `model` (string): AI model to use (e.g., "o4-mini")
- `provider` (string): Provider name (e.g., "azure")
- `providers` (object): Provider configurations
  ```json
  {
    "azure": {
      "name": "AzureOpenAI",
      "baseURL": "https://openai-all-purpose.openai.azure.com/openai",
      "envKey": "AZURE_OPENAI_API_KEY"
    }
  }
  ```

**AI Configuration:**
- `flexMode` (boolean): Enable flexible mode
- `reasoningEffort` (enum): "Low", "Medium", "High"
- `temperature`, `max_tokens` (number): Model parameters

**Storage & History:**
- `disableResponseStorage` (boolean): Disable response storage
- `history.maxSize` (number): Maximum history size
- `history.saveHistory` (boolean): Enable history saving
- `history.sensitivePatterns` (array): Patterns to redact

**Tool Configuration:**
- `tools.shell.maxBytes`, `tools.shell.maxLines` (number): Shell output limits

**Project Management:**
- `projects` (object): Per-project configurations with usage statistics

### 3. Gemini CLI (`gemini`)

**Primary Configuration**: `~/.gemini/settings.json`

**Additional Files:**
- `~/.gemini/oauth_creds.json`: OAuth credentials (sensitive)
- `~/.gemini/user_id`: Plain text user identifier
- `~/.gemini/GEMINI.md`: Context instructions file
- `~/.gemini/tmp/*/logs.json`: Session history logs

**Visual & Interface:**
- `theme` (enum): "Default", "GitHub", "Dark", "Light"
- `selectedAuthType` (enum): "oauth-personal", "oauth-workspace", "api-key"
- `contextFileName` (string): Context file name (default: GEMINI.md)
- `preferredEditor` (enum): "vscode", "vim", "nano", "emacs", "cursor"

**Execution Settings:**
- `sandbox` (boolean|string): Sandboxing configuration
- `autoAccept` (boolean): Auto-accept safe tool calls

**Tool Management:**
- `coreTools` (array): Allowed core tools
- `excludeTools` (array): Excluded tools
- `toolDiscoveryCommand`, `toolCallCommand` (string): Custom tool commands

**MCP Server Configuration:**
Same structure as Claude Code:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "string",
      "args": ["array"],
      "env": { "KEY": "value" }
    }
  }
}
```

**Session & Conversation:**
- `checkpointing` (boolean): Enable state saving/restoration
- `conversationHistory.maxEntries` (number): Max conversation entries
- `conversationHistory.saveToFile` (boolean): Save to file
- `conversationHistory.filePath` (string): History file path

**Advanced API Settings:**
- `apiEndpoint` (string): Custom API endpoint
- `model` (string): Default model
- `maxTokens` (number): Token limit
- `temperature` (number): Response temperature

## Data Flow & Architecture

### Configuration Detection & Loading
1. **File Discovery**: Each adapter scans for its configuration files
2. **Hierarchical Loading**: Claude settings support precedence-based loading
3. **Real-time Monitoring**: chokidar watches for configuration changes
4. **Event Broadcasting**: State changes notify the web interface via events

### Safe Configuration Management
- **Automatic Backups**: Timestamped `.json` files in `.sfconfig-backups/`
- **Schema Validation**: AJV validation (currently permissive to allow unknown fields)
- **Atomic Operations**: Failed writes never corrupt original files
- **Deep Merging**: Patch operations preserve unknown configuration fields

### Multi-Engine Support
The unified web interface allows:
- **Cross-engine Viewing**: See all AI CLI configurations in one place
- **Consistent Editing**: Same interface for different configuration formats
- **MCP Server Management**: Unified MCP server configuration across engines
- **Project-based Organization**: View configurations by project directory

This comprehensive schema support enables safe, unified management of all major AI CLI tool configurations while preserving the unique features and settings of each engine.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

---

Built with TypeScript, React, Ink, Vite, and Tailwind CSS.
