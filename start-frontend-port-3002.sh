#!/bin/bash

# Frontend Startup Script for Port 3002
# This script ensures proper local development setup

echo "🚀 Starting Frontend on Port 3002..."
echo ""

# Check if backend is running on port 5000
echo "🔍 Checking if backend is running on port 5000..."
if ! nc -z localhost 5000 2>/dev/null; then
    echo "⚠️  WARNING: Backend not detected on port 5000!"
    echo ""
    echo "Please start the backend first:"
    echo "  1. Open another terminal"
    echo "  2. Go to the main project directory (not frontend_new)"
    echo "  3. Run: npm run dev"
    echo ""
    echo "The backend must be running on port 5000 for the frontend to work properly."
    echo ""
    read -p "Press Enter when backend is ready, or Ctrl+C to cancel..."
fi

echo "✅ Backend detected on port 5000"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🌐 Starting Vite dev server on port 3002..."
echo "   Frontend will be available at: http://localhost:3002"
echo "   API calls will be proxied to: http://localhost:5000/api"
echo ""

# Start the development server
npm run dev