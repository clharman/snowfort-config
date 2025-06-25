#!/bin/bash
# Check server status

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/logs/server.pid" ]; then
  PID=$(cat "$PROJECT_ROOT/logs/server.pid")
  if kill -0 $PID 2>/dev/null; then
    echo "🟢 Server running (PID: $PID)"
    
    # Test if server is responding
    if curl -s http://localhost:4040/api/health | grep -q '"status":"ready"' 2>/dev/null; then
      echo "✅ Server healthy at http://localhost:4040"
    else
      echo "⚠️  Server process running but not responding"
    fi
  else
    echo "🔴 Server not running (stale PID file)"
    rm "$PROJECT_ROOT/logs/server.pid"
  fi
else
  echo "🔴 Server not running (no PID file)"
  
  # Check for any rogue processes
  if pgrep -f "node.*dist-server" > /dev/null; then
    echo "⚠️  Found untracked server processes:"
    ps aux | grep "node.*dist-server" | grep -v grep
  fi
fi