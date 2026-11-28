@echo off
REM يبني التطبيق على جهازك (بديل عن بناء GitHub). يحتاج Python و(اختيارياً) Inno Setup لإنشاء Setup.exe
cd /d "%~dp0"
python -m pip install -r requirements-build.txt || goto :err
pyinstaller --noconfirm --clean --windowed --python-option "X utf8" --name VideoDownloader --icon assets\app.ico ^
  --add-data "static;static" --add-data "extension;extension" ^
  --collect-all yt_dlp --collect-all yt_dlp_ejs --collect-all imageio_ffmpeg --collect-all curl_cffi ^
  --collect-data certifi --collect-submodules pystray --exclude-module tkinter app.py || goto :err
echo.
echo Built: dist\VideoDownloader\VideoDownloader.exe
where iscc >nul 2>&1 && (iscc installer\VideoDownloader.iss && echo Installer: dist-installer\VideoDownloader-Setup.exe) || echo (Inno Setup not found - skipping Setup.exe)
pause
exit /b 0
:err
echo BUILD FAILED
pause
exit /b 1
