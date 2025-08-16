@echo off
echo Restarting Proud Profits Frontend for Local Development...
echo.

echo 1. Killing any existing Vite processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo 2. Clearing Vite cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist

echo 3. Installing dependencies...
call npm install

echo 4. Starting development server on port 3000...
echo Frontend will connect to backend on port 5000
echo.
echo Open: http://localhost:3000
echo.
call npm run dev

pause