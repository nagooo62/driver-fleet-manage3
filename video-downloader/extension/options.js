const $ = (s) => document.querySelector(s);
chrome.storage.local.get({ port: 8765, token: "" }, (o) => { $("#token").value = o.token; $("#port").value = o.port; });
$("#save").onclick = async () => {
  const token = $("#token").value.trim(), port = parseInt($("#port").value, 10) || 8765;
  await chrome.storage.local.set({ token, port });
  const res = $("#res"); res.className = ""; res.textContent = "جاري الاختبار...";
  chrome.runtime.sendMessage({ type: "ping" }, (r) => {
    r = r || {};
    if (r.ok) { res.className = "ok"; res.textContent = "✔ تم الربط بنجاح"; }
    else if (r.code === "bad_token") { res.className = "bad"; res.textContent = "✖ الرمز غير صحيح، انسخه من إعدادات البرنامج مرة أخرى"; }
    else if (r.code === "no_token") { res.className = "bad"; res.textContent = "✖ ألصق الرمز أولاً"; }
    else { res.className = "bad"; res.textContent = "✖ البرنامج غير مشغّل أو المنفذ خاطئ"; }
  });
};
