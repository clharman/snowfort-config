# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Workflow
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
# NOT hot-reload like typical React apps

# For web development:
# 1. Build the web app first:
cd apps/web && pnpm build

# 2. Start the integrated server (serves built frontend + API):
node dist-server/index.js &

# Alternative: Use the convenience script from project root:
./start-dev.sh

# Run linting across all packages
pnpm lint

# Run type checking
pnpm typecheck

# Clean all build outputs
pnpm clean
```

### Testing & Running
```bash
# Test TUI locally
node apps/tui/dist/index.js

# Start web development server (recommended)
./start-dev.sh

# Alternative: Manual web server startup
cd apps/web && pnpm build && node dist-server/index.js &

# Check server health
curl http://localhost:4040/api/health

# Stop development server (if port conflict occurs)
pkill -f "node.*dist-server" || echo "No servers to kill"

# Test CLI binary
node bin/sfconfig.js --help
node bin/sfconfig.js tui
node bin/sfconfig.js web --port 3000

# Run tests
pnpm test
```

### Port Conflict Resolution
```bash
# If you get "EADDRINUSE" error on port 4040:

# 1. Find what's using the port
lsof -i :4040

# 2. Kill the specific process
kill [PID]

# 3. Or kill all node servers on that port
pkill -f "node.*dist-server"

# 4. Then restart
./start-dev.sh
```

### API Testing
```bash
# Test API endpoints (server must be running)
curl http://localhost:4040/api/state
curl -X POST -H "Content-Type: application/json" \
  -d '{"claude-code": {"verbose": true}}' \
  http://localhost:4040/api/patch
```

## Development Workflow Notes

### Web Development Pattern
This project uses a **build-first development workflow**, NOT the typical React hot-reload pattern:

1. **Build Step Required**: Frontend must be built before running (`pnpm build`)
2. **Integrated Server**: Express serves both built React frontend AND API endpoints
3. **Single Port**: Everything runs on port 4040 (no proxying needed)
4. **Production-like**: Development closely mirrors production deployment

**Why This Pattern?**
- Simpler deployment (single server binary)
- No proxy configuration complexity
- Consistent behavior between dev/prod
- Server-Sent Events work reliably

### Common Pitfalls to Avoid
- ❌ Don't run `pnpm dev` (vite only) expecting API to work
- ❌ Don't add proxy configurations to vite.config.ts
- ❌ Don't assume hot-reload development workflow
- ❌ Don't assume typical React dev patterns - always examine server code first to understand the intended architecture
- ✅ Always build first, then run the integrated server
- ✅ Use `./start-dev.sh` for automated setup

## Architecture Overview

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

### Workspace Structure
```
packages/core/     # CoreService, adapters, backup system
apps/tui/         # Ink-based terminal interface
apps/web/         # React SPA + Express server
bin/sfconfig.js   # CLI entry point using commander
```

### State Management & Real-time Updates
- **File Watching**: Core service uses chokidar to watch config files
- **Event Broadcasting**: State changes emit events to connected clients
- **IPC Communication**: 
  - TUI: Direct event listeners on CoreService
  - Web: Server-Sent Events (`/api/events`) for real-time browser updates

### Safe Configuration Editing
- **Schema Validation**: AJV validation before any writes
- **Automatic Backups**: Timestamped `.json` files in `.sfconfig-backups/`
- **Atomic Operations**: Failed writes never corrupt original files
- **Deep Merging**: Patch operations preserve unknown configuration fields

### Web Server Architecture
The web app has dual build outputs:
- **Frontend**: Vite builds React SPA to `apps/web/dist/`
- **Backend**: TypeScript compiles server to `apps/web/dist-server/`
- **Static Serving**: Express serves built frontend and handles SPA routing

## Key Implementation Notes

### TypeScript Configuration
- Core & TUI use `moduleResolution: "bundler"` for modern ESM
- Web server uses `moduleResolution: "node"` for Express compatibility
- All packages use ESM (`"type": "module"`) with `.js` imports

### Error Handling Patterns
- Validation errors include engine ID and JSON pointer location
- Configuration read failures gracefully return empty objects
- Backup restoration is atomic (success/failure, no partial states)

### Adding New Engine Support
1. Create adapter class extending `BaseAdapter`
2. Implement JSON schema in adapter
3. Add adapter to `CoreService.registerAdapters()`
4. Test with both `detect()` false and true cases

### Development & Testing Requirements
- Always test both TUI and web interfaces after core changes
- Use the web interface to visually verify configuration detection and editing
- Test file watching by manually editing config files while app is running
- Verify backup creation and restoration functionality