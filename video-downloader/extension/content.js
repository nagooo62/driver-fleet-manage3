// يظهر زر التحميل العائم بجانب الفيديو، وعند الضغط عليه تظهر لوحة الجودات.
(() => {
  if (window.__vdInjected || window.top !== window) return;
  window.__vdInjected = true;
  if (document.querySelector('meta[name="ui-version"]')) return; // صفحة البرنامج نفسها

  // مواقع معروفة: يظهر الزر في صفحات الفيديو فقط (عدّل القائمة لإضافة مواقع)
  const RULES = [
    { h: /(^|\.)youtube\.com$/, p: /^\/(watch|shorts\/|live\/)/ },
    { h: /(^|\.)youtu\.be$/, p: /^\/.+/ },
    { h: /(^|\.)tiktok\.com$/, p: /\/(video|photo)\/|^\/@[^/]+\/video/ },
    { h: /(^|\.)instagram\.com$/, p: /^\/(reel|reels|p|tv)\// },
    { h: /(^|\.)facebook\.com$|(^|\.)fb\.watch$/, p: /\/(watch|reel|videos|share\/v|share\/r)/ },
    { h: /(^|\.)(x|twitter)\.com$/, p: /\/status\// },
    { h: /(^|\.)vimeo\.com$/, p: /^\/\d+/ },
    { h: /(^|\.)dailymotion\.com$/, p: /^\/video\// },
    { h: /(^|\.)twitch\.tv$/, p: /\/(videos|clip)\// },
    { h: /(^|\.)soundcloud\.com$/, p: /^\/[^/]+\/[^/]+/ },
    { h: /(^|\.)pornhub\.com$/, p: /view_video\.php|\/embed\// },
  ];
  const siteMatch = () => RULES.some((r) => r.h.test(location.hostname) && r.p.test(location.pathname + location.search));
  const bigVideo = () =>
    [...document.querySelectorAll("video")].some((v) => {
      const b = v.getBoundingClientRect();
      return b.width >= 240 && b.height >= 135;
    });
  const shouldShow = () => siteMatch() || bigVideo();

  const VIDEO_PRESETS = [["أعلى جودة", "best"], ["1080p", 1080], ["720p", 720], ["480p", 480], ["360p", 360]];
  const AUDIO_PRESETS = [["أعلى جودة أصلية", "a_best"], ["MP3 · 320", "mp3_320"], ["MP3 · 192", "mp3_192"], ["MP3 · 128", "mp3_128"]];

  const fmtSize = (b) => (!b ? "" : b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB" : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");
  const fmtDur = (s) => {
    s = Math.round(s || 0);
    if (!s) return "";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0");
  };

  let host, root, fab, panel, body;
  let lastUrl = "", info = null, tab = "video", key = "best", picked = null, busy = false;
  let fabTop = 38; // نسبة مئوية من ارتفاع الصفحة

  function send(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => resolve(res || { ok: false, code: "offline" }));
      } catch (e) {
        resolve({ ok: false, code: "reload" }); // الإضافة حُدّثت: يلزم إعادة تحميل الصفحة
      }
    });
  }

  const CSS = `
    :host{all:initial}
    *{box-sizing:border-box;font-family:"Segoe UI",Tahoma,"Noto Sans Arabic",system-ui,sans-serif}
    .fab{position:fixed;right:0;width:46px;height:46px;border:0;border-radius:14px 0 0 14px;cursor:pointer;
      background:linear-gradient(135deg,#4f6df5,#7c4dff);color:#fff;box-shadow:0 4px 18px rgba(0,0,0,.35);
      display:grid;place-items:center;padding:0;transition:transform .15s;touch-action:none}
    .fab:hover{transform:translateX(-4px)} .fab svg{width:24px;height:24px;pointer-events:none}
    .panel{position:fixed;right:58px;width:350px;max-height:82vh;overflow:auto;direction:rtl;text-align:right;
      background:#fff;color:#18202e;border:1px solid #e3e8f0;border-radius:16px;padding:14px;
      box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:14px;line-height:1.55}
    @media (prefers-color-scheme:dark){.panel{background:#161d2e;color:#e8ecf6;border-color:#25304a}
      .chip{background:#1f2842;color:#e8ecf6;border-color:#25304a}.note{background:#1f2842}.tab{background:#161d2e;color:#e8ecf6;border-color:#25304a}.tab.on{background:#1f2842}}
    .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:700}
    .hd .sp{flex:1}.x{border:0;background:transparent;color:inherit;font-size:18px;cursor:pointer;padding:0 4px}
    .pv{display:flex;gap:10px;margin-bottom:10px}
    .pv img{width:104px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#e8ecf6;flex:none}
    .t{font-weight:600;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .m{font-size:12px;opacity:.7;margin-top:2px}
    .tabs{display:flex;gap:6px;margin:8px 0}
    .tab{flex:1;border:2px solid #e3e8f0;background:#fff;color:#18202e;border-radius:10px;padding:7px;font:inherit;font-weight:700;cursor:pointer}
    .tab.on{border-color:#4f6df5;background:#eef1fb}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chip{border:1.5px solid #e3e8f0;background:#eef1fb;color:#18202e;border-radius:10px;padding:6px 11px;cursor:pointer;font:inherit;font-size:13px;text-align:center;line-height:1.3}
    .chip small{display:block;font-size:11px;opacity:.8}
    .chip.on{background:#4f6df5;border-color:#4f6df5;color:#fff}
    .go{width:100%;margin-top:12px;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:700;color:#fff;cursor:pointer;
      background:linear-gradient(135deg,#4f6df5,#7c4dff)} .go:disabled{opacity:.6;cursor:wait}
    .sec{width:100%;margin-top:8px;border:1px solid #e3e8f0;background:transparent;color:inherit;border-radius:10px;padding:8px;font:inherit;cursor:pointer}
    .note{background:#eef1fb;border-radius:10px;padding:9px 11px;margin:6px 0;font-size:13px}
    .err{color:#d92d20;font-weight:600}.ok{color:#12a150;font-weight:700}
    .spin{display:inline-block;width:14px;height:14px;border:2px solid #4f6df577;border-top-color:#4f6df5;border-radius:50%;animation:s .7s linear infinite;vertical-align:-2px;margin-inline-end:6px}
    @keyframes s{to{transform:rotate(360deg)}}
  `;
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';

  function el(tag, props, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c && n.append(c));
    return n;
  }

  function ensureUI() {
    if (host) return;
    host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;top:0;right:0;width:0;height:0";
    root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = CSS;
    fab = el("button", { class: "fab", title: "تحميل هذا الفيديو" });
    fab.innerHTML = ICON;
    panel = el("div", { class: "panel" });
    panel.style.display = "none";
    root.append(style, fab, panel);
    document.documentElement.appendChild(host);
    placeFab();
    setupDrag();
    try { chrome.storage.local.get({ fabTop: 38 }, (o) => { fabTop = o.fabTop; placeFab(); }); } catch (e) { /* ignore */ }
  }

  function placeFab() {
    const px = Math.max(8, Math.min(innerHeight - 56, (fabTop / 100) * innerHeight));
    fab.style.top = px + "px";
    panel.style.top = Math.max(8, Math.min(px, innerHeight - 120)) + "px";
  }

  function setupDrag() {
    let startY = 0, startTop = 0, moved = false, down = false;
    fab.addEventListener("pointerdown", (e) => { down = true; moved = false; startY = e.clientY; startTop = fab.getBoundingClientRect().top; fab.setPointerCapture(e.pointerId); });
    fab.addEventListener("pointermove", (e) => {
      if (!down) return;
      if (Math.abs(e.clientY - startY) > 5) moved = true;
      if (moved) { fabTop = ((startTop + e.clientY - startY) / innerHeight) * 100; placeFab(); }
    });
    fab.addEventListener("pointerup", () => {
      down = false;
      if (moved) { try { chrome.storage.local.set({ fabTop }); } catch (e) { /* ignore */ } return; }
      panel.style.display === "none" ? openPanel() : closePanel();
    });
  }

  function closePanel() { panel.style.display = "none"; }

  async function openPanel() {
    ensureUI();
    placeFab();
    panel.style.display = "block";
    if (info && info.__url === location.href) return render();
    info = null; picked = null; busy = false;
    renderState(el("div", { class: "note" }, el("span", { class: "spin" }), "جاري تحليل الفيديو..."));
    const res = await send({ type: "info", url: location.href });
    if (!res.ok) return renderError(res);
    info = res.data; info.__url = location.href;
    tab = "video"; key = "best";
    render();
  }

  const header = (title) => el("div", { class: "hd" }, el("span", { text: "⬇ " + title }), el("span", { class: "sp" }), el("button", { class: "x", text: "✕", title: "إغلاق", onclick: closePanel }));
  function renderState(...kids) { panel.replaceChildren(header("محمّل الفيديوهات"), ...kids); }

  function renderError(res) {
    const retry = el("button", { class: "go", text: "إعادة المحاولة", onclick: openPanel });
    if (res.code === "no_token" || res.code === "bad_token") {
      return renderState(
        el("div", { class: "note" }, el("div", { class: "err", text: res.code === "no_token" ? "الإضافة غير مربوطة بالبرنامج بعد." : "رمز الربط غير صحيح." }),
          el("div", { text: "افتح خيارات الإضافة والصق الرمز الذي تجده في البرنامج: الإعدادات ← رمز ربط إضافة المتصفح." })),
        el("button", { class: "go", text: "فتح الخيارات", onclick: () => send({ type: "open-options" }) }));
    }
    if (res.code === "offline") {
      return renderState(
        el("div", { class: "note" }, el("div", { class: "err", text: "برنامج محمّل الفيديوهات غير مشغّل." }), el("div", { text: "شغّل run.bat على جهازك ثم أعد المحاولة." })), retry);
    }
    if (res.code === "reload") return renderState(el("div", { class: "note err", text: "تم تحديث الإضافة، أعد تحميل الصفحة (F5)." }));
    const msg = (res.data && res.data.error) || "تعذّر تحليل الفيديو.";
    renderState(el("div", { class: "note" }, el("div", { class: "err", text: "تعذّر التحليل" }), el("div", { text: msg })), retry,
      el("button", { class: "sec", text: "فتح البرنامج", onclick: () => send({ type: "open-app" }) }));
  }

  function options() {
    if (info.type === "playlist") {
      return { video: VIDEO_PRESETS.map(([label, k]) => ({ label, key: k, size: 0 })), audio: AUDIO_PRESETS.map(([label, k]) => ({ label, key: k, size: 0 })) };
    }
    return { video: info.qualities || [], audio: info.audio || [] };
  }

  function render() {
    const o = options()[tab] || [];
    if (!picked || !o.some((x) => String(x.key) === String(key))) key = o[0] ? o[0].key : "best";
    const isList = info.type === "playlist";
    const preview = el("div", { class: "pv" },
      !isList && info.thumbnail ? el("img", { src: info.thumbnail, referrerpolicy: "no-referrer" }) : null,
      el("div", {}, el("div", { class: "t", text: info.title }),
        el("div", { class: "m", text: isList ? info.count + " فيديو في القائمة" : [info.uploader, fmtDur(info.duration)].filter(Boolean).join(" · ") })));
    const tabs = el("div", { class: "tabs" },
      el("button", { class: "tab" + (tab === "video" ? " on" : ""), text: "🎬 فيديو", onclick: () => { tab = "video"; picked = null; render(); } }),
      el("button", { class: "tab" + (tab === "audio" ? " on" : ""), text: "🎧 صوت فقط", onclick: () => { tab = "audio"; picked = null; render(); } }));
    const chips = el("div", { class: "chips" }, o.map((x) => {
      const c = el("button", { class: "chip" + (String(x.key) === String(key) ? " on" : "") }, el("span", { text: x.label }), x.size ? el("small", { text: "≈ " + fmtSize(x.size) }) : null);
      c.addEventListener("click", () => { key = x.key; picked = true; render(); });
      return c;
    }));
    const cur = o.find((x) => String(x.key) === String(key));
    const go = el("button", { class: "go", text: busy ? "جاري الإرسال..." : "⬇ تحميل" + (cur && cur.size ? " (≈ " + fmtSize(cur.size) + ")" : ""), onclick: (e) => { if (e.isTrusted) startDownload(); } }); // نقرة حقيقية فقط
    go.disabled = busy;
    panel.replaceChildren(header("محمّل الفيديوهات"), preview, tabs, chips, go,
      el("button", { class: "sec", text: "فتح البرنامج", onclick: () => send({ type: "open-app" }) }));
    picked = true;
  }

  async function startDownload() {
    busy = true; render();
    const items = info.type === "playlist"
      ? info.items.map((i) => ({ url: i.url, index: i.index, title: i.title, thumb: i.thumbnail }))
      : [{ url: location.href, index: null, title: info.title, thumb: info.thumbnail }];
    const res = await send({ type: "download", body: { items, key } });
    busy = false;
    if (!res.ok) return renderError(res);
    renderState(el("div", { class: "note" }, el("div", { class: "ok", text: "✔ أُضيف إلى التحميلات" }), el("div", { text: "تابع التقدّم في برنامج محمّل الفيديوهات." })),
      el("button", { class: "go", text: "فتح البرنامج", onclick: () => send({ type: "open-app" }) }),
      el("button", { class: "sec", text: "تحميل جودة أخرى", onclick: () => { render(); } }));
  }

  function tick() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      info = null; picked = null;
      if (panel) closePanel();
    }
    const show = shouldShow();
    if (show) ensureUI();
    if (host) host.style.display = show || (panel && panel.style.display !== "none") ? "block" : "none";
  }

  try {
    chrome.runtime.onMessage.addListener((m) => { if (m && m.type === "open-panel") openPanel(); });
  } catch (e) { /* ignore */ }
  window.addEventListener("resize", () => host && placeFab());
  tick();
  setInterval(tick, 1000);
})();
