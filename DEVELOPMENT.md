# Development Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server (builds + runs)
./scripts/start.sh

# 3. Open browser
open http://localhost:4040
```

## 🔧 Common Commands

```bash
# Start development server
./scripts/start.sh

# Build everything
pnpm build

# Stop all servers
pkill -f "node.*dist-server"

# Check server status
curl http://localhost:4040/api/health

# Run TUI
node apps/tui/dist/index.js
```

## 🐛 Troubleshooting

### Port 4040 Already in Use
```bash
# Find what's using the port
lsof -i :4040

# Kill all node servers on that port
pkill -f "node.*dist-server"

# Restart
./scripts/start.sh
```

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm build
```

### API Not Working
- ✅ Make sure you built first: `pnpm build`
- ✅ Use integrated server, not `pnpm dev`
- ✅ Check server is running: `curl http://localhost:4040/api/health`

## 📁 Key Files

- `./scripts/start.sh` - Development server startup script
- `apps/web/src/` - React frontend source
- `apps/web/src/server/` - Express server source
- `packages/core/` - Core configuration management
- `CLAUDE.md` - Full development documentation

## 🏗️ Architecture Notes

This project uses **build-first development**:
- Frontend must be built before running
- Express serves built React + API on one port
- No hot-reload, no proxies, production-like setup