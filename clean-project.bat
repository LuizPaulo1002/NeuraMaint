@echo off
cls
echo ======================================================
echo        SISTEMA DE LIMPEZA AUTOMATIZADA - NEURAMAINT
echo ======================================================
echo.
echo Este script ira remover arquivos e diretorios temporarios
echo para liberar espaco e melhorar a organizacao do projeto.
echo.
echo Itens que serao removidos:
echo  - node_modules (dependencias)
echo  - .next (cache do Next.js)
echo  - dist (arquivos compilados)
echo  - logs (arquivos de log)
echo  - __pycache__ (cache do Python)
echo.
echo ======================================================
echo.

REM Confirmacao do usuario
set /p CONFIRM=Tem certeza que deseja continuar? (S/N): 
if /i "%CONFIRM%" neq "S" (
    echo Operacao cancelada.
    echo.
    pause
    exit /b
)

echo.
echo Iniciando processo de limpeza...
echo.

REM Registrar inicio no log
echo Limpeza iniciada em %date% as %time% > cleanup_log.txt

REM Limpar diretórios node_modules
echo Removendo node_modules...
for /d /r . %%d in (node_modules) do @if exist "%%d" (
    echo   - Removendo %%d
    rd /s /q "%%d"
    echo Removido: %%d >> cleanup_log.txt
)

REM Limpar diretórios .next
echo Removendo .next...
for /d /r . %%d in (.next) do @if exist "%%d" (
    echo   - Removendo %%d
    rd /s /q "%%d"
    echo Removido: %%d >> cleanup_log.txt
)

REM Limpar diretórios dist
echo Removendo dist...
for /d /r . %%d in (dist) do @if exist "%%d" (
    echo   - Removendo %%d
    rd /s /q "%%d"
    echo Removido: %%d >> cleanup_log.txt
)

REM Limpar diretórios __pycache__
echo Removendo __pycache__...
for /d /r . %%d in (__pycache__) do @if exist "%%d" (
    echo   - Removendo %%d
    rd /s /q "%%d"
    echo Removido: %%d >> cleanup_log.txt
)

REM Limpar diretórios logs
echo Removendo logs...
for /d /r . %%d in (logs) do @if exist "%%d" (
    echo   - Removendo %%d
    rd /s /q "%%d"
    echo Removido: %%d >> cleanup_log.txt
)

REM Registrar fim no log
echo Limpeza concluida em %date% as %time% >> cleanup_log.txt
echo. >> cleanup_log.txt

echo.
echo ======================================================
echo LIMPEZA CONCLUIDA COM SUCESSO!
echo ======================================================
echo.
echo Um arquivo de log foi gerado: cleanup_log.txt
echo.
echo Para recuperar dependencias removidas, execute:
echo   - cd backend ^&^& npm install
echo   - cd frontend ^&^& npm install
echo   - cd ml-service ^&^& pip install -r requirements.txt
echo.
pause