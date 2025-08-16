#!/bin/bash

echo "🚀 Starting Frontend-Only Mode for Frontend_new"
echo "📡 API Backend: https://bitcoin-api.solvemeet.com"
echo "🔌 WebSocket: wss://bitcoin-api.solvemeet.com"
echo "🌐 Frontend Port: 4000"
echo ""

# Start Vite development server
vite --port 4000 --host 0.0.0.0