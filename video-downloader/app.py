"""محمّل الفيديوهات - يشتغل محلياً على جهازك: خادم صغير + واجهة تفتح كنافذة تطبيق."""
import sys

# وضع UTF-8: كي لا يؤثر ترميز ويندوز الافتراضي (cp1252) على الملفات والأنابيب، فيعمل البرنامج مع أسماء مستخدمين عربية
if not sys.flags.utf8_mode and not getattr(sys, "frozen", False) and not __import__("os").environ.get("VD_NO_REEXEC"):
    import os as _os
    import subprocess as _sp
    _env = dict(_os.environ, PYTHONUTF8="1", VD_NO_REEXEC="1")
    sys.exit(_sp.call([sys.executable, "-X", "utf8", _os.path.abspath(__file__), *sys.argv[1:]], env=_env))
import hashlib
import io
import json
import mimetypes
import os
import re
import secrets
import shutil
import socket
import subprocess
import threading
import time
import traceback
import urllib.request
import uuid
import webbrowser
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

os.environ.setdefault("PYTHONUTF8", "1")  # للعمليات الفرعية (ffmpeg وغيرها)
APP_DIR = os.environ.get("VD_HOME") or os.path.join(os.path.expanduser("~"), ".video-downloader")
os.makedirs(APP_DIR, exist_ok=True)
if sys.stdout is None or sys.stderr is None:  # نسخة exe بدون نافذة سوداء
    sys.stdout = sys.stderr = open(os.path.join(APP_DIR, "log.txt"), "a", encoding="utf-8")

def _ensure_ascii_cacert():
    """libcurl/OpenSSL على ويندوز لا يفتحان ملف الشهادات لو كان مساره فيه حروف غير إنجليزية (اسم مستخدم عربي مثلاً)،
    فنستخدم نسخة منه في مسار ASCII ونوجّه إليها curl_cffi وyt-dlp."""
    try:
        import certifi
        src = certifi.where()
        if src.isascii() or not os.path.isfile(src):
            return
        import filecmp
        for base in (os.environ.get("PROGRAMDATA"), os.environ.get("PUBLIC"), os.environ.get("VD_CA_DIR")):
            if not base or not base.isascii():
                continue
            d = os.path.join(base, "VideoDownloader")
            dst = os.path.join(d, "cacert.pem")
            try:
                os.makedirs(d, exist_ok=True)
                if not os.path.isfile(dst) or not filecmp.cmp(src, dst, shallow=False):
                    shutil.copyfile(src, dst)
            except OSError:
                continue
            for var in ("SSL_CERT_FILE", "CURL_CA_BUNDLE", "REQUESTS_CA_BUNDLE"):
                os.environ[var] = dst
            certifi.where = lambda: dst
            try:
                import certifi.core as _cc
                _cc.where = certifi.where
            except Exception:  # noqa: BLE001
                pass
            return
    except Exception:  # noqa: BLE001
        pass


_ensure_ascii_cacert()
UPDATE_ROOT = os.path.join(APP_DIR, "ytdlp_update")


def _apply_ytdlp_update():
    """لو نزّل المستخدم نسخة أحدث من yt-dlp من داخل البرنامج نستخدمها بدل المدمجة."""
    try:
        with open(os.path.join(UPDATE_ROOT, "current.txt"), encoding="utf-8") as f:
            ver = f.read().strip()
        p = os.path.join(UPDATE_ROOT, ver)
        if ver and os.path.isfile(os.path.join(p, "yt_dlp", "__init__.py")):
            sys.path.insert(0, p)
    except OSError:
        pass


_apply_ytdlp_update()
try:
    import yt_dlp  # noqa: E402
except Exception:  # تحديث تالف -> ارجع للنسخة المدمجة
    sys.path[:] = [p for p in sys.path if not p.startswith(UPDATE_ROOT)]
    for _m in [m for m in sys.modules if m == "yt_dlp" or m.startswith("yt_dlp.")]:
        del sys.modules[_m]
    try:
        os.remove(os.path.join(UPDATE_ROOT, "current.txt"))
    except OSError:
        pass
    import yt_dlp  # noqa: E402
import core  # noqa: E402

STATE_FILE = os.path.join(APP_DIR, "state.json")
APP_HOME = os.path.dirname(os.path.abspath(__file__))
TOOLS_DIR = os.path.join(APP_DIR, "tools")  # أدوات مساعدة (مثل phantomjs) تُضاف تلقائياً إلى PATH
os.makedirs(TOOLS_DIR, exist_ok=True)
TOOLS_DIRS = [TOOLS_DIR, os.path.join(APP_HOME, "tools")]  # الثاني: مجلد tools بجانب البرنامج
if getattr(sys, "frozen", False):  # النسخة المثبّتة: ويقبل أيضاً مجلد tools بجوار exe
    TOOLS_DIRS.append(os.path.join(os.path.dirname(sys.executable), "tools"))
os.environ["PATH"] = os.pathsep.join(TOOLS_DIRS) + os.pathsep + os.environ.get("PATH", "")
PH_PROGRESS = {"state": "idle", "done": 0, "total": 18193653, "msg": ""}
PHANTOM_URLS = ["https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-windows.zip",
                "https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-windows.zip"]
IS_WIN = sys.platform.startswith("win")
NO_WINDOW = 0x08000000 if IS_WIN else 0  # CREATE_NO_WINDOW: لا تُظهر نافذة سوداء لحظية
PHANTOM_SHA256 = "d9fb05623d6b26d3654d008eab3adafd1f6350433dfd16138c46161f42c7dcc8"  # نفس البصمة من مصدرين مستقلين
TOKEN = secrets.token_urlsafe(24)
IDLE_EXIT_SECONDS = 150
RETRY_MAX = 4  # عدد محاولات التحميل التلقائية عند انقطاع مؤقت
DEFAULTS = {"folder": os.path.join(os.path.expanduser("~"), "Downloads", "VideoDownloader"),
            "concurrent": 2, "rate_kb": 0, "browser": "", "subs": False,
            "proxy": "", "sort_folders": True, "container": "mp4", "connections": 8,
            "cookiefile": ""}


