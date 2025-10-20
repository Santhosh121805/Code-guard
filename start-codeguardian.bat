@echo off
REM CodeGuardian AI Startup Script
REM Based on the 5-Minute Diagnostic Prevention Approach

echo ========================================
echo   CodeGuardian AI Server Startup
echo ========================================

REM Kill any existing processes on our ports
echo 🛑 Cleaning up existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Navigate to project directory
cd /d "C:\Users\Santhosh S\Desktop\v0-code-guardian-ai-design"

echo 🚀 Starting Backend Server (Port 3001)...
start "CodeGuardian Backend" cmd /c "node backend\src\simple-test.js & pause"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo 🌐 Starting Frontend Server (Port 3002)...
start "CodeGuardian Frontend" cmd /c "npx next dev -p 3002 & pause"

echo ✅ Both servers are starting...
echo 🏠 Homepage: http://localhost:3002
echo 📊 Dashboard: http://localhost:3002/dashboard
echo 🔧 Backend API: http://localhost:3001/api
echo 💊 Health Check: http://localhost:3001/api/health

REM Wait and test connectivity
timeout /t 5 /nobreak >nul
echo 🧪 Testing connectivity...
curl.exe http://localhost:3001/api/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend connection failed
)

echo.
echo 📝 Tip: Keep both terminal windows open
echo 🔄 To restart, just run this script again
echo.
pause