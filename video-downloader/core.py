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


def _fsize(f, dur=0):
    """حجم الصيغة: الفعلي إن وُجد، وإلا تقدير من معدل البت × المدة."""
    n = f.get("filesize") or f.get("filesize_approx") or 0
    if not n and dur and f.get("tbr"):
        n = f["tbr"] * 125 * dur
    return int(n)


def fetch_info(url, browser=""):
    """يجلب معلومات الرابط بدون تحميل. يرجّع dict جاهز للواجهة."""
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True,
            "extract_flat": "in_playlist", "skip_download": True}
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if info.get("_type") == "playlist":
        items = []
        for i, e in enumerate(info.get("entries") or [], start=1):
            if not e:
                continue
            own = e.get("webpage_url") or e.get("url") or ""
            thumbs = e.get("thumbnails") or []
            items.append({
                # لو العنصر له رابط خاص نستخدمه، وإلا نحمّله بترتيبه داخل القائمة
                "url": own if own.startswith("http") and own != url else url,
                "index": None if own.startswith("http") and own != url else i,
                "title": e.get("title") or f"عنصر {i}",
                "duration": e.get("duration") or 0,
                "thumbnail": e.get("thumbnail") or (thumbs[-1].get("url") if thumbs else "") or "",
            })
        return {"type": "playlist", "title": info.get("title") or "قائمة تشغيل",
                "count": len(items), "items": items, "uploader": info.get("uploader") or "",
                "thumbnail": ""}
    dur = info.get("duration") or 0
    return {"type": "video", "title": info.get("title") or url,
            "thumbnail": info.get("thumbnail") or "", "duration": dur,
            "uploader": info.get("uploader") or info.get("channel") or "",
            "qualities": list_qualities(info), "audio": audio_options(info)}


def list_qualities(info):
    """جودات الفيديو المتاحة فعلاً: [{label, key, size}] وأولها 'أعلى جودة'."""
    formats = info.get("formats") or []
    dur = info.get("duration") or 0
    audio_only = [f for f in formats if f.get("vcodec") == "none" and f.get("acodec") != "none"]
    best_audio = max((_fsize(f, dur) for f in audio_only), default=0)
    by_height = {}  # h -> [أكبر حجم، أعلى fps، فيه صوت؟]
    for f in formats:
        h = f.get("height")
        if f.get("vcodec") in (None, "none") or not h:
            continue
        cur = by_height.setdefault(h, [0, 0, False])
        cur[0] = max(cur[0], _fsize(f, dur))
        cur[1] = max(cur[1], f.get("fps") or 0)
        cur[2] = cur[2] or f.get("acodec") not in (None, "none")
    heights = sorted(by_height, reverse=True)
    items = []
    for h in heights:
        size, fps, has_audio = by_height[h]
        total = size + (0 if has_audio or not size else best_audio)
        items.append({"label": f"{h}p" + (f"{int(fps)}" if fps and fps > 30 else ""),
                      "key": h, "size": total})
    top = items[0] if items else None
    items.insert(0, {"label": f"أعلى جودة متاحة ({heights[0]}p)" if heights else "أعلى جودة متاحة",
                     "key": BEST, "size": top["size"] if top else 0})
    return items


def audio_options(info):
    """خيارات جودة الصوت مع الحجم: الأصلي بدون تحويل، أو MP3 بعدة جودات."""
    dur = info.get("duration") or 0
    af = [f for f in (info.get("formats") or [])
          if f.get("vcodec") == "none" and f.get("acodec") not in (None, "none")]
    top = max((f.get("abr") or 0 for f in af), default=0)
    orig_size = max((_fsize(f, dur) for f in af), default=0) or int(top * 125 * dur)
    orig = "أعلى جودة صوت أصلية" + (f"  ·  ~{int(top)} kbps" if top else "") + "  (بدون تحويل)"
    mp3 = lambda k: int(dur * k * 125)  # noqa: E731  (kbps -> bytes)
    return [{"label": orig, "key": "a_best", "size": orig_size},
            {"label": "MP3  ·  320 kbps", "key": "mp3_320", "size": mp3(320)},
            {"label": "MP3  ·  192 kbps", "key": "mp3_192", "size": mp3(192)},
            {"label": "MP3  ·  128 kbps", "key": "mp3_128", "size": mp3(128)}]


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
    if opts.get("playlist_item"):  # عنصر واحد من قائمة/ألبوم حسب ترتيبه
        o["noplaylist"] = False
        o["playlist_items"] = str(int(opts["playlist_item"]))
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


def _final_path(info):
    reqs = info.get("requested_downloads") or []
    if reqs:
        return reqs[0].get("filepath") or ""
    for e in info.get("entries") or []:
        if e and _final_path(e):
            return _final_path(e)
    return ""


def download(url, key, folder, hook=None, opts=None):
    """ينزّل ويرجّع مسار الملف النهائي."""
    os.makedirs(folder, exist_ok=True)
    with yt_dlp.YoutubeDL(build_opts(key, folder, hook, opts)) as ydl:
        info = ydl.extract_info(url, download=True)
    return _final_path(info)
