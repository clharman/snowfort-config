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

# For web development - USE THESE COMMANDS (they avoid timeouts):
./scripts/start.sh   # Quick start (exits immediately)
./scripts/status.sh  # Check if server is running
./scripts/stop.sh    # Stop server
./scripts/logs.sh    # View server output
./scripts/restart.sh # Restart server

# Run linting across all packages
pnpm lint

# Run type checking
pnpm typecheck

# Clean all build outputs
pnpm clean
```

### Testing & Running
```bash
# Start web development server (RECOMMENDED - avoids timeouts)
./scripts/start.sh

# Check server status and health
./scripts/status.sh

# View server logs
./scripts/logs.sh

# Stop development server
./scripts/stop.sh

# Test CLI binary
node bin/sfconfig.js --help
node bin/sfconfig.js web
node bin/sfconfig.js web --port 3000

# Run tests
pnpm test
```

### Server Management
```bash
# Start server (builds and starts, exits immediately)
./scripts/start.sh

# Check if server is running and healthy
./scripts/status.sh

# Stop server cleanly
./scripts/stop.sh

# Restart server (stop + start)
./scripts/restart.sh

# View server logs (recent)
./scripts/logs.sh

# Follow live logs
./scripts/logs.sh -f

# If port conflicts occur, use stop then start
./scripts/stop.sh && ./scripts/start.sh
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
- ❌ Don't use `./start-dev.sh` (causes timeouts in Claude Code)
- ❌ Don't assume typical React dev patterns - always examine server code first to understand the intended architecture
- ✅ Always build first, then run the integrated server
- ✅ Use `./scripts/start.sh` for automation (exits immediately, no timeouts)
- ✅ Use `./scripts/status.sh` to verify server started successfully

### Claude Code Operational Best Practices

**CRITICAL for automation:** Always use the `./scripts/` commands to avoid timeouts:

1. **Starting the server:** 
   ```bash
   ./scripts/start.sh    # Builds, starts, exits immediately
   ./scripts/status.sh   # Verify it started (run separately)
   ```

2. **Checking server status:**
   ```bash
   ./scripts/status.sh   # Shows PID, health check, URL
   ```

3. **Viewing logs:**
   ```bash
   ./scripts/logs.sh     # Recent logs
   ./scripts/logs.sh -f  # Follow live (only for manual debugging)
   ```

4. **Stopping/restarting:**
   ```bash
   ./scripts/stop.sh     # Clean shutdown
   ./scripts/restart.sh  # Stop + start
   ```

**Why these scripts matter:**
- The old `./start-dev.sh` waits 10+ seconds doing health checks, causing Claude Code tool timeouts
- New scripts start the server and exit immediately, then you check status separately
- Proper backgrounding with log redirection and PID management
- Avoids the "server started but command timed out" confusion

## Architecture Overview

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

Current adapters: `ClaudeAdapter` (`~/.claude.json`), `CodexAdapter` (`~/.codex/config.json`)

### Workspace Structure
```
packages/core/     # CoreService, adapters, backup system
apps/web/         # React SPA + Express server
bin/sfconfig.js   # CLI entry point using commander
```

### State Management & Real-time Updates
- **File Watching**: Core service uses chokidar to watch config files
- **Event Broadcasting**: State changes emit events to connected clients
- **IPC Communication**: 
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
- Core package uses `moduleResolution: "bundler"` for modern ESM
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
- Use the web interface to visually verify configuration detection and editing
- Test file watching by manually editing config files while app is running
- Verify backup creation and restoration functionality