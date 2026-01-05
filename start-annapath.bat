@echo off
echo [1/3] Starting Mock AI Service (Port 3001)...
start "Mock-AI" cmd /c "set PORT=3001 && set DISABLE_REDIS=1 && node n8n-mvp\mock_services\server.js"

echo [2/3] Starting n8n Brain (Port 5678)...
start "n8n-Brain" pm2 start n8n-brain

echo [3/3] Starting Frontend Server (Port 8000)...
start "Frontend" python -m http.server 8000

echo.
echo ==========================================
echo AnnaPath is booting up!
echo Frontend: http://localhost:8000
echo n8n Editor: http://localhost:5678
echo Mock API: http://localhost:3001
echo ==========================================
pause
