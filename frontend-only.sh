#!/bin/bash
cd "$(dirname "$0")"

# Load environment variables for frontend
export VITE_API_BASE_URL="https://bitcoin-api.solvemeet.com"
export VITE_WS_URL="wss://bitcoin-api.solvemeet.com"
export PORT=4000

echo "🚀 Starting Frontend-Only Mode"
echo "📡 API Backend: $VITE_API_BASE_URL"
echo "🔌 WebSocket: $VITE_WS_URL"
echo "🌐 Frontend Port: $PORT"
echo ""

# Run Vite frontend only
npx vite --port $PORT --host 0.0.0.0 --clearScreen false