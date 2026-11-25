"""منطق التحميل (بدون واجهة) - يعتمد على yt-dlp."""
import os
import yt_dlp

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()  # ffmpeg جاهز مع المكتبة
except Exception:
    FFMPEG = None  # لو مثبّت عندك ffmpeg في النظام يشتغل برضو

BEST = "best"
AUDIO = "audio"


def fetch_info(url, browser=None):
    """يجيب معلومات الفيديو والجودات المتاحة بدون ما ينزّل حاجة."""
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True, "skip_download": True}
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def _size_text(n):
    if not n:
        return ""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def list_qualities(info):
    """يرجّع قائمة (النص المعروض، المفتاح). المفتاح: 'best' أو 'audio' أو ارتفاع الفيديو."""
    formats = info.get("formats") or []
    best_audio = max(
        (f.get("filesize") or f.get("filesize_approx") or 0
         for f in formats if f.get("vcodec") == "none" and f.get("acodec") != "none"),
        default=0,
    )
    by_height = {}
    for f in formats:
        h = f.get("height")
        if f.get("vcodec") in (None, "none") or not h:
            continue
        size = f.get("filesize") or f.get("filesize_approx") or 0
        by_height[h] = max(by_height.get(h, 0), size)

    items = [("أعلى جودة متاحة", BEST)]
    for h in sorted(by_height, reverse=True):
        size = by_height[h]
        has_audio_in_video = any(
            f.get("height") == h and f.get("acodec") not in (None, "none") for f in formats
        )
        total = size + (0 if has_audio_in_video else best_audio)
        label = f"{h}p" + (f"  (~{_size_text(total)})" if total else "")
        items.append((label, h))
    items.append(("صوت فقط (MP3)", AUDIO))
    return items


def build_opts(key, out_dir, hooks, browser=None, playlist=False):
    opts = {
        "outtmpl": os.path.join(out_dir, "%(title).150B [%(id)s].%(ext)s"),
        "noplaylist": not playlist,
        "progress_hooks": [hooks] if hooks else [],
        "quiet": True,
        "no_warnings": True,
        "merge_output_format": "mp4",
        "format_sort": ["res", "ext:mp4:m4a"],  # يفضّل mp4 عشان يشتغل على أي مشغّل
        "retries": 10,
        "fragment_retries": 10,
        "concurrent_fragment_downloads": 4,
    }
    if FFMPEG:
        opts["ffmpeg_location"] = FFMPEG
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    if key == AUDIO:
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [
            {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}
        ]
    elif key == BEST:
        opts["format"] = "bestvideo+bestaudio/best"
    else:
        opts["format"] = f"bestvideo[height<={key}]+bestaudio/best[height<={key}]/best"
    return opts


def download(url, key, out_dir, hooks=None, browser=None, playlist=False):
    with yt_dlp.YoutubeDL(build_opts(key, out_dir, hooks, browser, playlist)) as ydl:
        ydl.download([url])
