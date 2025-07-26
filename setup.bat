@echo off
echo Setting up Speech-to-Text AI Assistant...
echo.

echo Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error installing Python dependencies!
    pause
    exit /b 1
)

echo.
echo Installing Node.js dependencies...
cd frontend
npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing Node.js dependencies!
    pause
    exit /b 1
)

cd ..
echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Open two command prompts
echo 2. In the first one, run: python app.py
echo 3. In the second one, run: cd frontend && npm start
echo 4. Open http://localhost:3000 in your browser
echo.
pause
