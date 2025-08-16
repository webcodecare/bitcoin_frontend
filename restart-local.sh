#!/bin/bash
echo "Restarting Proud Profits Frontend for Local Development..."
echo

echo "1. Killing any existing Vite processes..."
pkill -f vite 2>/dev/null || true
sleep 2

echo "2. Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist

echo "3. Installing dependencies..."
npm install

echo "4. Starting development server on port 3000..."
echo "Frontend will connect to backend on port 5000"
echo
echo "Open: http://localhost:3000"
echo
npm run dev