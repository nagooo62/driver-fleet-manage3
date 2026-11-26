const $ = (s) => document.querySelector(s);
const send = (m) => new Promise((r) => chrome.runtime.sendMessage(m, (x) => r(x || { ok: false })));
(async () => {
  const r = await send({ type: "ping" });
  const st = $("#st");
  if (r.ok) st.innerHTML = '<span class="ok">✔ متصل بالبرنامج</span>';
  else if (r.code === "no_token") st.innerHTML = '<span class="bad">غير مربوط</span> — افتح الخيارات والصق الرمز';
  else if (r.code === "bad_token") st.innerHTML = '<span class="bad">رمز الربط غير صحيح</span>';
  else st.innerHTML = '<span class="bad">البرنامج غير مشغّل</span> — شغّل run.bat';
})();
$("#go").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  try { await chrome.tabs.sendMessage(tab.id, { type: "open-panel" }); window.close(); }
  catch (e) { $("#st").innerHTML = '<span class="bad">أعد تحميل الصفحة (F5) ثم جرّب</span>'; }
};
$("#app").onclick = () => { send({ type: "open-app" }); window.close(); };
$("#opt").onclick = () => { send({ type: "open-options" }); window.close(); };
