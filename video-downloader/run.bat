@echo off
cd /d "%~dp0"
echo [1/3] Checking Python...
set PY=python
python --version >nul 2>&1 || set PY=py
%PY% --version
if errorlevel 1 (
  echo.
  echo Python is NOT installed or not in PATH.
  echo Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
  pause
  exit /b 1
)
echo [2/3] Installing libraries (first run takes 1-2 minutes)...
%PY% -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo Library install FAILED. Check your internet connection, then run again.
  pause
  exit /b 1
)
echo [3/3] Starting... a window will open. Keep this black window open while using the app.
%PY% app.py
echo.
echo The app stopped. See messages above.
pause
