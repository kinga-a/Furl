const PREFIX = 'link:';

function getKV(env) {
  if (env && env.SHORTURL_KV) return env.SHORTURL_KV;
  if (typeof SHORTURL_KV !== 'undefined') return SHORTURL_KV;
  return null;
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const kv = getKV(env);
  const code = params.code;
  
  if (code === 'api' || code === 'index.html' || code.endsWith('.js') || code.endsWith('.css')) {
    return new Response('Not Found', { status: 404 });
  }
  
  if (!kv) {
    return new Response('KV 未绑定', { status: 500 });
  }
  
  const data = await kv.get(PREFIX + code, { type: 'json' });
  
  if (!data) {
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 · FURL</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14161A;color:#E9ECF2;font-family:'Space Grotesk','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;text-align:center;padding:24px;position:relative;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(560px 280px at 50% -8%,rgba(59,130,246,.12),transparent 70%),repeating-linear-gradient(90deg,transparent 0 79px,#2A2E38 79px 80px);opacity:.5;pointer-events:none}
.box{position:relative;background:#1B1E24;border:1px solid #2A2E38;border-radius:14px;padding:44px 52px;box-shadow:0 24px 60px -18px rgba(0,0,0,.65);max-width:440px;width:100%}
.mark{width:46px;height:46px;margin:0 auto 18px;border-radius:11px;background:#101216;border:1px solid #3A3F4C;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;font-size:20px;color:#3B82F6}
h1{font-size:42px;font-weight:700;color:#FF5C5C;font-family:'JetBrains Mono',ui-monospace,monospace;margin:0 0 10px;letter-spacing:.04em}
p{color:#9AA2B1;font-size:14px;line-height:1.6;word-break:break-all}
</style>
</head>
<body>
<div class="box"><div class="mark">f/</div><h1>404</h1><p>短码 "${code}" 不存在或已过期</p></div>
</body>
</html>`, 
    { status: 404, headers: { 'Content-Type': 'text/html' } });
  }
  
  if (data.expireAt && new Date(data.expireAt) < new Date()) {
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>链接已过期 · FURL</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14161A;color:#E9ECF2;font-family:'Space Grotesk','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;text-align:center;padding:24px;position:relative;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(560px 280px at 50% -8%,rgba(59,130,246,.12),transparent 70%),repeating-linear-gradient(90deg,transparent 0 79px,#2A2E38 79px 80px);opacity:.5;pointer-events:none}
.box{position:relative;background:#1B1E24;border:1px solid #2A2E38;border-radius:14px;padding:44px 52px;box-shadow:0 24px 60px -18px rgba(0,0,0,.65);max-width:440px;width:100%}
.mark{width:46px;height:46px;margin:0 auto 18px;border-radius:11px;background:#101216;border:1px solid #3A3F4C;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;font-size:20px;color:#3B82F6}
h1{font-size:30px;font-weight:700;color:#FF5C5C;font-family:'JetBrains Mono',ui-monospace,monospace;margin:0 0 10px;letter-spacing:.04em}
p{color:#9AA2B1;font-size:14px;line-height:1.6}
</style>
</head>
<body>
<div class="box"><div class="mark">f/</div><h1>链接已过期</h1><p>该短码已超过有效期</p></div>
</body>
</html>`, 
    { status: 410, headers: { 'Content-Type': 'text/html' } });
  }
  
  data.visits = (data.visits || 0) + 1;
  context.waitUntil(kv.put(PREFIX + code, JSON.stringify(data)));
  
  if (data.type === 'url') {
    return new Response(null, {
      status: 302,
      headers: { 'Location': data.content }
    });
  } else {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>文本分享 · ${code} · FURL</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314161A'/%3E%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' fill='%233B82F6' text-anchor='middle'%3Ef%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #14161A;
  --bg-raised: #1B1E24;
  --bg-board: #1F232B;
  --bg-inset: #101216;
  --line: #2A2E38;
  --line-strong: #3A3F4C;
  --ink: #E9ECF2;
  --ink-dim: #9AA2B1;
  --ink-faint: #646C7A;
  --amber: #3B82F6;
  --amber-soft: rgba(59,130,246,.12);
  --green: #3ECF8E;
  --green-soft: rgba(62,207,142,.12);
  --red: #FF5C5C;
  --blue: #6FA8FF;
  --shadow-pop: 0 24px 60px -18px rgba(0,0,0,.65);
  --radius: 14px;
  --radius-sm: 9px;
  --font-display: 'Space Grotesk', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
[data-theme="light"] {
  --bg: #EEF0F4;
  --bg-raised: #FFFFFF;
  --bg-board: #F7F8FA;
  --bg-inset: #E4E7EC;
  --line: #D8DCE3;
  --line-strong: #C2C7D1;
  --ink: #1A1D23;
  --ink-dim: #5B6270;
  --ink-faint: #9AA0AC;
  --amber: #2563EB;
  --amber-soft: rgba(37,99,235,.10);
  --green: #0E9F6E;
  --green-soft: rgba(14,159,110,.10);
  --red: #E02D2D;
  --blue: #2E6FE8;
  --shadow-pop: 0 24px 50px -20px rgba(23,28,40,.25);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-display);
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  padding: 40px 20px 60px;
  transition: background .35s ease, color .35s ease;
  position: relative;
  overflow-x: hidden;
}
body::before {
  content: ''; position: fixed; inset: 0; pointer-events: none;
  background:
    radial-gradient(560px 280px at 50% -8%, var(--amber-soft), transparent 70%),
    repeating-linear-gradient(90deg, transparent 0 79px, var(--line) 79px 80px);
  opacity: .5;
}
.container { position: relative; max-width: 720px; margin: 0 auto; }
.card {
  background: var(--bg-raised); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 30px 32px 26px; position: relative;
  box-shadow: var(--shadow-pop);
  animation: riseIn .45s cubic-bezier(.22,.9,.36,1) both;
}
.card::before {
  content: ''; position: absolute; top: -1px; left: 24px; right: 24px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent); opacity: .5;
}
.head { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
.brand-mark {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: var(--bg-inset); border: 1px solid var(--line-strong);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-weight: 700; font-size: 18px; color: var(--amber);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.28);
}
.head .t { font-size: 18px; font-weight: 700; letter-spacing: .02em; }
.head .sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: .22em; color: var(--ink-faint); text-transform: uppercase; margin-top: 2px; }
.head .right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.code-tile {
  font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; color: var(--amber);
  background: var(--bg-inset); border: 1px solid var(--line);
  padding: 4px 10px; border-radius: 6px;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,.3);
}
.theme-btn {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid transparent;
  background: transparent; color: var(--ink-faint); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .16s ease; flex-shrink: 0;
}
.theme-btn:hover { color: var(--ink); background: var(--bg-inset); border-color: var(--line); }
.theme-btn svg { width: 16px; height: 16px; }
.content-box {
  background: var(--bg-inset); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 22px 24px; margin-bottom: 20px;
}
.content {
  font-family: var(--font-mono); font-size: 14.5px; line-height: 1.8;
  color: var(--ink); white-space: pre-wrap; word-break: break-all;
}
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 20px; border: 1px solid transparent; border-radius: var(--radius-sm);
  font-family: var(--font-display); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: transform .12s ease, background .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease;
  white-space: nowrap; user-select: none;
}
.btn:active { transform: scale(.965); }
.btn svg { width: 15px; height: 15px; }
.btn-primary { background: var(--amber); color: #FFFFFF; box-shadow: 0 6px 18px -6px rgba(59,130,246,.45); }
.btn-primary:hover { filter: brightness(1.06); box-shadow: 0 8px 22px -6px rgba(59,130,246,.55); }
.btn-ghost { background: transparent; border-color: var(--line-strong); color: var(--ink-dim); }
.btn-ghost:hover { color: var(--ink); border-color: var(--ink-faint); background: var(--bg-raised); }
.meta {
  margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .04em; color: var(--ink-faint);
  display: flex; gap: 6px; flex-wrap: wrap;
}
.toast {
  position: fixed; bottom: 26px; right: 26px; z-index: 200;
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; border-radius: 11px; font-size: 13.5px; font-weight: 600;
  background: var(--bg-raised); border: 1px solid var(--line-strong); color: var(--ink);
  box-shadow: var(--shadow-pop); opacity: 0; transform: translateY(16px);
  transition: opacity .28s ease, transform .28s ease; pointer-events: none; max-width: 88vw;
}
.toast.show { opacity: 1; transform: translateY(0); }
.toast .t-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.toast.error .t-dot { background: var(--red); }
@keyframes riseIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 480px) {
  body { padding: 24px 14px 48px; }
  .card { padding: 22px 18px 20px; }
  .head .t { font-size: 16px; }
  .content { font-size: 14px; }
  .actions .btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001s !important; transition-duration: .001s !important; }
}
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="head">
      <div class="brand-mark">f/</div>
      <div>
        <div class="t">文本分享</div>
        <div class="sub">Text View · ${code}</div>
      </div>
      <div class="right">
        <span class="code-tile">${code}</span>
        <button class="theme-btn" id="themeBtn" onclick="toggleTheme()" title="切换主题" aria-label="切换主题"></button>
      </div>
    </div>
    <div class="content-box">
      <div class="content" id="textContent">${escapeHtml(data.content)}</div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="copyText()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制内容</button>
      <button class="btn btn-ghost" onclick="window.location.href='/'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>返回</button>
    </div>
    <div class="meta">创建于 ${formatDate(data.createdAt)} · 已访问 ${data.visits || 1} 次${data.expireAt ? ` · 过期于 ${formatDate(data.expireAt)}` : ''}</div>
  </div>
</div>
<div class="toast" id="toast"><span class="t-dot"></span><span id="toastMsg">已复制到剪贴板</span></div>
<script>
const SUN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeBtn').innerHTML = theme === 'light' ? MOON : SUN;
  localStorage.setItem('shorturl_theme', theme);
}
function toggleTheme(){
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}
(function initTheme(){
  applyTheme(localStorage.getItem('shorturl_theme') === 'light' ? 'light' : 'dark');
})();
function copyText(){
  const text = document.getElementById('textContent').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = '已复制到剪贴板';
    t.classList.remove('error');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }).catch(() => {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = '复制失败';
    t.classList.add('error');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  });
}
<\/script>
</body>
</html>`;
        return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatDate(iso) {
  const d=new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
