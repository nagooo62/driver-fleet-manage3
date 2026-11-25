@echo off
cd /d "%~dp0"
set PY=python
python --version >nul 2>&1 || set PY=py
%PY% --version >nul 2>&1
if errorlevel 1 (
  echo Python is NOT installed or not in PATH.
  echo Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
  pause
  exit /b 1
)
%PY% -c "import yt_dlp, imageio_ffmpeg" >nul 2>&1
if not errorlevel 1 goto start
echo Installing required libraries (first run only, takes 1-2 minutes)...
%PY% -m pip install -r requirements.txt
if errorlevel 1 (
  echo Library install FAILED. Check your internet connection, then run again.
  pause
  exit /b 1
)
echo Installing optional browser-impersonation support (fine if it fails)...
%PY% -m pip install -q "yt-dlp[curl-cffi]"
:start
echo Starting... a window will open. Keep this black window open while using the app.
%PY% app.py
echo.
echo The app stopped. See the messages above.
pause
