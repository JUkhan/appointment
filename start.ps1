# Speech-to-Text AI Assistant Startup Script
Write-Host "Starting Speech-to-Text AI Assistant..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js/npm not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check if ffmpeg is available
if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "Warning: ffmpeg not found. Please install ffmpeg for audio processing." -ForegroundColor Yellow
    Write-Host "You can install it with: winget install 'FFmpeg (Essentials Build)'" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting Flask backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python app.py"

Start-Sleep 3

Write-Host "Starting React frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host ""
Write-Host "Services are starting..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few moments for both services to start, then open your browser to http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this script (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
