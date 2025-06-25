#!/bin/bash
set -e

echo "🚀 Starting Snowfort Config web server..."

# Change to web app directory and run the start script
cd apps/web
pnpm run start:wait