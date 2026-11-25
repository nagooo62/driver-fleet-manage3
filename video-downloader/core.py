"""منطق التحميل (بدون واجهة) - يعتمد على yt-dlp."""
import ipaddress
import os
import re
import socket
import urllib.request
from urllib.parse import urlsplit

import yt_dlp

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()  # ffmpeg جاهز مع المكتبة
except Exception:
    FFMPEG = None  # لو عندك ffmpeg في النظام يشتغل برضو

BEST, AUDIO = "best", "audio"


def system_proxy(url):
    """بروكسي النظام (ويندوز/متغيرات البيئة) لهذا الرابط. مهم: curl_cffi لا يقرأه تلقائياً بعكس urllib،
    فنمرّره صراحة كي يمر البرنامج من نفس الـ VPN/البروكسي الذي يستخدمه المتصفح."""
    try:
        if urllib.request.proxy_bypass(urlsplit(url).hostname or ""):
            return ""
        px = urllib.request.getproxies()
        val = px.get("https") or px.get("http") or ""
        return val if val.startswith(("http://", "https://")) else ""
    except Exception:
        return ""


def _find_impersonate():
    """يختار هوية متصفح Chrome لو مكتبة curl_cffi متوفرة (تحلّ كثيراً من أخطاء 403/410 مع المواقع المحمية)."""
    try:
        with yt_dlp.YoutubeDL({"quiet": True}) as y:
            targets = [t for t, _ in y._get_available_impersonate_targets()]
        chrome = [t for t in targets if getattr(t, "client", None) == "chrome"]
        return (chrome or targets or [None])[0]
    except Exception:
        return None


IMPERSONATE = _find_impersonate()
AUDIO_KEYS = ("a_best", "mp3_320", "mp3_192", "mp3_128", "m4a", "flac", "wav", "audio")


def key_label(key):
    k = str(key)
    return {"best": "أعلى جودة", "a_best": "صوت أصلي", "audio": "MP3 192", "m4a": "M4A", "flac": "FLAC", "wav": "WAV", "mp3_320": "MP3 320",
            "mp3_192": "MP3 192", "mp3_128": "MP3 128"}.get(k, f"{k}p")
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def friendly_error(msg):
    msg = ANSI.sub("", str(msg)).replace("ERROR: ", "").strip()
    low = msg.lower()
    tip = ""
    if "phantomjs" in low:
        tip = (" ← الموقع يعرض فحص حماية يحتاج أداة PhantomJS: افتح الإعدادات واضغط «تثبيت PhantomJS» (مرة واحدة)،"
               " أو ضع ملف كوكيز (cookies.txt) من متصفحك في الإعدادات.")
    elif "http error 410" in low or "http error 404" in low or "video unavailable" in low or "has been removed" in low:
        tip = (" ← الفيديو محذوف، أو الموقع يرفض الطلبات (حظر دولة/شبكة). افتح الرابط في المتصفح: لو لا يفتح فجرّب VPN أو بروكسي من الإعدادات،"
               " ولو يفتح فجرّب «كوكيز من المتصفح» ثم «تحديث yt-dlp». وتأكد في الإعدادات أن «انتحال المتصفح» ✔.")
    elif any(s in low for s in ("sign in", "log in", "login required", "private", "cookies", "age-restricted",
                                "confirm your age", "age verification")):
        tip = " ← جرّب خيار «كوكيز من المتصفح» في الإعدادات (وكن مسجّل دخول في ذلك المتصفح)."
    elif "winerror 32" in low or "being used by another process" in low or "permission denied" in low:
        tip = " ← الملف مفتوح في برنامج آخر (مشغّل أو مضاد فيروسات). أغلقه ثم اضغط «استئناف»."
    elif "no space left" in low or "winerror 112" in low:
        tip = " ← لا توجد مساحة كافية على القرص."
    elif "unsupported url" in low:
        tip = " ← هذا الرابط غير مدعوم أو ليس رابط فيديو مباشر."
    elif "ffmpeg" in low:
        tip = " ← مشكلة في ffmpeg، أعد تشغيل البرنامج."
    elif any(s in low for s in ("connection was reset", "recv failure", "curl: (56)", "curl: (35)", "curl: (28)",
                                 "curl: (7)", "connection refused", "connection aborted")):
        tip = (" ← الاتصال بالموقع يُقطع من الشبكة (غالباً حجب من مزوّد الإنترنت، أو الـ VPN لا يشمل البرنامج)."
               " شغّل VPN على كامل الجهاز، أو ضع بروكسي الـ VPN في الإعدادات، ثم اضغط «فحص الاتصال».")
    elif "http error 403" in low or "http error 429" in low:
        tip = " ← الموقع يحظر الطلبات حالياً. حدّث yt-dlp من الإعدادات أو جرّب لاحقاً."
    elif any(s in low for s in ("urlopen", "getaddrinfo", "timed out", "network", "connection")):
        tip = " ← تأكد من اتصال الإنترنت."
    return msg[-500:] + tip


