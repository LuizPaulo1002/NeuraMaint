@echo off
REM NeuraMaint Backend Setup Script for Windows
REM Configures the development environment for the backend service

echo ========================================
echo    NeuraMaint Backend Setup
echo ========================================
echo.

echo [STEP] Starting backend setup process...
echo [INFO] Working directory: %CD%

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js ^>= 18.0.0
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% found

echo.
echo [STEP] Setting up environment variables...

if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] Created .env file from .env.example
        
        REM Generate JWT secret using Node.js
        for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
        
        REM Update .env file with JWT secret (simple replacement)
        powershell -Command "(Get-Content .env) -replace 'JWT_SECRET=.*', 'JWT_SECRET=%JWT_SECRET%' | Set-Content .env"
        
        echo [INFO] Generated new JWT secret
        echo [INFO] Please update DATABASE_URL and other environment variables in .env file
    ) else (
        echo [ERROR] .env.example file not found
        pause
        exit /b 1
    )
) else (
    echo [INFO] .env file already exists, skipping creation
)

echo.
echo [STEP] Installing dependencies...

if exist package-lock.json (
    npm ci
) else (
    npm install
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

echo.
echo [STEP] Creating necessary directories...

if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist scripts mkdir scripts

echo [SUCCESS] Directories created

echo.
echo [STEP] Setting up Prisma...

npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Prisma client generation failed
    pause
    exit /b 1
)
echo [SUCCESS] Prisma client generated

REM Check if DATABASE_URL is configured (basic check)
findstr /C:"postgresql://" .env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [STEP] Applying database migrations...
    npx prisma migrate dev --name init
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Database migrations applied
    ) else (
        echo [WARNING] Database migration failed - check DATABASE_URL configuration
    )
) else (
    echo [INFO] DATABASE_URL not configured. Skipping database migration.
    echo [INFO] Update DATABASE_URL in .env and run: npm run prisma:migrate
)

echo.
echo [STEP] Verifying setup...

npm run build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] TypeScript compilation successful
    if exist dist rmdir /s /q dist
) else (
    echo [ERROR] TypeScript compilation failed
    pause
    exit /b 1
)

if exist node_modules\.prisma\client (
    echo [SUCCESS] Prisma client is available
) else (
    echo [ERROR] Prisma client not found
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Backend setup completed successfully!
echo.
echo [INFO] Next steps:
echo [INFO] 1. Update DATABASE_URL in .env file
echo [INFO] 2. Run 'npm run prisma:migrate' to apply database schema
echo [INFO] 3. Run 'npm run seed' to populate with test data
echo [INFO] 4. Run 'npm run start:dev' to start development server
echo.
pause