UI_VERSION = 11
APP_VERSION = "2026.11.26"  # رقم إصدار الواجهة المطلوب (index.html يحمل meta ui-version)


def _ui_candidates():
    here = os.path.dirname(os.path.abspath(__file__))
    out = []
    for p in (resource("static/index.html"), os.path.join(here, "static", "index.html"), os.path.join(here, "index.html")):
        if p not in out and os.path.isfile(p):
            out.append(p)
    return out


def load_ui():
    """يختار أحدث واجهة موجودة (حتى لو وُضع index.html في المجلد الخطأ)، وينبّه لو كانت قديمة."""
    best = None
    for p in _ui_candidates():
        try:
            with open(p, encoding="utf-8") as f:
                txt = f.read()
        except OSError:
            continue
        m = re.search(r'name="ui-version"\s+content="(\d+)"', txt)
        ver = int(m.group(1)) if m else 0
        key = (ver, os.path.getmtime(p))
        if best is None or key > best[0]:
            best = (key, p, txt, ver)
    if best is None:
        return "<h1>index.html not found — ضعه داخل مجلد static</h1><p>__TOKEN__</p>"
    _, path, txt, ver = best
    load_ui.last = (path, ver)
    if ver < UI_VERSION:
        banner = ('<div style="background:#d92d20;color:#fff;padding:10px 16px;text-align:center;font:600 14px Tahoma,sans-serif">'
                  '⚠ ملف الواجهة index.html قديم (إصدار %d، المطلوب %d). استخرج الملفات الجديدة بالكامل فوق مجلد البرنامج، '
                  'وتأكد أن index.html داخل مجلد static.</div>' % (ver, UI_VERSION))
        txt = txt.replace("<body>", "<body>" + banner, 1) if "<body>" in txt else banner + txt
    return txt


load_ui.last = ("", 0)


def resource(rel):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def log_error(jid, url, err):
    try:
        with open(os.path.join(APP_DIR, "errors.log"), "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {jid} {url}\n{err}\n\n")
    except OSError:
        pass


