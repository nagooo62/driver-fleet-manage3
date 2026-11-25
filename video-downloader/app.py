"""محمّل الفيديوهات - يشتغل محلياً على جهازك: خادم صغير + واجهة تفتح كنافذة تطبيق."""
import json
import mimetypes
import os
import secrets
import socket
import subprocess
import sys
import threading
import time
import uuid
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

APP_DIR = os.environ.get("VD_HOME") or os.path.join(os.path.expanduser("~"), ".video-downloader")
os.makedirs(APP_DIR, exist_ok=True)
if sys.stdout is None or sys.stderr is None:  # نسخة exe بدون نافذة سوداء
    sys.stdout = sys.stderr = open(os.path.join(APP_DIR, "log.txt"), "a", encoding="utf-8")

import yt_dlp  # noqa: E402
import core  # noqa: E402

STATE_FILE = os.path.join(APP_DIR, "state.json")
TOKEN = secrets.token_urlsafe(24)
IDLE_EXIT_SECONDS = 150
DEFAULTS = {"folder": os.path.join(os.path.expanduser("~"), "Downloads", "VideoDownloader"),
            "concurrent": 2, "rate_kb": 0, "browser": "", "subs": False,
            "proxy": "", "sort_folders": True, "container": "mp4"}


def resource(rel):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


class Manager:
    def __init__(self):
        self.lock = threading.RLock()
        self.jobs, self.cancel = {}, {}
        self.settings = dict(DEFAULTS)
        self.sem = threading.Semaphore(2)
        self.last_ping = time.time()
        self._load()

    # ---- حفظ/تحميل ----
    def _load(self):
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                data = json.load(f)
            self.settings.update(data.get("settings", {}))
            for j in data.get("jobs", []):
                if j.get("status") in ("done", "error", "canceled"):
                    self.jobs[j["id"]] = j
        except Exception:
            pass
        self.sem = threading.Semaphore(max(1, int(self.settings["concurrent"])))

    def save(self):
        with self.lock:
            data = {"settings": self.settings,
                    "jobs": [j for j in self.jobs.values() if j["status"] in ("done", "error", "canceled")][-200:]}
        tmp = STATE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
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
                u = it["url"]
                jid = uuid.uuid4().hex[:10]
                label = core.key_label(key)
                self.jobs[jid] = {"id": jid, "url": u, "index": it.get("index"), "title": it.get("title") or u,
                                  "thumb": it.get("thumb") or "", "key": key,
                                  "label": label, "status": "queued", "pct": 0, "speed": 0, "eta": 0,
                                  "file": "", "size": 0, "error": "", "created": time.time(), "folder": folder}
                self.cancel[jid] = threading.Event()
                threading.Thread(target=self._run, args=(jid, dict(s, playlist_item=it.get("index"))), daemon=True).start()
                ids.append(jid)
        return ids

    def _set(self, jid, **kw):
        with self.lock:
            if jid in self.jobs:
                self.jobs[jid].update(kw)

    def _run(self, jid, s):
        ev, sem = self.cancel[jid], self.sem
        with sem:
            if ev.is_set():
                self._set(jid, status="canceled")
                return
            self._set(jid, status="downloading")
            state = {"done": 0}

            def hook(d):
                if ev.is_set():
                    raise yt_dlp.utils.DownloadCancelled()
                info = d.get("info_dict") or {}
                if info.get("title") and self.jobs[jid]["title"] == self.jobs[jid]["url"]:
                    self._set(jid, title=info["title"], thumb=self.jobs[jid]["thumb"] or info.get("thumbnail") or "")
                n = max(1, len(info.get("requested_formats") or [1]))
                if d["status"] == "downloading":
                    total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    frac = (d.get("downloaded_bytes") or 0) / total if total else 0
                    self._set(jid, status="downloading", pct=min(99.0, (state["done"] + frac) / n * 100),
                              speed=d.get("speed") or 0, eta=d.get("eta") or 0)
                elif d["status"] == "finished":
                    state["done"] += 1
                    if state["done"] >= n:
                        self._set(jid, status="processing", pct=100, speed=0, eta=0)

            try:
                path = core.download(self.jobs[jid]["url"], self.jobs[jid]["key"], self.jobs[jid]["folder"], hook, s)
                size = os.path.getsize(path) if path and os.path.exists(path) else 0
                self._set(jid, status="done", pct=100, speed=0, eta=0, file=path, size=size)
            except yt_dlp.utils.DownloadCancelled:
                self._set(jid, status="canceled", speed=0, eta=0)
            except Exception as e:  # noqa: BLE001
                if ev.is_set():
                    self._set(jid, status="canceled", speed=0, eta=0)
                else:
                    self._set(jid, status="error", error=core.friendly_error(e), speed=0, eta=0)
        self.save()

    def active(self):
        with self.lock:
            return any(j["status"] in ("queued", "downloading", "processing") for j in self.jobs.values())

    def snapshot(self):
        with self.lock:
            return sorted((dict(j) for j in self.jobs.values()), key=lambda j: -j["created"])


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


