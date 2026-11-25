@echo off
chcp 65001 >nul
REM يبني ملف exe واحد بدون نافذة سوداء. شغّله مرة واحدة من هذا المجلد.
pip install -r requirements.txt pyinstaller
pyinstaller --noconfirm --onefile --windowed --name VideoDownloader --add-data "static;static" --collect-all imageio_ffmpeg --collect-all yt_dlp app.py
echo.
echo تم! الملف في: dist\VideoDownloader.exe
pause
