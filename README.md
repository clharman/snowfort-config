# Snowfort Config

A lightweight, cross-platform utility for reading, displaying, and safely editing local configuration files for generative AI CLIs including **Claude Code CLI**, **OpenAI Codex**, and **Gemini CLI**.

## Features

- **Multi-Engine Support**: Manages configurations for Claude Code CLI, OpenAI Codex, and Gemini CLI
- **Dual Interface**: Both Terminal UI (TUI) and Web interface
- **Real-time Updates**: File watching with live configuration updates
- **Safe Editing**: Automatic backups and JSON schema validation
- **MCP Server Management**: Complete MCP (Model Context Protocol) server configuration editing
- **Color-coded Interface**: Visual distinction between different AI engines
- **Dark/Light Themes**: Full theme support across all interfaces

## Quick Start

### Installation

#### Via npm/npx (Recommended)
```bash
# Install globally
npm install -g sfconfig

# Or use with npx (no installation required)
npx sfconfig --help
```

#### From Source
```bash
# Clone the repository
git clone https://github.com/snowfort-ai/config.git
cd config

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Usage

#### Terminal UI

<img width="706" alt="image" src="https://github.com/user-attachments/assets/2cbbbe95-2da8-4b95-b2b1-4ed15a256f53" />

#### Simple Flag-based Commands
```bash
# Launch Terminal UI
npx sfconfig --tui
# or: sfconfig --tui (if installed globally)

# Launch Web UI (default port 4040)
npx sfconfig --web
# or: sfconfig --web

# Launch Web UI with custom port
npx sfconfig --web --port 3000
# or: sfconfig --web --port 3000

# Show help
npx sfconfig --help
```

#### Web Interface

<img width="1440" alt="image" src="https://github.com/user-attachments/assets/5b3c8cc7-3fa6-4efd-b4d0-6642eb1070bc" />

#### Subcommand Style (also supported)
```bash
# Terminal UI
npx sfconfig tui

# Web interface with options
npx sfconfig web --port 4040 --no-open

# With custom config path
npx sfconfig tui --config /path/to/config.json
```

#### Development Server Management
```bash
# Start development server (builds and runs in background)
./start-dev.sh

# Check if server is running
curl http://localhost:4040/api/health

# Stop server (if port is in use)
# Find process: lsof -i :4040
# Kill process: kill [PID]

# Or kill all node servers on port 4040:
pkill -f "node.*dist-server"
```

#### All Available Options
```bash
# Show help
sfconfig --help

# Interface selection (choose one)
sfconfig --tui              # Launch terminal UI
sfconfig --web              # Launch web UI

# Web-specific options
sfconfig --web --port 3000  # Custom port
sfconfig --web --no-open    # Don't auto-open browser

# General options (work with both interfaces)
sfconfig --tui --config /path/to/config.json    # Custom config path
sfconfig --web --no-update-check                # Disable update notifications

# Subcommand style (legacy support)
sfconfig tui [options]      # Terminal UI subcommand
sfconfig web [options]      # Web UI subcommand
```

#### Development Testing
```bash
# Test built CLI locally (from source)
node bin/sfconfig.js --help
node bin/sfconfig.js --tui
node bin/sfconfig.js --web --port 3000
```

## Development

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
The application uses a centralized **CoreService** that manages configuration state and acts as an event emitter. Both TUI and web interfaces consume this service:

- **TUI**: Directly instantiates CoreService in React hooks
- **Web**: Express server hosts CoreService and exposes REST API + Server-Sent Events

### Engine Adapter System
New AI CLI tools are supported through the **EngineAdapter** interface. Each adapter implements:
- `detect()` - Check if configuration file exists
- `read()` - Parse configuration from disk  
- `validate(data)` - JSON schema validation
- `write(data)` - Safe atomic writes with backup
- `getConfigPath()` - Resolve configuration file location

Current adapters: `ClaudeAdapter` (`~/.claude.json`), `CodexAdapter` (`~/.codex/config.json`), `GeminiAdapter` (`~/.gemini/config.json`)

### Configuration Files

#### Claude Code CLI
- **Primary**: `~/.claude.json` - Main configuration with projects and MCP servers
- **Project Settings**: `<project>/.claude/settings.json` - Shared project settings
- **Local Settings**: `<project>/.claude/settings.local.json` - Local-only settings
- **MCP Configuration**: `<project>/.mcp.json` - Project MCP server definitions

#### OpenAI Codex
- **Primary**: `~/.codex/config.json` - Main Codex configuration

#### Gemini CLI
- **Primary**: `~/.gemini/config.json` - Main Gemini configuration
- **OAuth Credentials**: `~/.gemini/oauth_creds.json` - Authentication tokens
- **User ID**: `~/.gemini/user_id` - User identification
- **Context File**: `~/.gemini/GEMINI.md` - Context instructions for conversations
- **Session Logs**: `~/.gemini/tmp/` - Conversation history and logs

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
