#!/bin/bash
set -e

# Arihant BOS - Unified Production Runner
# Runs NestJS API on port 4000 and Next.js Frontend on port 3000 concurrently

echo "=================================================="
echo "🚀 Starting Arihant BOS (Unified Production Mode)"
echo "=================================================="

# Ensure environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-4000}
export WEB_PORT=${WEB_PORT:-3000}

# Start NestJS API in background
echo "📦 [1/2] Starting NestJS Backend on port $PORT..."
(cd apps/api && node dist/main.js) &
API_PID=$!

# Wait briefly for API to bind
sleep 2

# Start Next.js Frontend in foreground
echo "🌐 [2/2] Starting Next.js Frontend on port $WEB_PORT..."
echo "⚡ Public Entrypoint: http://localhost:$WEB_PORT (API proxied via /api/*)"
(cd apps/web && ./node_modules/.bin/next start -p $WEB_PORT) &
WEB_PID=$!

# Trap termination signals to kill both child processes cleanly
trap 'echo "🛑 Stopping Arihant BOS services..."; kill -TERM $API_PID $WEB_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# Keep script running while processes are alive
wait $API_PID $WEB_PID
