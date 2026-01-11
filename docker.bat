@echo off
REM Docker management script for Appointment Booking System (Windows)

setlocal enabledelayedexpansion

if "%1"=="" goto usage

if "%1"=="start" goto start
if "%1"=="dev" goto dev
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="build" goto build
if "%1"=="clean" goto clean
if "%1"=="backup" goto backup
if "%1"=="restore" goto restore
if "%1"=="shell" goto shell
if "%1"=="status" goto status
goto usage

:start
echo [INFO] Starting application in production mode...
call :check_env
docker-compose up -d
echo [INFO] Application started!
echo [INFO] Frontend: http://localhost
echo [INFO] Backend: http://localhost:5000
goto end

:dev
echo [INFO] Starting application in development mode...
call :check_env
docker-compose -f docker-compose.dev.yml up
goto end

:stop
echo [INFO] Stopping application...
docker-compose down
echo [INFO] Application stopped!
goto end

:restart
echo [INFO] Restarting application...
docker-compose restart
echo [INFO] Application restarted!
goto end

:logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

:build
echo [INFO] Building Docker images...
call :check_env
docker-compose build --no-cache
echo [INFO] Build complete!
goto end

:clean
echo [WARNING] This will remove all containers, volumes, and images!
set /p CONFIRM="Are you sure? (y/N): "
if /i "%CONFIRM%"=="y" (
    echo [INFO] Cleaning up...
    docker-compose down -v --rmi all
    echo [INFO] Cleanup complete!
)
goto end

:backup
echo [INFO] Backing up database...
if not exist backups mkdir backups
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE=%%c%%a%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set TIME=%%a%%b)
set BACKUP_FILE=backups\appointment_backup_%DATE%_%TIME%.db
docker cp appointment-backend:/app/instance/appointment_system.db %BACKUP_FILE%
echo [INFO] Database backed up to %BACKUP_FILE%
goto end

:restore
if "%2"=="" (
    echo [ERROR] Please specify backup file: docker.bat restore ^<backup_file^>
    goto end
)
if not exist "%2" (
    echo [ERROR] Backup file not found: %2
    goto end
)
echo [WARNING] This will overwrite the current database!
set /p CONFIRM="Are you sure? (y/N): "
if /i "%CONFIRM%"=="y" (
    echo [INFO] Restoring database from %2...
    docker cp "%2" appointment-backend:/app/instance/appointment_system.db
    docker-compose restart backend
    echo [INFO] Database restored!
)
goto end

:shell
if "%2"=="" (
    set SERVICE=backend
) else (
    set SERVICE=%2
)
echo [INFO] Opening shell in %SERVICE% container...
docker-compose exec %SERVICE% /bin/sh
goto end

:status
docker-compose ps
goto end

:check_env
if not exist .env (
    echo [ERROR] .env file not found!
    echo [INFO] Creating .env from template...
    (
        echo GOOGLE_API_KEY=your_google_api_key_here
        echo JWT_SECRET_KEY=change-this-to-a-random-secret-key
        echo JWT_ACCESS_TOKEN_EXPIRES=15
        echo JWT_REFRESH_TOKEN_EXPIRES=7
    ) > .env
    echo [WARNING] Please update .env with your actual values
    exit /b 1
)
exit /b 0

:usage
echo Usage: docker.bat {start^|dev^|stop^|restart^|logs^|build^|clean^|backup^|restore^|shell^|status}
echo.
echo Commands:
echo   start          Start application in production mode
echo   dev            Start application in development mode with hot reloading
echo   stop           Stop all containers
echo   restart        Restart all containers
echo   logs [service] View logs (optional: specify backend or frontend)
echo   build          Rebuild Docker images
echo   clean          Remove all containers, volumes, and images
echo   backup         Backup database
echo   restore ^<file^> Restore database from backup
echo   shell [service] Open shell in container (default: backend)
echo   status         Show container status
goto end

:end
endlocal
