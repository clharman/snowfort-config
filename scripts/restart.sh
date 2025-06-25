#!/bin/bash
# Restart the development server

echo "🔄 Restarting server..."
./scripts/stop.sh
sleep 1
./scripts/start.sh