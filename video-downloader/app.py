"""برنامج تحميل فيديوهات للكمبيوتر - الصق أي رابط واختار الجودة."""
import os
import queue
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import core

DEFAULT_DIR = os.path.join(os.path.expanduser("~"), "Downloads", "VideoDownloader")


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("محمّل الفيديوهات")
        self.geometry("640x470")
        self.minsize(560, 430)
        self.q = queue.Queue()
        self.qualities = []
        self.busy = False

        self.url = tk.StringVar()
        self.out_dir = tk.StringVar(value=DEFAULT_DIR)
        self.browser = tk.StringVar(value="بدون")
        self.playlist = tk.BooleanVar(value=False)
        self.status = tk.StringVar(value="الصق الرابط واضغط «جلب الجودات»")
        self.title_var = tk.StringVar()

        pad = {"padx": 12, "pady": 6}
        f = ttk.Frame(self)
        f.pack(fill="both", expand=True, padx=6, pady=6)

        ttk.Label(f, text="رابط الفيديو (يوتيوب، تيك توك، إنستغرام، فيسبوك، تويتر ...):").pack(anchor="e", **pad)
        row = ttk.Frame(f)
        row.pack(fill="x", **pad)
        self.fetch_btn = ttk.Button(row, text="جلب الجودات", command=self.on_fetch)
        self.fetch_btn.pack(side="left", padx=(0, 8))
        ent = ttk.Entry(row, textvariable=self.url, justify="left")
        ent.pack(side="left", fill="x", expand=True)
        ent.bind("<Return>", lambda e: self.on_fetch())
        ent.focus_set()

        ttk.Label(f, textvariable=self.title_var, wraplength=580, font=("Segoe UI", 10, "bold")).pack(anchor="e", **pad)

        ttk.Label(f, text="الجودة:").pack(anchor="e", padx=12)
        self.combo = ttk.Combobox(f, state="disabled", justify="center")
        self.combo.pack(fill="x", **pad)

        row2 = ttk.Frame(f)
        row2.pack(fill="x", **pad)
        ttk.Button(row2, text="تغيير", command=self.pick_dir).pack(side="left", padx=(0, 8))
        ttk.Entry(row2, textvariable=self.out_dir).pack(side="left", fill="x", expand=True)
        ttk.Label(row2, text="مكان الحفظ:").pack(side="left", padx=(8, 0))

        row3 = ttk.Frame(f)
        row3.pack(fill="x", **pad)
        ttk.Combobox(row3, textvariable=self.browser, state="readonly", width=10,
                     values=["بدون", "chrome", "edge", "firefox", "brave"]).pack(side="right")
        ttk.Label(row3, text="كوكيز من متصفح (للحسابات الخاصة/المقيّدة):").pack(side="right", padx=6)
        ttk.Checkbutton(row3, text="قائمة تشغيل كاملة", variable=self.playlist).pack(side="left")

        self.dl_btn = ttk.Button(f, text="تحميل", command=self.on_download, state="disabled")
        self.dl_btn.pack(fill="x", **pad)
        self.bar = ttk.Progressbar(f, maximum=100)
        self.bar.pack(fill="x", **pad)
        ttk.Label(f, textvariable=self.status, wraplength=580).pack(anchor="e", **pad)

        self.after(100, self.poll)

    # ---------- واجهة ----------
    def pick_dir(self):
        d = filedialog.askdirectory(initialdir=self.out_dir.get())
        if d:
            self.out_dir.set(d)

    def _browser(self):
        b = self.browser.get()
        return None if b == "بدون" else b

    def set_busy(self, busy):
        self.busy = busy
        self.fetch_btn.config(state="disabled" if busy else "normal")
        self.dl_btn.config(state="disabled" if busy or not self.qualities else "normal")

    # ---------- جلب الجودات ----------
    def on_fetch(self):
        url = self.url.get().strip()
        if not url or self.busy:
            return
        self.qualities = []
        self.combo.config(state="disabled", values=[])
        self.combo.set("")
        self.title_var.set("")
        self.bar["value"] = 0
        self.status.set("جاري جلب المعلومات...")
        self.set_busy(True)
        browser = self._browser()

        def work():
            try:
                info = core.fetch_info(url, browser)
                if info.get("_type") == "playlist" and info.get("entries"):
                    info = next((e for e in info["entries"] if e), info)
                self.q.put(("info", info))
            except Exception as e:
                self.q.put(("error", str(e)))
        threading.Thread(target=work, daemon=True).start()

    # ---------- التحميل ----------
    def on_download(self):
        idx = self.combo.current()
        if idx < 0 or self.busy:
            return
        key = self.qualities[idx][1]
        out_dir = self.out_dir.get().strip() or DEFAULT_DIR
        try:
            os.makedirs(out_dir, exist_ok=True)
        except OSError as e:
            messagebox.showerror("خطأ", f"تعذّر إنشاء المجلد:\n{e}")
            return
        url = self.url.get().strip()
        browser, playlist = self._browser(), self.playlist.get()
        self.bar["value"] = 0
        self.status.set("بدأ التحميل...")
        self.set_busy(True)

        def hook(d):
            if d["status"] == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                done = d.get("downloaded_bytes") or 0
                pct = done / total * 100 if total else 0
                speed = d.get("speed")
                sp = f"{speed / 1048576:.1f} MB/s" if speed else ""
                self.q.put(("progress", pct, f"جاري التحميل {pct:.0f}%  {sp}"))
            elif d["status"] == "finished":
                self.q.put(("progress", 100, "انتهى التحميل، جاري الدمج/التحويل..."))

        def work():
            try:
                core.download(url, key, out_dir, hook, browser, playlist)
                self.q.put(("done", out_dir))
            except Exception as e:
                self.q.put(("error", str(e)))
        threading.Thread(target=work, daemon=True).start()

    # ---------- استقبال الرسائل من الخيوط ----------
    def poll(self):
        try:
            while True:
                msg = self.q.get_nowait()
                kind = msg[0]
                if kind == "info":
                    info = msg[1]
                    self.qualities = core.list_qualities(info)
                    self.combo.config(state="readonly", values=[t for t, _ in self.qualities])
                    self.combo.current(0)
                    self.title_var.set(info.get("title") or "")
                    self.status.set(f"تم العثور على {len(self.qualities)} خيارات. اختر الجودة واضغط تحميل.")
                    self.set_busy(False)
                elif kind == "progress":
                    self.bar["value"] = msg[1]
                    self.status.set(msg[2])
                elif kind == "done":
                    self.bar["value"] = 100
                    self.status.set(f"✔ تم التحميل في: {msg[1]}")
                    self.set_busy(False)
                    try:
                        os.startfile(msg[1])  # يفتح المجلد (ويندوز)
                    except Exception:
                        pass
                elif kind == "error":
                    self.status.set("حصل خطأ")
                    self.set_busy(False)
                    messagebox.showerror("خطأ", msg[1][-800:])
        except queue.Empty:
            pass
        self.after(100, self.poll)


if __name__ == "__main__":
    App().mainloop()
