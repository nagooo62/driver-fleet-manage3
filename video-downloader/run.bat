@echo off
cd /d "%~dp0"
echo [1/4] Checking Python...
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
echo [2/4] Installing required libraries (first run takes 1-2 minutes)...
%PY% -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo Library install FAILED. Check your internet connection, then run again.
  pause
  exit /b 1
)
echo [3/4] Installing optional browser-impersonation support (fine if it fails)...
%PY% -m pip install -q "yt-dlp[curl-cffi]"
if errorlevel 1 echo Optional component not installed. The app still works without it.
echo [4/4] Starting... a window will open. Keep this black window open while using the app.
%PY% app.py
echo.
echo The app stopped. See the messages above.
pause
