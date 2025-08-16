@echo off
title Frontend Startup - Port 3002

echo.
echo 🚀 Starting Frontend on Port 3002...
echo.

REM Check if backend is running on port 5000
echo 🔍 Checking if backend is running on port 5000...
netstat -an | find "5000" | find "LISTENING" >nul
if errorlevel 1 (
    echo.
    echo ⚠️  WARNING: Backend not detected on port 5000!
    echo.
    echo Please start the backend first:
    echo   1. Open another command prompt
    echo   2. Go to the main project directory ^(not frontend_new^)
    echo   3. Run: npm run dev
    echo.
    echo The backend must be running on port 5000 for the frontend to work properly.
    echo.
    pause
)

echo ✅ Backend detected on port 5000
echo.

REM Install dependencies if needed
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🌐 Starting Vite dev server on port 3002...
echo    Frontend will be available at: http://localhost:3002
echo    API calls will be proxied to: http://localhost:5000/api
echo.

REM Start the development server
npm run dev

pause