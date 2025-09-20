@echo off
REM NeuraMaint Frontend Setup Script for Windows
REM Configures the development environment for the frontend service

echo ========================================
echo    NeuraMaint Frontend Setup
echo ========================================
echo.

echo [STEP] Starting frontend setup process...
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

if not exist .env.local (
    if exist .env.example (
        copy .env.example .env.local >nul
        echo [SUCCESS] Created .env.local file from .env.example
    ) else (
        REM Create default .env.local for Next.js
        (
            echo # Frontend Environment Variables
            echo NEXT_PUBLIC_API_URL=http://localhost:3001
            echo NEXT_PUBLIC_APP_NAME=NeuraMaint
            echo NEXT_PUBLIC_APP_VERSION=1.0.0
            echo NEXT_PUBLIC_ENVIRONMENT=development
            echo.
            echo # Optional: Analytics, monitoring, etc.
            echo # NEXT_PUBLIC_GA_ID=
            echo # NEXT_PUBLIC_SENTRY_DSN=
        ) > .env.local
        echo [SUCCESS] Created default .env.local file
    )
    echo [INFO] Please update environment variables in .env.local file if needed
) else (
    echo [INFO] .env.local file already exists, skipping creation
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

if not exist src\components\ui mkdir src\components\ui
if not exist src\components\layout mkdir src\components\layout
if not exist src\components\forms mkdir src\components\forms
if not exist src\lib mkdir src\lib
if not exist src\hooks mkdir src\hooks
if not exist src\types mkdir src\types
if not exist src\utils mkdir src\utils
if not exist public\images mkdir public\images
if not exist public\icons mkdir public\icons

echo [SUCCESS] Directories created

echo.
echo [STEP] Setting up Next.js...

REM Check if Next.js is properly installed
npm list next >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Next.js is installed
) else (
    echo [ERROR] Next.js is not installed properly
    pause
    exit /b 1
)

REM Create public directory if it doesn't exist
if not exist public mkdir public

REM Create default favicon if it doesn't exist
if not exist public\favicon.ico (
    echo [INFO] Creating default favicon placeholder
    type nul > public\favicon.ico
)

echo.
echo [STEP] Setting up development tools...

if not exist .vscode mkdir .vscode

if not exist .vscode\settings.json (
    (
        echo {
        echo   "typescript.preferences.importModuleSpecifier": "relative",
        echo   "editor.formatOnSave": true,
        echo   "editor.codeActionsOnSave": {
        echo     "source.fixAll.eslint": "explicit"
        echo   },
        echo   "emmet.includeLanguages": {
        echo     "javascript": "javascriptreact",
        echo     "typescript": "typescriptreact"
        echo   },
        echo   "files.exclude": {
        echo     "**/node_modules": true,
        echo     "**/.next": true,
        echo     "**/.git": true
        echo   },
        echo   "typescript.validate.enable": true,
        echo   "javascript.validate.enable": false
        echo }
    ) > .vscode\settings.json
    echo [SUCCESS] VS Code settings created
)

echo.
echo [STEP] Verifying setup...

echo [INFO] Testing Next.js build process...
npm run build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Next.js build successful
    if exist .next rmdir /s /q .next
) else (
    echo [ERROR] Next.js build failed
    pause
    exit /b 1
)

if exist tsconfig.json (
    echo [SUCCESS] TypeScript configuration found
) else (
    echo [ERROR] TypeScript configuration not found
    pause
    exit /b 1
)

if exist tailwind.config.ts (
    echo [SUCCESS] Tailwind CSS configuration found
) else (
    if exist tailwind.config.js (
        echo [SUCCESS] Tailwind CSS configuration found
    ) else (
        echo [INFO] Tailwind CSS configuration not found ^(optional^)
    )
)

echo.
echo [SUCCESS] Frontend setup completed successfully!
echo.
echo [INFO] Next steps:
echo [INFO] 1. Update NEXT_PUBLIC_API_URL in .env.local if backend runs on different port
echo [INFO] 2. Run 'npm run dev' to start development server
echo [INFO] 3. Open http://localhost:3000 in your browser
echo.
pause