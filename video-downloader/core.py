"""منطق التحميل (بدون واجهة) - يعتمد على yt-dlp."""
import os
import re

import yt_dlp

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()  # ffmpeg جاهز مع المكتبة
except Exception:
    FFMPEG = None  # لو عندك ffmpeg في النظام يشتغل برضو

BEST, AUDIO = "best", "audio"
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def friendly_error(msg):
    msg = ANSI.sub("", str(msg)).replace("ERROR: ", "").strip()
    low = msg.lower()
    tip = ""
    if any(s in low for s in ("sign in", "log in", "login", "private", "cookies", "age")):
        tip = " ← جرّب خيار «كوكيز من المتصفح» في الإعدادات (وكن مسجّل دخول في ذلك المتصفح)."
    elif "unsupported url" in low:
        tip = " ← هذا الرابط غير مدعوم أو ليس رابط فيديو مباشر."
    elif "ffmpeg" in low:
        tip = " ← مشكلة في ffmpeg، أعد تشغيل البرنامج."
    elif any(s in low for s in ("urlopen", "getaddrinfo", "timed out", "network")):
        tip = " ← تأكد من اتصال الإنترنت."
    elif "http error 403" in low or "http error 429" in low:
        tip = " ← الموقع يحظر الطلبات حالياً. حدّث yt-dlp من الإعدادات أو جرّب لاحقاً."
    return msg[-500:] + tip


def _size_text(n):
    if not n:
        return ""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def fetch_info(url, browser=""):
    """يجلب معلومات الرابط بدون تحميل. يرجّع dict جاهز للواجهة."""
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True,
            "extract_flat": "in_playlist", "skip_download": True}
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if info.get("_type") == "playlist":
        urls = []
        for e in info.get("entries") or []:
            if not e:
                continue
            u = e.get("webpage_url") or e.get("url")
            if u and u.startswith("http"):
                urls.append(u)
        return {"type": "playlist", "title": info.get("title") or "قائمة تشغيل",
                "count": len(urls), "urls": urls, "uploader": info.get("uploader") or "",
                "thumbnail": ""}
    return {"type": "video", "title": info.get("title") or url,
            "thumbnail": info.get("thumbnail") or "", "duration": info.get("duration") or 0,
            "uploader": info.get("uploader") or info.get("channel") or "",
            "qualities": [{"label": l, "key": k} for l, k in list_qualities(info)]}


def list_qualities(info):
    """قائمة (النص، المفتاح): 'best' أو 'audio' أو ارتفاع الفيديو."""
    formats = info.get("formats") or []
    audio_sizes = [f.get("filesize") or f.get("filesize_approx") or 0
                   for f in formats if f.get("vcodec") == "none" and f.get("acodec") != "none"]
    best_audio = max(audio_sizes, default=0)
    by_height = {}
    for f in formats:
        h = f.get("height")
        if f.get("vcodec") in (None, "none") or not h:
            continue
        size = f.get("filesize") or f.get("filesize_approx") or 0
        by_height[h] = max(by_height.get(h, 0), size)
    items = [("أعلى جودة متاحة", BEST)]
    for h in sorted(by_height, reverse=True):
        has_audio = any(f.get("height") == h and f.get("acodec") not in (None, "none") for f in formats)
        total = by_height[h] + (0 if has_audio else best_audio)
        items.append((f"{h}p" + (f"  ·  {_size_text(total)}" if total else ""), h))
    items.append(("صوت فقط (MP3)", AUDIO))
    return items


def build_opts(key, folder, hook=None, opts=None):
    opts = opts or {}
    o = {
        "outtmpl": os.path.join(folder, "%(title).150B [%(id)s].%(ext)s"),
        "noplaylist": True,
        "progress_hooks": [hook] if hook else [],
        "quiet": True, "no_warnings": True, "noprogress": True,
        "merge_output_format": "mp4",
        "format_sort": ["res", "ext:mp4:m4a"],  # يفضّل mp4 عشان يشتغل على أي مشغّل
        "retries": 10, "fragment_retries": 10,
        "concurrent_fragment_downloads": 4,
        "postprocessors": [{"key": "FFmpegMetadata"}],
    }
    if FFMPEG:
        o["ffmpeg_location"] = FFMPEG
    if opts.get("browser"):
        o["cookiesfrombrowser"] = (opts["browser"],)
    if int(opts.get("rate_kb") or 0) > 0:
        o["ratelimit"] = int(opts["rate_kb"]) * 1024
    if opts.get("subs"):
        o.update({"writesubtitles": True, "writeautomaticsub": True,
                  "subtitleslangs": ["ar", "en"], "subtitlesformat": "srt/best"})
        o["postprocessors"].append({"key": "FFmpegSubtitlesConvertor", "format": "srt"})
    if key == AUDIO:
        o["format"] = "bestaudio/best"
        o["postprocessors"].insert(0, {"key": "FFmpegExtractAudio",
                                       "preferredcodec": "mp3", "preferredquality": "192"})
    elif key == BEST:
        o["format"] = "bestvideo+bestaudio/best"
    else:
        h = int(key)
        o["format"] = f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
    return o


def download(url, key, folder, hook=None, opts=None):
    """ينزّل ويرجّع مسار الملف النهائي."""
    os.makedirs(folder, exist_ok=True)
    with yt_dlp.YoutubeDL(build_opts(key, folder, hook, opts)) as ydl:
        info = ydl.extract_info(url, download=True)
    reqs = info.get("requested_downloads") or []
    return (reqs[0].get("filepath") if reqs else None) or ""
