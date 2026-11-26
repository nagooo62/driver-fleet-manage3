// خلفية الإضافة: كل الاتصال ببرنامج محمّل الفيديوهات يمر من هنا (وليس من صفحات المواقع).
const DEFAULTS = { port: 8765, token: "" };

async function cfg() {
  return chrome.storage.local.get(DEFAULTS);
}

async function call(method, path, body) {
  const { port, token } = await cfg();
  if (!token) return { ok: false, code: "no_token" };
  try {
    const r = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { "X-Ext-Token": token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 403) return { ok: false, code: "bad_token" };
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, code: "offline", error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "ping") return sendResponse(await call("GET", "/ext/ping"));
    if (msg.type === "info") return sendResponse(await call("POST", "/ext/info", { url: msg.url }));
    if (msg.type === "download") return sendResponse(await call("POST", "/ext/download", msg.body));
    if (msg.type === "open-app") {
      const { port } = await cfg();
      chrome.tabs.create({ url: `http://127.0.0.1:${port}/` });
      return sendResponse({ ok: true });
    }
    if (msg.type === "open-options") {
      chrome.runtime.openOptionsPage();
      return sendResponse({ ok: true });
    }
    sendResponse({ ok: false, code: "unknown" });
  })();
  return true; // رد غير متزامن
});

// قائمة الزر الأيمن: تحميل مباشر بأعلى جودة
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "dl-best",
    title: "تحميل بأعلى جودة (محمّل الفيديوهات)",
    contexts: ["page", "link", "video"],
  });
  chrome.storage.local.get(DEFAULTS).then((c) => { if (!c.token) chrome.runtime.openOptionsPage(); });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || (tab && tab.url);
  if (!url || !/^https?:/i.test(url)) return;
  const r = await call("POST", "/ext/download", { items: [{ url, title: (tab && tab.title) || "" }], key: "best" });
  const text = r.ok ? "✔" : "✖";
  chrome.action.setBadgeBackgroundColor({ color: r.ok ? "#12a150" : "#d92d20" });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3500);
});
