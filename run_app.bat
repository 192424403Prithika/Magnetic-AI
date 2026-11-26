@echo off
echo ========================================================
echo   MAGNETIC AI: Intelligent Material Analysis Platform
echo   Starting FastAPI Backend and Vite React Frontend
echo ========================================================

start "MAGNETIC AI Backend" cmd /k "python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload"
start "MAGNETIC AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are launching:
echo - FastAPI Backend: http://127.0.0.1:8000 (Docs: /docs)
echo - React Frontend:  http://localhost:5173
echo.