class Manager:
    ACTIVE = ("queued", "downloading", "processing")

    def __init__(self):
        self.lock = threading.RLock()
        self.jobs, self.cancel, self.parts = {}, {}, {}
        self.settings = dict(DEFAULTS)
        self.sem = threading.Semaphore(2)
        self.last_ping = time.time()
        self.ext_token = ""
        self._load()

    # ---- حفظ/تحميل ----
    def _load(self):
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                data = json.load(f)
            self.settings.update(data.get("settings", {}))
            self.ext_token = data.get("ext_token", "")
            for j in data.get("jobs", []):
                if j.get("status") in self.ACTIVE:  # كان شغّالاً عند الإغلاق -> يصير متوقفاً ويمكن استئنافه
                    j.update(status="paused", speed=0, eta=0, note="أُوقف عند إغلاق البرنامج — اضغط «استئناف» ليكمل")
                if j.get("status") in ("done", "error", "canceled", "paused") and j.get("_s") is not None:
                    self.jobs[j["id"]] = j
        except Exception:
            pass
        self.sem = threading.Semaphore(max(1, int(self.settings["concurrent"])))
        if not self.ext_token:
            self.ext_token = secrets.token_hex(8)  # رمز ربط إضافة المتصفح (يبقى ثابتاً بين التشغيلات)

    def save(self):
        with self.lock:
            data = {"settings": self.settings, "ext_token": self.ext_token, "jobs": list(self.jobs.values())[-200:]}
            blob = json.dumps(data, ensure_ascii=False, default=list)
        tmp = STATE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(blob)
        os.replace(tmp, STATE_FILE)

    # ---- الإعدادات ----
    def set_settings(self, new):
        with self.lock:
            for k, default in DEFAULTS.items():
                if k in new:
                    v = new[k]
                    if isinstance(default, bool):
                        v = bool(v)
                    elif isinstance(default, int):
                        v = max(0, int(v or 0))
                    else:
                        v = str(v).strip()
                    self.settings[k] = v
            self.settings["concurrent"] = min(6, max(1, self.settings["concurrent"]))
            self.settings["connections"] = min(16, max(1, self.settings["connections"] or 8))
            if self.settings["container"] not in ("mp4", "mkv", "webm"):
                self.settings["container"] = "mp4"
            if self.settings["browser"] not in ("", "chrome", "edge", "firefox", "brave", "opera"):
                self.settings["browser"] = ""
            if not self.settings["folder"]:
                self.settings["folder"] = DEFAULTS["folder"]
            self.sem = threading.Semaphore(self.settings["concurrent"])
        self.save()

    # ---- المهام ----
    def add(self, items, key, subs=None, extra=None):
        ids = []
        with self.lock:
            s = dict(self.settings)
            if subs is not None:
                s["subs"] = bool(subs)
            if extra:
                s.update(extra)
            sub = ("Audio" if str(key) in core.AUDIO_KEYS else "Video") if s.get("sort_folders") else ""
            folder = os.path.join(s["folder"], sub) if sub else s["folder"]
            for it in items:
                jid = uuid.uuid4().hex[:10]
                self.jobs[jid] = {"id": jid, "url": it["url"], "index": it.get("index"),
                                  "title": it.get("title") or it["url"], "thumb": it.get("thumb") or "",
                                  "key": key, "label": core.key_label(key), "status": "queued", "pct": 0,
                                  "speed": 0, "eta": 0, "file": "", "size": 0, "error": "", "note": "",
                                  "created": time.time(), "folder": folder,
                                  "_s": dict(s, playlist_item=it.get("index")), "_parts": [], "_mode": ""}
                ids.append(jid)
        for jid in ids:
            self._start(jid)
        return ids

    def _set(self, jid, **kw):
        with self.lock:
            if jid in self.jobs:
                self.jobs[jid].update(kw)

    def _start(self, jid):
        self.cancel[jid] = threading.Event()
        threading.Thread(target=self._run, args=(jid,), daemon=True).start()

    # إيقاف مؤقت (يحتفظ بالجزء المحمّل) أو إلغاء (يحذف الجزء المحمّل)
    def stop(self, jid, mode):
        with self.lock:
            j = self.jobs.get(jid)
            if not j:
                return
            st = j["status"]
            if st in ("queued", "downloading"):
                j["_mode"] = mode
                self.cancel[jid].set()
                return
            idle_cancel = mode == "cancel" and st in ("paused", "error")
        if idle_cancel:
            self._cleanup(jid)
            self._set(jid, status="canceled", pct=0, speed=0, eta=0, note="", error="")
            self.save()

    def resume(self, jid):
        with self.lock:
            j = self.jobs.get(jid)
            if not j or j["status"] not in ("paused", "error", "canceled"):
                return False
            if j["status"] == "canceled":
                j["pct"] = 0
            j.update(status="queued", error="", note="", speed=0, eta=0, _mode="")
        self._start(jid)
        return True

    def _cleanup(self, jid):
        """يحذف الملفات الجزئية (.part/.ytdl) لهذه المهمة فقط وداخل مجلدها."""
        with self.lock:
            j = self.jobs.get(jid)
            if not j:
                return
            files = set(j.get("_parts") or []) | self.parts.get(jid, set())
            root = os.path.abspath(j["folder"])
        for p in files:
            for cand in (p, p + ".part", p + ".ytdl"):
                try:
                    if os.path.abspath(cand).startswith(root) and os.path.isfile(cand):
                        os.remove(cand)
                except OSError:
                    pass
        self._set(jid, _parts=[])
        self.parts.pop(jid, None)

    def _finish_stop(self, jid):
        mode = self.jobs[jid].get("_mode") or "cancel"
        if mode == "pause":
            self._set(jid, status="paused", speed=0, eta=0, note="متوقف مؤقتاً — الجزء المحمّل محفوظ، اضغط «استئناف»")
        else:
            self._cleanup(jid)
            self._set(jid, status="canceled", pct=0, speed=0, eta=0, note="")

    def _run(self, jid):
        ev = self.cancel[jid]
        with self.lock:
            j = self.jobs[jid]
            s, url, key, folder = dict(j["_s"]), j["url"], j["key"], j["folder"]
            parts = self.parts.setdefault(jid, set(j.get("_parts") or []))
        with self.sem:
            if ev.is_set():
                self._finish_stop(jid)
                self.save()
                return
            self._set(jid, status="downloading", error="", note="")
            state = {"done": 0}

            def hook(d):
                if ev.is_set():
                    raise yt_dlp.utils.DownloadCancelled()
                fn = d.get("tmpfilename") or d.get("filename")
                if fn:
                    parts.add(fn)
                info = d.get("info_dict") or {}
                if info.get("title") and self.jobs[jid]["title"] == self.jobs[jid]["url"]:
                    self._set(jid, title=info["title"], thumb=self.jobs[jid]["thumb"] or info.get("thumbnail") or "")
                n = max(1, len(info.get("requested_formats") or [1]))
                if d["status"] == "downloading":
                    total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    frac = (d.get("downloaded_bytes") or 0) / total if total else 0
                    self._set(jid, status="downloading", note="", pct=min(99.0, (state["done"] + frac) / n * 100),
                              speed=d.get("speed") or 0, eta=d.get("eta") or 0)
                elif d["status"] == "finished":
                    state["done"] += 1
                    if state["done"] >= n:
                        self._set(jid, status="processing", pct=100, speed=0, eta=0)

            attempt = 0
            while True:
                attempt += 1
                state["done"] = 0
                try:
                    path = with_phantom(lambda: core.download(url, key, folder, hook, s))
                    size = os.path.getsize(path) if path and os.path.exists(path) else 0
                    self._set(jid, status="done", pct=100, speed=0, eta=0, file=path, size=size, note="")
                    parts.clear()
                    notify_done(self.jobs[jid]["title"])
                    break
                except yt_dlp.utils.DownloadCancelled:
                    self._finish_stop(jid)
                    break
                except Exception as e:  # noqa: BLE001
                    if ev.is_set():
                        self._finish_stop(jid)
                        break
                    log_error(jid, url, traceback.format_exc())
                    started = self.jobs[jid]["pct"] > 0
                    if attempt < RETRY_MAX and core.is_retryable(e, started):
                        self._set(jid, status="downloading", speed=0, eta=0,
                                  note=f"انقطع الاتصال — إعادة المحاولة {attempt}/{RETRY_MAX - 1} (يكمل من نفس النقطة)...")
                        if ev.wait(min(5 * attempt, 20)):
                            self._finish_stop(jid)
                            break
                        continue
                    msg = core.friendly_error(e) + (" — الجزء المحمّل محفوظ، اضغط «استئناف» ليكمل من نفس النقطة." if started else "")
                    self._set(jid, status="error", error=msg, speed=0, eta=0, note="")
                    break
            self._set(jid, _parts=sorted(parts))
        self.save()

    def active(self):
        with self.lock:
            return any(j["status"] in self.ACTIVE for j in self.jobs.values())

    def snapshot(self):
        with self.lock:
            return sorted(({k: v for k, v in j.items() if not k.startswith("_")} for j in self.jobs.values()),
                          key=lambda j: -j["created"])


M = Manager()


def open_path(jid=None, mode="folder"):
    """يفتح الملف أو مجلده. يقبل فقط معرّف مهمة معروف أو مجلد الإعدادات."""
    with M.lock:
        job = M.jobs.get(jid) if jid else None
        folder = job["folder"] if job else M.settings["folder"]
        path = job["file"] if job and job["file"] and os.path.exists(job["file"]) else ""
    win, mac = sys.platform.startswith("win"), sys.platform == "darwin"
    if mode == "file":
        if not path:
            raise RuntimeError("الملف غير موجود (ربما نُقل أو حُذف).")
        if win:
            os.startfile(path)  # noqa: S606
        else:
            subprocess.Popen(["open" if mac else "xdg-open", path])
        return
    os.makedirs(folder, exist_ok=True)
    if win:
        subprocess.Popen(["explorer", f"/select,{os.path.normpath(path)}"] if path else ["explorer", os.path.normpath(folder)])
    elif mac:
        subprocess.Popen(["open", "-R", path] if path else ["open", folder])
    else:
        subprocess.Popen(["xdg-open", folder])


