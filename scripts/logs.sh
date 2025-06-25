#!/bin/bash
# View server logs

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_ROOT/logs/server.log" ]; then
  echo "📝 No log file found ($PROJECT_ROOT/logs/server.log)"
  exit 1
fi

if [ "$1" = "-f" ] || [ "$1" = "--follow" ]; then
  echo "📋 Following server logs (Ctrl+C to exit)..."
  tail -f "$PROJECT_ROOT/logs/server.log"
else
  echo "📋 Recent server logs:"
  tail -n 20 "$PROJECT_ROOT/logs/server.log"
  echo ""
  echo "💡 Use './scripts/logs.sh -f' to follow live logs"
fi