@echo off
echo 🚀 Opening CodeGuardian AI in browser...
echo.
echo If the page doesn't load, try:
echo 1. Check Windows Firewall settings
echo 2. Try http://127.0.0.1:3002 instead
echo 3. Check if antivirus is blocking Node.js
echo.
start http://localhost:3002
timeout /t 3
start http://127.0.0.1:3002