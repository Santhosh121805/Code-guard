# CodeGuardian AI Quick Diagnostic Script
# Based on the 5-Minute Diagnostic Approach

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CodeGuardian AI Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n🔍 STEP 1: Checking what should be running..." -ForegroundColor Yellow
Write-Host "Expected: Backend (3001) + Frontend (3002)" -ForegroundColor Gray

Write-Host "`n🔍 STEP 2: Verifying servers are listening..." -ForegroundColor Yellow
$backend = netstat -ano | findstr ":3001" | findstr "LISTENING"
$frontend = netstat -ano | findstr ":3002" | findstr "LISTENING"

if ($backend) {
    Write-Host "✅ Backend (Port 3001): LISTENING" -ForegroundColor Green
} else {
    Write-Host "❌ Backend (Port 3001): NOT LISTENING" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✅ Frontend (Port 3002): LISTENING" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend (Port 3002): NOT LISTENING" -ForegroundColor Red
}

Write-Host "`n🔍 STEP 3: Testing direct IP access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend API: Responding (localhost)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API: Not responding (localhost)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend API: Responding (127.0.0.1)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API: Not responding (127.0.0.1)" -ForegroundColor Red
}

Write-Host "`n🔍 STEP 4: Checking active Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Node processes found: $($nodeProcesses.Count)" -ForegroundColor Green
    $nodeProcesses | ForEach-Object { Write-Host "   PID: $($_.Id)" -ForegroundColor Gray }
} else {
    Write-Host "❌ No Node processes running" -ForegroundColor Red
}

Write-Host "`n📋 SUMMARY AND RECOMMENDATIONS:" -ForegroundColor Cyan
if (!$backend -and !$frontend) {
    Write-Host "🚀 Run: .\start-codeguardian.bat" -ForegroundColor Yellow
} elseif (!$backend) {
    Write-Host "🚀 Start Backend: node backend\src\simple-test.js" -ForegroundColor Yellow
} elseif (!$frontend) {
    Write-Host "🚀 Start Frontend: npx next dev -p 3002" -ForegroundColor Yellow
} else {
    Write-Host "🎉 All systems operational!" -ForegroundColor Green
    Write-Host "🏠 Homepage: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "📊 Dashboard: http://localhost:3002/dashboard" -ForegroundColor Cyan
}

Write-Host "`n🔧 Quick Fixes:" -ForegroundColor Yellow
Write-Host "• Restart all: taskkill /f /im node.exe; .\start-codeguardian.bat" -ForegroundColor Gray
Write-Host "• Check ports: netstat -ano | findstr :300" -ForegroundColor Gray
Write-Host "• Test API: curl.exe http://localhost:3001/api/health" -ForegroundColor Gray