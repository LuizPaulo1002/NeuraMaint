@echo off
REM NeuraMaint Master Setup Script for Windows
REM Initializes the entire development environment

echo ============================================
echo      NeuraMaint Development Setup
echo ============================================
echo.

echo [INFO] Initializing NeuraMaint development environment...
echo [INFO] Working directory: %CD%
echo.

echo --- Checking Requirements ---
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js ^>= 18.0.0
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% found

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm %NPM_VERSION% found

REM Check Git (optional)
git --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [SUCCESS] Git %GIT_VERSION% found
) else (
    echo [INFO] Git not found ^(optional but recommended for development^)
)

echo.
echo --- Setting up Backend ---
echo.

if exist backend (
    cd backend
    echo [STEP] Running backend setup...
    
    if exist setup.bat (
        call setup.bat
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Backend setup failed
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] Backend setup script not found
        pause
        exit /b 1
    )
    
    cd ..
    echo [SUCCESS] Backend setup completed
) else (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)

echo.
echo --- Setting up Frontend ---
echo.

if exist frontend (
    cd frontend
    echo [STEP] Running frontend setup...
    
    if exist setup.bat (
        call setup.bat
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Frontend setup failed
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] Frontend setup script not found
        pause
        exit /b 1
    )
    
    cd ..
    echo [SUCCESS] Frontend setup completed
) else (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)

echo.
echo --- Setting up ML Service ---
echo.

if exist ml-service (
    cd ml-service
    
    REM Check if Python is installed
    python --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_CMD=python
        for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
        echo [INFO] Found Python %PYTHON_VERSION%
    ) else (
        python3 --version >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            set PYTHON_CMD=python3
            for /f "tokens=2" %%i in ('python3 --version') do set PYTHON_VERSION=%%i
            echo [INFO] Found Python %PYTHON_VERSION%
        ) else (
            echo [ERROR] Python is not installed. ML Service setup skipped.
            cd ..
            goto :skip_ml
        )
    )
    
    REM Create virtual environment if it doesn't exist
    if not exist venv (
        echo [STEP] Creating Python virtual environment...
        %PYTHON_CMD% -m venv venv
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to create virtual environment
        ) else (
            echo [SUCCESS] Virtual environment created
        )
    )
    
    REM Install requirements if requirements.txt exists
    if exist requirements.txt (
        echo [STEP] Installing Python dependencies...
        call venv\Scripts\activate.bat
        pip install -r requirements.txt
        if %ERRORLEVEL% EQU 0 (
            echo [SUCCESS] Python dependencies installed
        ) else (
            echo [ERROR] Failed to install Python dependencies
        )
        call venv\Scripts\deactivate.bat
    ) else (
        echo [INFO] requirements.txt not found, skipping Python dependencies
    )
    
    cd ..
    echo [SUCCESS] ML Service setup completed
    
    :skip_ml
) else (
    echo [INFO] ML Service directory not found, skipping
)

echo.
echo --- Creating Development Configuration ---
echo.

REM Create .vscode workspace settings
if not exist .vscode mkdir .vscode

if not exist .vscode\settings.json (
    (
        echo {
        echo   "typescript.preferences.importModuleSpecifier": "relative",
        echo   "editor.formatOnSave": true,
        echo   "editor.codeActionsOnSave": {
        echo     "source.fixAll.eslint": "explicit"
        echo   },
        echo   "files.associations": {
        echo     "*.env*": "properties"
        echo   },
        echo   "files.exclude": {
        echo     "**/node_modules": true,
        echo     "**/dist": true,
        echo     "**/.next": true,
        echo     "**/.git": true,
        echo     "**/venv": true,
        echo     "**/__pycache__": true
        echo   },
        echo   "search.exclude": {
        echo     "**/node_modules": true,
        echo     "**/dist": true,
        echo     "**/.next": true,
        echo     "**/venv": true,
        echo     "**/__pycache__": true
        echo   }
        echo }
    ) > .vscode\settings.json
    echo [SUCCESS] VS Code workspace settings created
)

REM Create development guide
if not exist DEVELOPMENT.md (
    (
        echo # NeuraMaint - Development Guide
        echo.
        echo ## Quick Start
        echo.
        echo 1. **Setup All Services:**
        echo    ```batch
        echo    setup.bat
        echo    ```
        echo.
        echo 2. **Start Development Servers:**
        echo.
        echo    **Backend:**
        echo    ```batch
        echo    cd backend
        echo    npm run start:dev
        echo    ```
        echo.
        echo    **Frontend:**
        echo    ```batch
        echo    cd frontend
        echo    npm run dev
        echo    ```
        echo.
        echo    **ML Service:**
        echo    ```batch
        echo    cd ml-service
        echo    venv\Scripts\activate.bat
        echo    python app.py
        echo    ```
        echo.
        echo 3. **Access Services:**
        echo    - Frontend: http://localhost:3000
        echo    - Backend API: http://localhost:3001
        echo    - API Documentation: http://localhost:3001/api-docs
        echo    - ML Service: http://localhost:5000
        echo.
        echo ## Default Test Users
        echo.
        echo - **Admin:** admin@neuramaint.com / admin123
        echo - **Technician:** joao.silva@neuramaint.com / tech123
        echo - **Manager:** maria.santos@neuramaint.com / manager123
        echo.
        echo ## Database
        echo.
        echo Run seed script to populate with test data:
        echo ```batch
        echo cd backend
        echo npm run seed
        echo ```
    ) > DEVELOPMENT.md
    echo [SUCCESS] Development guide created
)

echo.
echo [SUCCESS] Development environment setup completed!
echo.
echo [INFO] Next steps:
echo [INFO] 1. Read DEVELOPMENT.md for detailed instructions
echo [INFO] 2. Configure database connection in backend\.env
echo [INFO] 3. Run database migrations and seed data
echo [INFO] 4. Start development servers
echo.
echo [INFO] Happy coding!
echo.
pause