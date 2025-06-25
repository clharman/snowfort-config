#!/bin/bash
# Stop the development server

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/logs/server.pid" ]; then
  PID=$(cat "$PROJECT_ROOT/logs/server.pid")
  if kill -0 $PID 2>/dev/null; then
    echo "🛑 Stopping server (PID: $PID)..."
    kill $PID
    rm "$PROJECT_ROOT/logs/server.pid"
    echo "✅ Server stopped"
  else
    echo "⚠️  PID $PID not running, cleaning up..."
    rm "$PROJECT_ROOT/logs/server.pid"
  fi
else
  echo "🔍 Checking for any running servers..."
  if pkill -f "node.*dist-server"; then
    echo "✅ Killed running servers"
  else
    echo "ℹ️  No servers found running"
  fi
fi