_RETRY = ("timed out", "timeout", "connection", "incomplete", "reset", "broken pipe", "remote end closed",
          "unexpected eof", "read error", "did not get any data", "ssl", "http error 5", "http error 429",
          "http error 403", "temporarily", "unreachable", "getaddrinfo", "urlopen error", "transporterror")
_NO_RETRY = ("unsupported url", "private video", "sign in", "log in", "http error 404", "http error 410", "drm",
             "video unavailable", "has been removed", "ffmpeg exited", "no space left", "permission denied", "winerror")


def is_retryable(msg, started=False):
    """هل الخطأ مؤقت (شبكة/انتهاء رابط) فيستحق إعادة المحاولة تلقائياً مع الاستكمال؟"""
    low = str(msg).lower()
    if any(s in low for s in _NO_RETRY):
        return False
    if ("http error 403" in low or "http error 429" in low) and not started:
        return False  # حظر من البداية: لن تفيد الإعادة
    return any(s in low for s in _RETRY)


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


def fetch_info(url, browser="", proxy="", cookiefile=""):
    """يجلب معلومات الرابط بدون تحميل. يرجّع dict جاهز للواجهة."""
    proxy = proxy or system_proxy(url)
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True,
            "extract_flat": "in_playlist", "skip_download": True}
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    if proxy:
        opts["proxy"] = proxy
    if cookiefile and os.path.isfile(cookiefile):
        opts["cookiefile"] = cookiefile
    if IMPERSONATE:
        opts["impersonate"] = IMPERSONATE
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
            {"label": "MP3  ·  128 kbps", "key": "mp3_128", "size": mp3(128)},
            {"label": "M4A (AAC)  ·  256 kbps", "key": "m4a", "size": mp3(256)},
            {"label": "FLAC  ·  بدون فقد", "key": "flac", "size": mp3(900)},
            {"label": "WAV  ·  غير مضغوط", "key": "wav", "size": mp3(1411)}]


def build_opts(key, folder, hook=None, opts=None):
    opts = opts or {}
    o = {
        "outtmpl": os.path.join(folder, "%(title).150B [%(id)s].%(ext)s"),
        "noplaylist": True,
        "progress_hooks": [hook] if hook else [],
        "quiet": True, "no_warnings": True, "noprogress": True,
        "merge_output_format": "mp4",
        "format_sort": ["res", "ext:mp4:m4a"],  # يفضّل mp4 عشان يشتغل على أي مشغّل
        "retries": 15, "fragment_retries": 25, "extractor_retries": 5, "file_access_retries": 10,
        "socket_timeout": 30, "continuedl": True,
        "concurrent_fragment_downloads": max(1, min(16, int(opts.get("connections") or 8))),
        "postprocessors": [],
    }
    if FFMPEG:
        o["ffmpeg_location"] = FFMPEG
    if opts.get("browser"):
        o["cookiesfrombrowser"] = (opts["browser"],)
    if opts.get("proxy"):
        o["proxy"] = opts["proxy"]
    if opts.get("cookiefile") and os.path.isfile(opts["cookiefile"]):
        o["cookiefile"] = opts["cookiefile"]
    if IMPERSONATE:
        o["impersonate"] = IMPERSONATE
    if opts.get("container") in ("mp4", "mkv", "webm"):
        o["merge_output_format"] = opts["container"]
    st, en = float(opts.get("start") or 0), float(opts.get("end") or 0)
    if st or en:  # قص جزء من الفيديو (اسم الملف يحمل مدة القص كي لا يُتخطّى لو الفيديو كامل موجود)
        o["outtmpl"] = o["outtmpl"].replace(".%(ext)s", f" [cut {int(st)}s-{(str(int(en)) + 's') if en else 'end'}].%(ext)s")
        o["download_ranges"] = yt_dlp.utils.download_range_func(None, [(st, en if en else float("inf"))])
        o["force_keyframes_at_cuts"] = True
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
    elif k in ("m4a", "flac", "wav"):
        o["format"] = "bestaudio/best"
        pp = {"key": "FFmpegExtractAudio", "preferredcodec": k}
        if k == "m4a":
            pp["preferredquality"] = "256"
        o["postprocessors"].insert(0, pp)
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


