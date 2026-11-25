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
AUDIO_KEYS = ("a_best", "mp3_320", "mp3_192", "mp3_128", "audio")


def key_label(key):
    k = str(key)
    return {"best": "أعلى جودة", "a_best": "صوت أصلي", "audio": "MP3 192", "mp3_320": "MP3 320",
            "mp3_192": "MP3 192", "mp3_128": "MP3 128"}.get(k, f"{k}p")
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
            "qualities": [{"label": l, "key": k} for l, k in list_qualities(info) if k != AUDIO],
            "audio": audio_options(info)}


def list_qualities(info):
    """قائمة (النص، المفتاح): 'best' أو ارتفاع الفيديو، وفي آخرها 'audio'."""
    formats = info.get("formats") or []
    audio_sizes = [f.get("filesize") or f.get("filesize_approx") or 0
                   for f in formats if f.get("vcodec") == "none" and f.get("acodec") != "none"]
    best_audio = max(audio_sizes, default=0)
    by_height = {}  # h -> [أكبر حجم، أعلى fps]
    for f in formats:
        h = f.get("height")
        if f.get("vcodec") in (None, "none") or not h:
            continue
        size = f.get("filesize") or f.get("filesize_approx") or 0
        cur = by_height.setdefault(h, [0, 0])
        cur[0] = max(cur[0], size)
        cur[1] = max(cur[1], f.get("fps") or 0)
    heights = sorted(by_height, reverse=True)
    items = [(f"أعلى جودة متاحة ({heights[0]}p)" if heights else "أعلى جودة متاحة", BEST)]
    for h in heights:
        size, fps = by_height[h]
        has_audio = any(f.get("height") == h and f.get("acodec") not in (None, "none") for f in formats)
        total = size + (0 if has_audio else best_audio)
        label = f"{h}p" + (f"{int(fps)}" if fps and fps > 30 else "")
        items.append((label + (f"  ·  {_size_text(total)}" if total else ""), h))
    items.append(("صوت فقط (MP3)", AUDIO))
    return items


def audio_options(info):
    """خيارات جودة الصوت: الأصلي بدون تحويل، أو MP3 بعدة جودات."""
    abrs = [f.get("abr") or 0 for f in (info.get("formats") or [])
            if f.get("vcodec") == "none" and f.get("acodec") not in (None, "none")]
    top = max(abrs, default=0)
    orig = "أعلى جودة صوت أصلية" + (f"  ·  ~{int(top)} kbps" if top else "") + "  (بدون تحويل)"
    return [{"label": orig, "key": "a_best"},
            {"label": "MP3  ·  320 kbps", "key": "mp3_320"},
            {"label": "MP3  ·  192 kbps", "key": "mp3_192"},
            {"label": "MP3  ·  128 kbps", "key": "mp3_128"}]


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
    k = str(key)
    if k == "a_best":
        o["format"] = "bestaudio/best"
    elif k == AUDIO or k.startswith("mp3_"):
        q = k.split("_")[1] if "_" in k else "192"
        o["format"] = "bestaudio/best"
        o["postprocessors"].insert(0, {"key": "FFmpegExtractAudio", "preferredcodec": "mp3",
                                       "preferredquality": q})
    elif k == BEST:
        o["format"] = "bestvideo+bestaudio/best"
    else:
        h = int(k)
        o["format"] = f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
    return o


def download(url, key, folder, hook=None, opts=None):
    """ينزّل ويرجّع مسار الملف النهائي."""
    os.makedirs(folder, exist_ok=True)
    with yt_dlp.YoutubeDL(build_opts(key, folder, hook, opts)) as ydl:
        info = ydl.extract_info(url, download=True)
    reqs = info.get("requested_downloads") or []
    return (reqs[0].get("filepath") if reqs else None) or ""
