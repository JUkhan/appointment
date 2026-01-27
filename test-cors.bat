@echo off
echo ========================================
echo Testing CORS Configuration
echo ========================================
echo.

echo Testing OPTIONS request to /register...
echo.

curl -X OPTIONS http://localhost:5000/register ^
  -H "Origin: http://localhost:5173" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -i

echo.
echo ========================================
echo.
echo If you see "Access-Control-Allow-Origin" in the response above,
echo CORS is configured correctly!
echo.
echo If you see "Connection refused" or similar, backend is not running.
echo.
pause
