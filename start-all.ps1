# Baat Cheet - Start All Services
# PowerShell script to run frontend, backend, and email worker

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting Baat Cheet Application..." -ForegroundColor Cyan
Write-Host ""

# Start Backend Server
Write-Host "[1/3] Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptPath\backend`" && npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Email Worker
Write-Host "[2/3] Starting Email Worker..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptPath\backend`" && npm run worker:email" -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend Dev Server
Write-Host "[3/3] Starting Frontend Dev Server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptPath\frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Server: http://localhost:9990" -ForegroundColor Cyan
Write-Host "Frontend Server: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
