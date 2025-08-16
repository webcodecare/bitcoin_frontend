#!/bin/bash

echo "🚀 Starting Frontend_new on Port 3001..."
echo "📡 Backend API: localhost:5000 (via proxy)"
echo "🌐 Frontend URL: http://localhost:3001"
echo "⚙️  Configuration: All ports configured to avoid conflicts"
echo ""

# Navigate to frontend_new directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "✅ Starting Vite dev server on port 3001..."
npm run dev