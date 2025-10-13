@echo off
echo ================================
echo Starting GitLife Backend Server
echo ================================
echo.
echo Checking MongoDB connection...
mongosh --eval "db.version()" --quiet >nul 2>&1
if errorlevel 1 (
    echo [ERROR] MongoDB is not running!
    echo Please start MongoDB first.
    echo.
    pause
    exit /b 1
)
echo [OK] MongoDB is running
echo.
echo Starting backend server...
echo.
npm start