def search(query, source="youtube", n=12, browser="", proxy="", cookiefile=""):
    """بحث داخل المواقع (يوتيوب / ساوند كلاود) بدون فتح المتصفح."""
    prefix = {"youtube": "ytsearch", "soundcloud": "scsearch"}.get(source, "ytsearch")
    proxy = proxy or system_proxy("https://www.youtube.com")
    opts = {"quiet": True, "no_warnings": True, "extract_flat": True, "skip_download": True}
    if browser:
        opts["cookiesfrombrowser"] = (browser,)
    if proxy:
        opts["proxy"] = proxy
    if cookiefile and os.path.isfile(cookiefile):
        opts["cookiefile"] = cookiefile
    if IMPERSONATE:
        opts["impersonate"] = IMPERSONATE
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"{prefix}{int(n)}:{query}", download=False)
    out = []
    for e in info.get("entries") or []:
        if not e:
            continue
        url = e.get("webpage_url") or e.get("url") or ""
        if not url.startswith("http"):
            continue
        thumbs = e.get("thumbnails") or []
        out.append({"url": url, "title": e.get("title") or url,
                    "channel": e.get("channel") or e.get("uploader") or "",
                    "duration": e.get("duration") or 0,
                    "thumbnail": e.get("thumbnail") or (thumbs[-1].get("url") if thumbs else "") or ""})
    return out


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
    opts = dict(opts or {})
    if not opts.get("proxy"):
        opts["proxy"] = system_proxy(url)
    with yt_dlp.YoutubeDL(build_opts(key, folder, hook, opts)) as ydl:
        info = ydl.extract_info(url, download=True)
    return _final_path(info)


def diagnose(url, proxy=""):
    """يفحص لماذا لا يتصل البرنامج بالموقع: DNS، ثم اتصال HTTPS بالموقع، ثم موقع محايد للمقارنة."""
    from yt_dlp.networking.exceptions import HTTPError, TransportError
    host = urlsplit(url).hostname or ""
    px = proxy or system_proxy(url)
    base = os.environ.get("VD_DIAG_BASELINE") or "https://www.cloudflare.com/cdn-cgi/trace"
    res = {"proxy": px, "host": host, "checks": [], "summary": ""}

    def add(name, state, detail):  # state: ok | warn | fail
        res["checks"].append({"name": name, "state": state, "detail": detail})

    def fetch(u):
        o = {"quiet": True, "no_warnings": True, "socket_timeout": 15}
        if px:
            o["proxy"] = px
        if IMPERSONATE:
            o["impersonate"] = IMPERSONATE
        with yt_dlp.YoutubeDL(o) as y:
            r = y.urlopen(u)
            return r.status, r.read(2000).decode("utf-8", "ignore")

    dns_bad = False
    try:
        ipaddress.ip_address(host)
        add("DNS", "ok", "الرابط عنوان IP مباشر (بدون DNS)")
    except ValueError:
        try:
            ips = sorted({r[4][0] for r in socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)})
            dns_bad = any(i.startswith(("0.", "127.", "10.", "192.168.", "169.254.")) or i == "::1" for i in ips)
            add("DNS", "fail" if dns_bad else "ok",
                ", ".join(ips[:3]) + ("  ← عنوان مشبوه (حجب عبر DNS)" if dns_bad else ""))
        except OSError as err:
            add("DNS", "fail", f"تعذّر تحويل اسم الموقع: {str(err)[:60]}")
            dns_bad = True

    def probe(name, u):
        try:
            code, body = fetch(u)
            add(name, "ok", f"HTTP {code}")
            return "ok", body
        except HTTPError as e:
            add(name, "warn", f"الموقع ردّ HTTP {e.status} (وصلنا للخادم، لكنه رفض أو عرض صفحة حجب)")
            return "http", ""
        except TransportError as e:
            add(name, "fail", f"انقطع الاتصال: {str(e)[:110]}")
            return "net", ""
        except Exception as e:  # noqa: BLE001
            add(name, "fail", str(e)[:110])
            return "net", ""

    t_state, _ = probe("الاتصال بالموقع", url if url.startswith("http") else f"https://{host}/")
    b_state, body = probe("اتصال محايد للمقارنة", base)
    m = dict(re.findall(r"^(ip|loc)=(.+)$", body, re.M))
    if m:
        add("عنوانك العام", "ok", f"{m.get('ip', '?')}  (الدولة: {m.get('loc', '?')})")

    if b_state == "net":
        res["summary"] = "لا يوجد اتصال بالإنترنت عبر البرنامج، أو البروكسي المضبوط لا يعمل. تأكد من الشبكة/الـ VPN."
    elif t_state == "net" or dns_bad:
        res["summary"] = ("الإنترنت يعمل لكن **الموقع محجوب أو مقطوع من شبكتك** (غالباً من مزوّد الإنترنت). "
                          "شغّل VPN يغطي كامل الجهاز (وليس إضافة متصفح فقط)، أو ضع بروكسي الـ VPN في الإعدادات، ثم أعد الفحص.")
    elif t_state == "http":
        res["summary"] = "وصلنا للموقع لكنه رفض الطلب (حظر دولة أو فحص حماية). جرّب ملف كوكيز أو تثبيت PhantomJS من الإعدادات."
    else:
        res["summary"] = "الاتصال بالموقع سليم من ناحية الشبكة. لو لا يزال التحميل يفشل فالمشكلة في الموقع نفسه، أرسل لي الخطأ."
    return res