def phantom_status():
    """يفحص PhantomJS فعلياً: هل هو موجود في PATH، وهل يشتغل (phantomjs -v)؟"""
    exe = shutil.which("phantomjs")
    if not exe:
        here = [n for d in TOOLS_DIRS for n in ("phantomjs.exe", "phantomjs") if os.path.isfile(os.path.join(d, n))]
        return {"found": False, "detail": "الملف موجود في مجلد الأدوات لكن النظام لا يراه، أعد تشغيل البرنامج" if here else "غير مثبّت"}
    try:
        r = subprocess.run([exe, "-v"], capture_output=True, text=True, timeout=15, creationflags=NO_WINDOW)
    except Exception as e:  # noqa: BLE001
        return {"found": False, "detail": f"موجود لكن لا يعمل: {str(e)[:80]}"}
    if r.returncode == 0:
        return {"found": True, "detail": (r.stdout or "").strip()[:20] or "يعمل"}
    code = r.returncode & 0xFFFFFFFF
    hint = (" — غالباً ينقصه Microsoft Visual C++ 2013 (x86): نزّله من https://aka.ms/highdpimfc2013x86enu وثبّته"
            if code in (0xC0000135, 0xC000007B) else "")
    return {"found": False, "detail": f"موجود لكنه لا يعمل (رمز الخروج {code:#x}){hint}"}


def _phantom_extract(data):
    tmp = os.path.join(TOOLS_DIR, "phantomjs.exe.tmp")
    with zipfile.ZipFile(io.BytesIO(data)) as z, z.open("phantomjs-2.1.1-windows/bin/phantomjs.exe") as src, \
            open(tmp, "wb") as dst:
        shutil.copyfileobj(src, dst)
    os.replace(tmp, os.path.join(TOOLS_DIR, "phantomjs.exe"))


def install_phantomjs(progress=None):
    """يثبّت PhantomJS (ويندوز): أولاً من ملف zip محلي إن وُجد (Downloads/مجلد البرنامج)، وإلا ينزّله مع عرض التقدم.
    كل ملف يُقبل فقط إن طابقت بصمته SHA-256 المعروفة."""
    if not IS_WIN:
        raise RuntimeError("التثبيت التلقائي لويندوز فقط. على لينكس/ماك ثبّت phantomjs من مدير الحزم.")
    want = os.environ.get("VD_PHANTOM_SHA256") or PHANTOM_SHA256
    upd = (lambda **kw: progress.update(kw)) if progress is not None else (lambda **kw: None)
    upd(msg="يبحث عن ملف PhantomJS محلي...", done=0)
    for d in (os.path.join(os.path.expanduser("~"), "Downloads"), APP_HOME, TOOLS_DIR):
        try:
            names = [f for f in os.listdir(d) if f.lower().startswith("phantomjs") and f.lower().endswith(".zip")]
        except OSError:
            continue
        for f in names:
            p = os.path.join(d, f)
            try:
                if os.path.getsize(p) > 60_000_000:
                    continue
                with open(p, "rb") as fh:
                    data = fh.read()
                if hashlib.sha256(data).hexdigest() == want:
                    _phantom_extract(data)
                    return f"تم تثبيت PhantomJS من الملف المحلي {f} ✔"
            except Exception:  # noqa: BLE001
                continue
    urls = os.environ.get("VD_PHANTOM_URLS", "").split() or PHANTOM_URLS
    px = M.settings.get("proxy") or core.system_proxy(urls[0]) or ""
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({"http": px, "https": px}) if px.startswith("http") else urllib.request.ProxyHandler())
    last = "unknown"
    for u in urls:
        try:
            upd(msg="جاري التنزيل من " + (urlsplit(u).hostname or u), done=0)
            deadline = time.monotonic() + 240
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            chunks, got = [], 0
            with opener.open(req, timeout=30) as r:
                upd(total=int(r.headers.get("Content-Length") or PH_PROGRESS["total"]))
                while True:
                    if time.monotonic() > deadline:
                        raise TimeoutError("استغرق التنزيل أكثر من 4 دقائق")
                    b = r.read(262144)
                    if not b:
                        break
                    chunks.append(b)
                    got += len(b)
                    upd(done=got)
                    if got > 60_000_000:
                        raise ValueError("الملف أكبر من المتوقع")
            data = b"".join(chunks)
            if hashlib.sha256(data).hexdigest() != want:
                last = "البصمة لا تطابق (تم رفض الملف)"
                continue
            _phantom_extract(data)
            return "تم تثبيت PhantomJS ✔ — أعد المحاولة مع الرابط."
        except Exception as e:  # noqa: BLE001
            last = str(e)[:100]
    raise RuntimeError(
        f"تعذّر تنزيل PhantomJS ({last}).\nالحل: نزّل هذا الملف من متصفحك (الذي يعمل عبر الـ VPN): {PHANTOM_URLS[0]}\n"
        "ثم اتركه في مجلد Downloads بدون تغيير اسمه، واضغط «تثبيت PhantomJS» من جديد، وسيثبّته البرنامج تلقائياً من الملف.")


def _phantom_worker():
    PH_PROGRESS.update(state="running", done=0, msg="")
    try:
        PH_PROGRESS.update(state="done", msg=install_phantomjs(PH_PROGRESS))
    except Exception as e:  # noqa: BLE001
        PH_PROGRESS.update(state="error", msg=str(e))


DENO_URL = "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip"
DN_PROGRESS = {"state": "idle", "done": 0, "total": 0, "msg": ""}


def deno_status():
    """Deno = محرك JavaScript يحتاجه yt-dlp لاستخراج جودات يوتيوب كاملة."""
    exe = shutil.which("deno")
    if not exe:
        return {"found": False, "detail": "غير مثبّت"}
    try:
        r = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=15, creationflags=NO_WINDOW)
    except Exception as e:  # noqa: BLE001
        return {"found": False, "detail": f"موجود لكن لا يعمل: {str(e)[:60]}"}
    if r.returncode != 0:
        return {"found": False, "detail": f"موجود لكنه لا يعمل (رمز {r.returncode & 0xFFFFFFFF:#x})"}
    parts = (r.stdout or "").split()
    return {"found": True, "detail": parts[1] if len(parts) > 1 else "يعمل"}


def install_deno(progress=None):
    """ينزّل Deno الرسمي (ويندوز) ويتحقق من البصمة المنشورة معه، ثم يضعه في مجلد الأدوات."""
    if not IS_WIN:
        raise RuntimeError("التثبيت التلقائي لويندوز فقط. على لينكس/ماك ثبّت deno من deno.com.")
    url = os.environ.get("VD_DENO_URL") or DENO_URL
    upd = (lambda **kw: progress.update(kw)) if progress is not None else (lambda **kw: None)
    op = _net_opener()
    try:
        upd(msg="جاري تنزيل Deno...", done=0)
        deadline, chunks, got = time.monotonic() + 300, [], 0
        with op.open(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
            upd(total=int(r.headers.get("Content-Length") or 43_000_000))
            while True:
                if time.monotonic() > deadline:
                    raise TimeoutError("استغرق التنزيل أكثر من 5 دقائق")
                b = r.read(262144)
                if not b:
                    break
                chunks.append(b)
                got += len(b)
                upd(done=got)
                if got > 150_000_000:
                    raise ValueError("الملف أكبر من المتوقع")
        data = b"".join(chunks)
        with op.open(urllib.request.Request(url + ".sha256sum", headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
            m = re.search(r"\b([0-9a-fA-F]{64})\b", r.read(4096).decode("utf-8", "ignore"))
        if not m:
            raise RuntimeError("تعذّر قراءة بصمة التحقق المنشورة")
        if hashlib.sha256(data).hexdigest() != m.group(1).lower():
            raise RuntimeError("بصمة الملف لا تطابق المنشورة، تم رفضه")
        tmp = os.path.join(TOOLS_DIR, "deno.exe.tmp")
        with zipfile.ZipFile(io.BytesIO(data)) as z, z.open("deno.exe") as src, open(tmp, "wb") as dst:
            shutil.copyfileobj(src, dst)
        os.replace(tmp, os.path.join(TOOLS_DIR, "deno.exe"))
        return "تم تثبيت Deno ✔ — أعد تشغيل البرنامج ليستفيد يوتيوب منه."
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"تعذّر تثبيت Deno ({str(e)[:120]}). جرّب VPN أو بروكسي في الإعدادات ثم أعد الضغط.") from None


def _deno_worker():
    DN_PROGRESS.update(state="running", done=0, msg="")
    try:
        DN_PROGRESS.update(state="done", msg=install_deno(DN_PROGRESS))
    except Exception as e:  # noqa: BLE001
        DN_PROGRESS.update(state="error", msg=str(e))


def with_phantom(fn):
    """ينفّذ fn؛ وإن فشل لأن PhantomJS غير موجود، يثبّته تلقائياً (ويندوز) ويعيد المحاولة مرة واحدة،
    ولو بقي الخطأ يضيف سبب عدم اشتغال الأداة بدل ترك المستخدم يخمّن."""
    try:
        return fn()
    except Exception as e:  # noqa: BLE001
        if "phantomjs" not in str(e).lower():
            raise
        first = core.friendly_error(e)
        have_file = any(os.path.isfile(os.path.join(d, n)) for d in TOOLS_DIRS for n in ("phantomjs.exe", "phantomjs"))
        if IS_WIN and not have_file:
            try:
                install_phantomjs()
            except Exception as ie:  # noqa: BLE001
                raise RuntimeError(f"{first}\n⛔ التثبيت التلقائي لـ PhantomJS فشل: {ie}") from None
            try:
                return fn()
            except Exception as e2:  # noqa: BLE001
                st = phantom_status()
                extra = "" if st["found"] else f"\n🔧 حالة PhantomJS: {st['detail']}"
                raise RuntimeError(core.friendly_error(e2) + extra) from None
        st = phantom_status()
        raise RuntimeError(first + ("" if st["found"] else f"\n🔧 حالة PhantomJS: {st['detail']}")) from None


def _net_opener():
    px = M.settings.get("proxy") or core.system_proxy("https://pypi.org") or ""
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({"http": px, "https": px}) if px.startswith("http") else urllib.request.ProxyHandler())


def update_ytdlp():
    """يحدّث yt-dlp بتنزيل أحدث wheel من PyPI والتحقق من بصمته. يعمل في النسخة المثبّتة بدون pip."""
    op = _net_opener()
    with op.open("https://pypi.org/pypi/yt-dlp/json", timeout=30) as r:
        meta = json.load(r)
    latest, cur = meta["info"]["version"], yt_dlp.version.__version__
    if latest == cur and not os.environ.get("VD_FORCE_YTDLP_UPDATE"):
        return {"message": f"أنت على أحدث نسخة ({cur}) ✔", "restart": False}
    wheel = next((u for u in meta["urls"] if u["filename"].endswith("-py3-none-any.whl")), None)
    if not wheel:
        raise RuntimeError("لم أجد ملف التحديث على PyPI")
    with op.open(wheel["url"], timeout=90) as r:
        data = r.read(30_000_000)
    if hashlib.sha256(data).hexdigest() != wheel["digests"]["sha256"]:
        raise RuntimeError("بصمة ملف التحديث لا تطابق، تم رفضه")
    os.makedirs(UPDATE_ROOT, exist_ok=True)
    dest, tmp = os.path.join(UPDATE_ROOT, latest), os.path.join(UPDATE_ROOT, latest + ".tmp")
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    root = os.path.abspath(tmp) + os.sep
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for n in z.namelist():
            if not n.startswith("yt_dlp/") or n.endswith("/"):
                continue
            target = os.path.abspath(os.path.join(tmp, n))
            if not target.startswith(root):
                raise RuntimeError("ملف تحديث غير آمن")
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(z.read(n))
    if not os.path.isfile(os.path.join(tmp, "yt_dlp", "__init__.py")):
        raise RuntimeError("ملف التحديث غير سليم")
    shutil.rmtree(dest, ignore_errors=True)
    os.replace(tmp, dest)
    with open(os.path.join(UPDATE_ROOT, "current.txt"), "w", encoding="utf-8") as f:
        f.write(latest)
    for d in os.listdir(UPDATE_ROOT):  # نظّف النسخ القديمة
        p = os.path.join(UPDATE_ROOT, d)
        if d not in (latest, "current.txt") and os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
    return {"message": f"تم تنزيل yt-dlp {latest} (كانت {cur}).", "restart": True}


def restart_app():
    """يعيد تشغيل البرنامج بنفس الوسائط (بعد تحديث yt-dlp مثلاً)."""
    args = [x for x in sys.argv[1:] if x != "--restarted"] + ["--restarted"]
    cmd = [sys.executable, *args] if getattr(sys, "frozen", False) else [sys.executable, os.path.abspath(__file__), *args]
    M.save()
    subprocess.Popen(cmd, close_fds=True)
    os._exit(0)


RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"


def _autostart_cmd():
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}" --background'
    exe = sys.executable
    pw = os.path.join(os.path.dirname(exe), "pythonw.exe")
    return f'"{pw if os.path.isfile(pw) else exe}" -X utf8 "{os.path.abspath(__file__)}" --tray --background'