def update_ytdlp():
    if getattr(sys, "frozen", False):
        raise RuntimeError("هذه نسخة exe مدمجة. لتحديث yt-dlp أعد بناء البرنامج بـ build_exe.bat")
    r = subprocess.run([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"],
                       capture_output=True, text=True, timeout=300)
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout)[-300:])
    return "تم التحديث. أعد تشغيل البرنامج لتفعيل النسخة الجديدة."


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

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
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
        if self.path in ("/", "/index.html"):
            with open(resource("static/index.html"), encoding="utf-8") as f:
                html = f.read().replace("__TOKEN__", TOKEN)
            return self._send(200, html.encode(), "text/html; charset=utf-8")
        if self.headers.get("X-Token") != TOKEN:
            return self._send(403, {"error": "forbidden"})
        if self.path == "/api/jobs":
            return self._send(200, {"jobs": M.snapshot()})
        if self.path == "/api/settings":
            return self._send(200, {"settings": M.settings, "version": yt_dlp.version.__version__,
                                    "ffmpeg": bool(core.FFMPEG)})
        if self.path == "/api/ping":
            return self._send(200, {"ok": True})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self._host_ok() or self.headers.get("X-Token") != TOKEN:
            return self._send(403, {"error": "forbidden"})
        M.last_ping = time.time()
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 1_000_000:
                return self._send(413, {"error": "too large"})
            body = json.loads(self.rfile.read(n) or b"{}")
            route = self.path[len("/api/"):]
            if route == "info":
                urls = valid_urls([body.get("url")])
                if not urls:
                    return self._send(400, {"error": "رابط غير صالح"})
                return self._send(200, core.fetch_info(urls[0], M.settings["browser"], M.settings["proxy"]))
            if route == "search":
                q = str(body.get("q") or "").strip()[:200]
                if not q:
                    return self._send(400, {"error": "اكتب كلمة البحث"})
                return self._send(200, {"results": core.search(q, body.get("source", "youtube"), 12,
                                                               M.settings["browser"], M.settings["proxy"])})
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
            if route == "cancel":
                ev = M.cancel.get(body.get("id"))
                if ev:
                    ev.set()
                return self._send(200, {"ok": True})
            if route == "remove":
                with M.lock:
                    j = M.jobs.get(body.get("id"))
                    if j and j["status"] in ("done", "error", "canceled"):
                        del M.jobs[body["id"]]
                M.save()
                return self._send(200, {"ok": True})
            if route == "clear":
                with M.lock:
                    M.jobs = {k: v for k, v in M.jobs.items() if v["status"] in ("queued", "downloading", "processing")}
                M.save()
                return self._send(200, {"ok": True})
            if route == "settings":
                M.set_settings(body)
                return self._send(200, {"settings": M.settings})
            if route == "open":
                open_path(body.get("id"), "file" if body.get("mode") == "file" else "folder")
                return self._send(200, {"ok": True})
            if route == "update":
                return self._send(200, {"message": update_ytdlp()})
            self._send(404, {"error": "not found"})
        except Exception as e:  # noqa: BLE001
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


def watchdog():
    """يقفل البرنامج لما تتقفل النافذة (لا نبضات) ولا يوجد تحميل شغّال."""
    time.sleep(60)
    while True:
        time.sleep(5)
        if time.time() - M.last_ping > IDLE_EXIT_SECONDS and not M.active():
            M.save()
            os._exit(0)


def main():
    port = int(os.environ.get("VD_PORT") or 8765)
    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except OSError:  # نسخة ثانية شغّالة -> افتح نافذتها
        open_ui(f"http://127.0.0.1:{port}/")
        return
    httpd.daemon_threads = True
    threading.Thread(target=watchdog, daemon=True).start()
    threading.Thread(target=open_ui, args=(f"http://127.0.0.1:{port}/",), daemon=True).start()
    print(f"running on http://127.0.0.1:{port}/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
