#!/bin/bash
# Quick start script that exits immediately to avoid timeouts

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Kill any existing servers first
pkill -f "node.*dist-server" 2>/dev/null || true
sleep 1

echo "🔨 Building..."
cd "$PROJECT_ROOT/apps/web"
pnpm build > /dev/null 2>&1

echo "🚀 Starting server..."
# Create logs directory if it doesn't exist (may be gitignored)
mkdir -p "$PROJECT_ROOT/logs"
# Redirect output to log file and background properly
nohup node dist-server/index.js > "$PROJECT_ROOT/logs/server.log" 2>&1 &
SERVER_PID=$!

# Store PID for management
echo $SERVER_PID > "$PROJECT_ROOT/logs/server.pid"

echo "✅ Server starting (PID: $SERVER_PID)"
echo "📝 Use ./scripts/status.sh to check readiness"
echo "📋 Use ./scripts/logs.sh to view output"
echo "🛑 Use ./scripts/stop.sh to stop"