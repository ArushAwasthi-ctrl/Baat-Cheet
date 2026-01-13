@echo off
echo Starting Baat Cheet Application...
echo.

:: Start Backend Server
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Email Worker
echo [2/3] Starting Email Worker...
start "Email Worker" cmd /k "cd /d %~dp0backend && npm run worker:email"

:: Wait a moment
timeout /t 2 /nobreak > nul

:: Start Frontend Dev Server
echo [3/3] Starting Frontend Dev Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services started!
echo.
echo Backend Server: http://localhost:9990
echo Frontend Server: http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul
