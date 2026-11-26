# MAGNETIC AI - Unified Startup Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  MAGNETIC AI: Intelligent Material Analysis Platform   " -ForegroundColor Cyan
Write-Host "  Engineering Physics + Machine Learning Capstone       " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background job or window
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload" -PassThru
Write-Host "[Backend] Started on http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)" -ForegroundColor Green

# 2. Start Vite Frontend in background window
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru
Write-Host "[Frontend] Started on http://localhost:5173" -ForegroundColor Green

Write-Host "`nBoth services are running! Open http://localhost:5173 in your browser." -ForegroundColor Yellow