def autostart_get():
    """هل البرنامج يعمل مع ويندوز؟ (None لو النظام ليس ويندوز)."""
    if not IS_WIN:
        return None
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
            winreg.QueryValueEx(k, "VideoDownloader")
        return True
    except OSError:
        return False


def autostart_set(on):
    import winreg
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as k:
        if on:
            winreg.SetValueEx(k, "VideoDownloader", 0, winreg.REG_SZ, _autostart_cmd())
        else:
            try:
                winreg.DeleteValue(k, "VideoDownloader")
            except FileNotFoundError:
                pass


def ext_dir():
    """مجلد الإضافة: النسخة الثابتة في مجلد المستخدم أولاً (بلا _internal)، ثم المدمجة."""
    for p in (os.path.join(APP_DIR, "extension"), resource("extension"), os.path.join(APP_HOME, "extension")):
        if os.path.isfile(os.path.join(p, "manifest.json")):
            return p
    return ""


def ensure_ext_copy():
    """ينسخ إضافة المتصفح إلى مجلد المستخدم (مسار ثابت لا يحوي _internal ويرفضه Chrome) ويحدّثه مع كل إصدار."""
    src = next((p for p in (resource("extension"), os.path.join(APP_HOME, "extension"))
                if os.path.isfile(os.path.join(p, "manifest.json"))), "")
    dst = os.path.join(APP_DIR, "extension")
    if not src or os.path.abspath(src) == os.path.abspath(dst):
        return
    try:
        for root, _dirs, files in os.walk(src):
            out = os.path.join(dst, os.path.relpath(root, src))
            os.makedirs(out, exist_ok=True)
            for f in files:
                s, d = os.path.join(root, f), os.path.join(out, f)
                if f.startswith("_"):
                    continue
                if not os.path.isfile(d) or open(s, "rb").read() != open(d, "rb").read():
                    shutil.copy2(s, d)
    except OSError:
        log_error("ext-copy", "", traceback.format_exc())


def valid_urls(urls):
    out = []
    for u in urls if isinstance(urls, list) else []:
        u = str(u).strip()
        if u.lower().startswith(("http://", "https://")) and len(u) < 2000:
            out.append(u)
    return out[:500]


class Handler(BaseHTTPRequestHandler):
    server_version = "VD"

    def log_message(self, *a):
        pass

    _cors_origin = None

    def _ext_origin(self):
        o = self.headers.get("Origin") or ""
        return o if o.startswith(("chrome-extension://", "moz-extension://")) else None

    def _ext_ok(self):
        t = self.headers.get("X-Ext-Token") or ""
        return bool(t) and bool(M.ext_token) and secrets.compare_digest(t, M.ext_token)

    def do_OPTIONS(self):  # preflight لإضافة المتصفح فقط
        o = self._ext_origin()
        if not self._host_ok() or not o or not self.path.startswith("/ext/"):
            return self._send(403, {"error": "forbidden"})
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", o)
        self.send_header("Access-Control-Allow-Headers", "X-Ext-Token, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        if self._cors_origin:
            self.send_header("Access-Control-Allow-Origin", self._cors_origin)
            self.send_header("Vary", "Origin")
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def _host_ok(self):
        return self.headers.get("Host", "").rsplit(":", 1)[0] in ("127.0.0.1", "localhost")

    def _serve_media(self, jid):
        with M.lock:
            j = M.jobs.get(jid)
            path = j.get("file") if j else ""
        if not path or not os.path.isfile(path):
            return self._send(404, {"error": "not found"})
        size = os.path.getsize(path)
        start, end, code = 0, size - 1, 200
        rng = self.headers.get("Range") or ""
        if rng.startswith("bytes="):
            s, _, e = rng[6:].partition("-")
            try:
                if s == "":
                    start = max(0, size - int(e))
                else:
                    start = int(s)
                    end = int(e) if e else size - 1
            except ValueError:
                start, end = 0, size - 1
            end = min(end, size - 1)
            if start > end:
                return self._send(416, {"error": "range"})
            code = 206
        self.send_response(code)
        self.send_header("Content-Type", mimetypes.guess_type(path)[0] or "application/octet-stream")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        if code == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        try:
            with open(path, "rb") as f:
                f.seek(start)
                left = end - start + 1
                while left > 0:
                    chunk = f.read(min(262144, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        if not self._host_ok():
            return self._send(403, {"error": "forbidden"})
        M.last_ping = time.time()
        sp = urlsplit(self.path)
        if sp.path.startswith("/media/"):
            k = parse_qs(sp.query).get("k", [""])[0]
            if not secrets.compare_digest(k, TOKEN):
                return self._send(403, {"error": "forbidden"})
            return self._serve_media(sp.path[len("/media/"):])
        if sp.path.startswith("/ext/"):
            self._cors_origin = self._ext_origin()
            if not self._ext_ok():
                return self._send(403, {"error": "forbidden"})
            if sp.path == "/ext/ping":
                return self._send(200, {"ok": True, "app": "video-downloader", "version": APP_VERSION})
            return self._send(404, {"error": "not found"})
        if self.path in ("/", "/index.html"):
            html = load_ui().replace("__TOKEN__", TOKEN)
            return self._send(200, html.encode(), "text/html; charset=utf-8")
        if self.headers.get("X-Token") != TOKEN:
            return self._send(403, {"error": "forbidden"})
        if self.path == "/api/jobs":
            return self._send(200, {"jobs": M.snapshot()})
        if self.path == "/api/settings":
            ps, dn = phantom_status(), deno_status()
            return self._send(200, {"settings": M.settings, "version": yt_dlp.version.__version__,
                                    "ffmpeg": bool(core.FFMPEG), "impersonate": bool(core.IMPERSONATE),
                                    "deno": dn["found"], "deno_detail": dn["detail"], "phantomjs": ps["found"], "phantomjs_detail": ps["detail"],
                                    "system_proxy": core.system_proxy("https://example.com"),
                                    "ext_token": M.ext_token, "autostart": autostart_get(), "ext_dir": ext_dir(),
                                    "frozen": bool(getattr(sys, "frozen", False)), "tray": bool(TRAY["icon"]),
                                    "utf8": int(sys.flags.utf8_mode), "app_dir": APP_DIR})
        if self.path == "/api/deno-progress":
            return self._send(200, dict(DN_PROGRESS))
        if self.path == "/api/phantom-progress":
            return self._send(200, dict(PH_PROGRESS))
        if self.path == "/api/ping":
            return self._send(200, {"ok": True})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self._host_ok():
            return self._send(403, {"error": "forbidden"})
        ext = self.path.startswith("/ext/")
        if ext:  # من إضافة المتصفح: برمز الربط، ولمسارين فقط (info, download)
            self._cors_origin = self._ext_origin()
            if not self._ext_ok():
                return self._send(403, {"error": "forbidden"})
        elif self.headers.get("X-Token") != TOKEN:
            return self._send(403, {"error": "forbidden"})
        M.last_ping = time.time()
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 1_000_000:
                return self._send(413, {"error": "too large"})
            body = json.loads(self.rfile.read(n) or b"{}")
            route = self.path[len("/ext/"):] if ext else self.path[len("/api/"):]
            if ext and route not in ("info", "download"):
                return self._send(404, {"error": "not found"})
            if route == "ext-token-reset":
                M.ext_token = secrets.token_hex(8)
                M.save()
                return self._send(200, {"ext_token": M.ext_token})
            if route == "info":
                urls = valid_urls([body.get("url")])
                if not urls:
                    return self._send(400, {"error": "رابط غير صالح"})
                return self._send(200, with_phantom(lambda: core.fetch_info(
                    urls[0], M.settings["browser"], M.settings["proxy"], M.settings["cookiefile"])))
            if route == "search":
                q = str(body.get("q") or "").strip()[:200]
                if not q:
                    return self._send(400, {"error": "اكتب كلمة البحث"})
                return self._send(200, {"results": core.search(q, body.get("source", "youtube"), 12,
                                                               M.settings["browser"], M.settings["proxy"],
                                                               M.settings["cookiefile"])})
            if route == "download":
                key = body.get("key", "best")
                if key not in ("best", *core.AUDIO_KEYS):
                    key = int(key)
                raw = body.get("items")
                if not isinstance(raw, list):  # توافق: قائمة روابط فقط
                    raw = [{"url": u} for u in valid_urls(body.get("urls"))]
                items = []
                for it in raw[:500]:
                    if not isinstance(it, dict) or not valid_urls([it.get("url")]):
                        continue
                    idx = it.get("index")
                    items.append({"url": it["url"].strip(), "index": int(idx) if idx else None,
                                  "title": str(it.get("title") or "")[:300],
                                  "thumb": str(it.get("thumb") or "")[:1000]})
                if not items:
                    return self._send(400, {"error": "لا توجد روابط صالحة"})
                extra = {}
                tr = body.get("trim")
                if isinstance(tr, dict):
                    st, en = float(tr.get("start") or 0), float(tr.get("end") or 0)
                    if st < 0 or en < 0 or (en and en <= st):
                        return self._send(400, {"error": "وقت القص غير صحيح"})
                    extra = {"start": st, "end": en}
                return self._send(200, {"ids": M.add(items, key, body.get("subs"), extra)})
            if route in ("cancel", "pause"):
                M.stop(body.get("id"), route)
                return self._send(200, {"ok": True})
            if route == "resume":
                return self._send(200, {"ok": M.resume(body.get("id"))})
            if route == "remove":
                with M.lock:
                    j = M.jobs.get(body.get("id"))
                    if j and j["status"] in ("done", "error", "canceled"):
                        del M.jobs[body["id"]]
                M.save()
                return self._send(200, {"ok": True})
            if route == "clear":
                with M.lock:
                    M.jobs = {k: v for k, v in M.jobs.items() if v["status"] in ("queued", "downloading", "processing", "paused")}
                M.save()
                return self._send(200, {"ok": True})
            if route == "settings":
                M.set_settings(body)
                return self._send(200, {"settings": M.settings})
            if route == "open":
                open_path(body.get("id"), "file" if body.get("mode") == "file" else "folder")
                return self._send(200, {"ok": True})
            if route == "diagnose":
                u = valid_urls([body.get("url")])
                if not u:
                    return self._send(400, {"error": "الصق رابطاً صالحاً أولاً"})
                return self._send(200, core.diagnose(u[0], M.settings["proxy"]))
            if route == "install-deno":
                if DN_PROGRESS["state"] != "running":
                    threading.Thread(target=_deno_worker, daemon=True).start()
                return self._send(200, {"started": True})
            if route == "install-phantomjs":
                if PH_PROGRESS["state"] != "running":
                    threading.Thread(target=_phantom_worker, daemon=True).start()
                return self._send(200, {"started": True})
            if route == "update":
                return self._send(200, update_ytdlp())
            if route == "restart":
                threading.Timer(0.6, restart_app).start()
                return self._send(200, {"ok": True})
            if route == "autostart":
                if not IS_WIN:
                    return self._send(400, {"error": "متاح على ويندوز فقط"})
                autostart_set(bool(body.get("on")))
                return self._send(200, {"autostart": autostart_get()})
            if route == "open-ext-folder":
                d = ext_dir()
                if not d:
                    return self._send(400, {"error": "مجلد الإضافة غير موجود"})
                if IS_WIN:
                    subprocess.Popen(["explorer", os.path.normpath(d)])
                else:
                    subprocess.Popen(["open" if sys.platform == "darwin" else "xdg-open", d])
                return self._send(200, {"ok": True})
            self._send(404, {"error": "not found"})
        except Exception as e:  # noqa: BLE001
            log_error("route", self.path, traceback.format_exc())
            self._send(400, {"error": core.friendly_error(e)})


def find_browser():
    if sys.platform.startswith("win"):
        roots = [os.environ.get(k, "") for k in ("PROGRAMFILES(X86)", "PROGRAMFILES", "LOCALAPPDATA")]
        for rel in (r"Microsoft\Edge\Application\msedge.exe", r"Google\Chrome\Application\chrome.exe"):
            for r in roots:
                p = os.path.join(r, rel)
                if r and os.path.exists(p):
                    return p
    return None


def open_ui(url):
    if os.environ.get("VD_NO_BROWSER"):
        return
    exe = find_browser()
    if exe:  # نافذة تطبيق بدون شريط عناوين
        try:
            subprocess.Popen([exe, f"--app={url}", "--window-size=1000,860"])
            return
        except OSError:
            pass
    webbrowser.open(url)


TRAY = {"icon": None}


def notify_done(title):
    """إشعار ويندوز عند اكتمال تحميل (في وضع شريط النظام)."""
    try:
        if TRAY["icon"]:
            TRAY["icon"].notify((title or "")[:120], "اكتمل التحميل ✔")
    except Exception:  # noqa: BLE001
        pass


def tray_image(size=64):
    from PIL import Image, ImageDraw
    S = size * 4
    grad = Image.new("RGBA", (S, S))
    px = grad.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S)
            px[x, y] = (int(79 + 45 * t), int(109 - 32 * t), 255, 255)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.24), fill=255)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    img.paste(grad, (0, 0), mask)
    d, w, cx = ImageDraw.Draw(img), S * 0.11, S / 2
    d.rounded_rectangle([cx - w / 2, S * 0.2, cx + w / 2, S * 0.56], radius=w / 2, fill="white")
    d.polygon([(S * 0.27, S * 0.5), (S * 0.73, S * 0.5), (cx, S * 0.76)], fill="white")
    d.rounded_rectangle([S * 0.24, S * 0.8, S * 0.76, S * 0.86], radius=S * 0.03, fill="white")
    return img.resize((size, size), Image.LANCZOS)


