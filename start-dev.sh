#!/bin/bash
# Development server startup script

echo "🔨 Building frontend and backend..."
cd apps/web
pnpm build

echo "🔍 Checking for existing servers on port 4040..."
if lsof -i :4040 > /dev/null 2>&1; then
  echo "⚠️  Port 4040 is in use. Stopping existing servers..."
  pkill -f "node.*dist-server" || true
  sleep 1
fi

echo "🚀 Starting server in background..."
node dist-server/index.js &
SERVER_PID=$!

echo "⏳ Waiting for server to be ready..."
sleep 2

# Wait up to 10 seconds for server to be ready
for i in {1..20}; do
  if curl -s http://localhost:4040/api/health | grep -q '"status":"ready"'; then
    echo "✅ Snowfort Config web server ready at http://localhost:4040"
    echo "📝 Server PID: $SERVER_PID"
    echo "🛑 To stop server: kill $SERVER_PID"
    echo "🔗 Open: http://localhost:4040"
    exit 0
  fi
  sleep 0.5
done

echo "❌ Server failed to start within 10 seconds"
echo "💡 Try manually: kill $SERVER_PID && ./start-dev.sh"
exit 1