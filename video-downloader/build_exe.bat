@echo off
REM يبني ملف exe واحد يشتغل بدون بايثون. شغّله مرة واحدة من هذا المجلد.
pip install -r requirements.txt pyinstaller
pyinstaller --noconfirm --onefile --windowed --name VideoDownloader --collect-all imageio_ffmpeg --collect-all yt_dlp app.py
echo.
echo تم! الملف في: dist\VideoDownloader.exe
pause
