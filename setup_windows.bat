@echo off
echo Setting up Speech-to-Text AI Assistant for Windows...
echo.

echo Step 1: Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error installing Python dependencies!
    echo.
    echo Try installing them individually:
    echo pip install Flask==2.3.3
    echo pip install Flask-CORS==4.0.0
    echo pip install SpeechRecognition==3.10.0
    echo pip install gTTS==2.3.2
    echo pip install pydub==0.25.1
    echo pip install openai==1.3.5
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking for ffmpeg...
ffmpeg -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ffmpeg not found! Please install ffmpeg:
    echo.
    echo Option 1: Using Chocolatey (recommended)
    echo   choco install ffmpeg
    echo.
    echo Option 2: Using winget
    echo   winget install ffmpeg
    echo.
    echo Option 3: Manual installation
    echo   1. Download from https://www.gyan.dev/ffmpeg/builds/
    echo   2. Extract to C:\ffmpeg
    echo   3. Add C:\ffmpeg\bin to your PATH environment variable
    echo.
    echo After installing ffmpeg, run this script again.
    pause
    exit /b 1
) else (
    echo ffmpeg found!
)

echo.
echo Step 3: Installing Node.js dependencies...
cd frontend
npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing Node.js dependencies!
    echo Please make sure Node.js is installed: https://nodejs.org/
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
