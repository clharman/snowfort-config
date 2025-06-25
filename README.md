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

```bash
# Launch TUI directly
node apps/tui/dist/index.js

# Or use the CLI
node bin/sfconfig.js tui
```

#### Web Interface

<img width="1440" alt="image" src="https://github.com/user-attachments/assets/5b3c8cc7-3fa6-4efd-b4d0-6642eb1070bc" />

```bash
# Option 1: Use the CLI (recommended for production)
node bin/sfconfig.js web --port 4040

# Option 2: Start development server directly
./start-dev.sh

# Option 3: Manual development setup
cd apps/web && pnpm build && node dist-server/index.js &

# Open browser to http://localhost:4040
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

#### CLI Commands
```bash
# Show help
node bin/sfconfig.js --help

# Test TUI locally
node apps/tui/dist/index.js

# Test web server locally  
node apps/web/dist-server/index.js

# Test CLI binary
node bin/sfconfig.js --help
node bin/sfconfig.js tui
node bin/sfconfig.js web --port 3000
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

Current adapters: `ClaudeAdapter` (`~/.claude.json`), `CodexAdapter` (`~/.codex/config.json`)

### Configuration Files

#### Claude Code CLI
- **Primary**: `~/.claude.json` - Main configuration with projects and MCP servers
- **Project Settings**: `<project>/.claude/settings.json` - Shared project settings
- **Local Settings**: `<project>/.claude/settings.local.json` - Local-only settings
- **MCP Configuration**: `<project>/.mcp.json` - Project MCP server definitions

#### OpenAI Codex
- **Primary**: `~/.codex/config.json` - Main Codex configuration

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
