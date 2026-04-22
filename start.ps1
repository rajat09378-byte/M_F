# Mind Forge Startup Script
Write-Host "Starting Mind Forge AI Learning Engine..." -ForegroundColor Cyan

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; cd '$PSScriptRoot\server'; npm run dev" -WindowStyle Normal

Start-Sleep 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; cd '$PSScriptRoot\client'; npm run dev" -WindowStyle Normal

Start-Sleep 3

Write-Host "Mind Forge is starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow

# Open browser
Start-Process "http://localhost:5173"
