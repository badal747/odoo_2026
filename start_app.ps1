# PeoplePay360 - One-click Start Script for Windows
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting PeoplePay360: HR & Payroll Operations Platform" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Start FastAPI Backend in a new window
Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\activate; python main.py"

# Start Next.js Frontend in a new window
Write-Host "Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Both servers launched!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