def run_tray(port, background):
    """أيقونة بجوار الساعة: فتح، مجلد التحميلات، التشغيل مع ويندوز، خروج. تبقي البرنامج يعمل في الخلفية."""
    import pystray
    url = f"http://127.0.0.1:{port}/"

    def quit_app(icon, item):
        if IS_WIN and M.active():
            try:
                import ctypes
                if ctypes.windll.user32.MessageBoxW(
                        0, "توجد تحميلات شغّالة. الخروج سيوقفها مؤقتاً (يمكنك استئنافها لاحقاً). متابعة؟",
                        "محمّل الفيديوهات", 0x24) != 6:
                    return
            except Exception:  # noqa: BLE001
                pass
        M.save()
        icon.stop()
        os._exit(0)

    items = [pystray.MenuItem("فتح البرنامج", lambda i, it: open_ui(url), default=True),
             pystray.MenuItem("فتح مجلد التحميلات", lambda i, it: open_path(None))]
    if IS_WIN:
        items.append(pystray.MenuItem("التشغيل مع ويندوز", lambda i, it: autostart_set(not autostart_get()),
                                      checked=lambda it: bool(autostart_get())))
    items.append(pystray.MenuItem("خروج", quit_app))
    # ويندوز يقبل العنوان العربي؛ واجهات لينكس القديمة (X11) لا تقبل إلا ASCII
    icon = pystray.Icon("VideoDownloader", tray_image(), "محمّل الفيديوهات" if IS_WIN else "Video Downloader",
                        pystray.Menu(*items))
    TRAY["icon"] = icon
    if not background:
        threading.Thread(target=open_ui, args=(url,), daemon=True).start()
    icon.run()


def watchdog():
    """يقفل البرنامج لما تتقفل النافذة (لا نبضات) ولا يوجد تحميل شغّال."""
    time.sleep(60)
    while True:
        time.sleep(5)
        if time.time() - M.last_ping > IDLE_EXIT_SECONDS and not M.active():
            M.save()
            os._exit(0)


def main():
    args = sys.argv[1:]
    background = "--background" in args
    want_tray = "--tray" in args or bool(getattr(sys, "frozen", False))
    port = int(os.environ.get("VD_PORT") or 8765)
    url = f"http://127.0.0.1:{port}/"
    httpd = None
    for i in range(30 if "--restarted" in args else 1):  # بعد إعادة التشغيل ننتظر تحرّر المنفذ
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            time.sleep(0.5)
    if httpd is None:  # نسخة ثانية شغّالة -> افتح نافذتها (إلا لو بدأنا مع ويندوز بالخلفية)
        if not background:
            open_ui(url)
        return
    httpd.daemon_threads = True
    ensure_ext_copy()
    load_ui()
    try:
        print(f"running on {url}  |  UI file: {load_ui.last[0]} (v{load_ui.last[1]})", flush=True)
    except Exception:  # noqa: BLE001
        pass
    tray_ok = False
    if want_tray:
        try:
            import pystray  # noqa: F401
            tray_ok = True
        except Exception:  # noqa: BLE001
            print("pystray not available: running without tray icon", flush=True)
    if tray_ok:
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        try:
            run_tray(port, background)  # يحجب حتى «خروج»
            return
        except Exception:  # noqa: BLE001
            log_error("tray", "", traceback.format_exc())
            threading.Thread(target=watchdog, daemon=True).start()
            if not background:
                open_ui(url)
            threading.Event().wait()
            return
    threading.Thread(target=watchdog, daemon=True).start()
    if not background:
        threading.Thread(target=open_ui, args=(url,), daemon=True).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
