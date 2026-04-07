export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/download') {
      return handleDownload(url, env);
    }

    if (url.pathname === '/') {
      return handleList(url, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleList(url, env) {
  const prefix = url.searchParams.get('prefix') ?? '';

  const result = await env.BUCKET.list({ prefix, delimiter: '/' });

  const folders = result.delimitedPrefixes ?? [];
  const files = result.objects ?? [];

  const html = renderPage(prefix, folders, files);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function handleDownload(url, env) {
  const key = url.searchParams.get('key');
  if (!key) return new Response('Missing key', { status: 400 });

  const object = await env.BUCKET.get(key);
  if (!object) return new Response('Not Found', { status: 404 });

  const filename = key.split('/').pop();
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': object.size?.toString() ?? '',
    },
  });
}

function renderBreadcrumb(prefix) {
  const parts = prefix ? prefix.split('/').filter(Boolean) : [];
  let html = `<a href="/">root</a>`;
  let accumulated = '';
  for (const part of parts) {
    accumulated += part + '/';
    html += ` / <a href="/?prefix=${encodeURIComponent(accumulated)}">${escapeHtml(part)}</a>`;
  }
  return html;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toISOString().replace('T', ' ').slice(0, 19);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getFileBadge(key) {
  if (/\/rc\.\d+\/.*\.exe$/i.test(key)) {
    return '<span class="badge badge-dev">开发版</span>';
  }
  if (/\.exe$/i.test(key)) {
    return '<span class="badge badge-stable">稳定版</span>';
  }
  return '';
}

const CHAT_BUBBLE_HTML_OPTIONS = [
  `
<p>你知道吗？</p>
<small>开发版比稳定版稳定</small>
`,
  `
<p>你知道吗？</p>
<small>本软件的开发过程中没有舰长受到伤害。</small>
`,
  `
<p>你知道吗？</p>
<small>此下载服务器托管在国外(Cloudflare R2)，因此有时下载会不稳定，并且作者也不喜欢百度网盘，所以如果你下载速度慢，可以考虑一下迅雷之类的会“缓存资源”的下载器。当然，装了之后弹出迅雷的广告别找我。</small>
`,
  `
<p>你知道吗？</p>
<small>目前软件没多少用户所以遇到问题可以直接 b 站私信问，后面会出个文档站</small>
  `,
  `
<p>你知道吗？</p>
<small>牢叹打赢复活赛啦</small>
  `,
  `
<p>你知道吗？</p>
<small>作者是高仿号，不要找到正主那里去了，看清粉丝数，作者没粉丝</small>
  `,
  `
<p>你知道吗？</p>
<small>晚八点是因为正主被称为韵律早八点，而牢叹之前一般晚上 8 点下拨</small>
  `,
];

function getInitialChatBubbleIndex() {
  return Math.floor(Math.random() * CHAT_BUBBLE_HTML_OPTIONS.length);
}

function renderPage(prefix, folders, files) {
  const initialChatBubbleIndex = getInitialChatBubbleIndex();
  const folderRows = folders.slice().sort().map(f => {
    const name = f.slice(prefix.length);
    return `<tr>
      <td><a href="/?prefix=${encodeURIComponent(f)}">📁 ${escapeHtml(name)}</a></td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }).join('\n');

  const fileRows = files
    .filter(obj => obj.key !== prefix)
    .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
    .map(obj => {
      const name = obj.key.slice(prefix.length);
      const badge = getFileBadge(obj.key);
      return `<tr>
        <td><a class="file-link" href="/download?key=${encodeURIComponent(obj.key)}"><span>📄 ${escapeHtml(name)}</span>${badge}</a></td>
        <td>${formatSize(obj.size)}</td>
        <td>${formatDate(obj.uploaded)}</td>
      </tr>`;
    }).join('\n');

  const isEmpty = folders.length === 0 && files.filter(o => o.key !== prefix).length === 0;

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>dist - ${escapeHtml(prefix || '/')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Hack, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'DejaVu Sans', 'Liberation Sans', 'WenQuanYi Micro Hei', 'Droid Sans Fallback', ui-monospace, monospace; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #eee; background: #1a1a1a; }
    h1 { font-size: 1.2rem; color: #aaa; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; }
    h1 small { font-size: 0.8rem; color: #fb0; }
    .hero { display: flex; align-items: flex-start; gap: 26px; margin: 18px 0 24px; }
    .avatar-frame { width: 72px; height: 72px; border-radius: 50%; flex: 0 0 auto; border: 2px solid #66ccff; padding: 2px; box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.18), 0 6px 18px rgba(0, 0, 0, 0.28); background: rgba(255, 255, 255, 0.2); overflow: hidden; }
    .avatar { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; filter: brightness(1.2); }
    .bubble { position: relative; display: flex; flex-direction: column; flex: 1 1 auto; max-width: min(720px, calc(100vw - 154px)); margin-top: 8px; padding: 16px 18px; border-radius: 18px; background: #242424; border: 1px solid #363636; color: #eaeaea; line-height: 1.65; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }
    .bubble::before { content: ''; position: absolute; left: -9px; top: 20px; width: 18px; height: 18px; background: #242424; border-left: 1px solid #363636; border-bottom: 1px solid #363636; transform: rotate(45deg); }
    .bubble-content { min-height: 78px; }
    .bubble p { margin: 0; }
    .bubble p + p { margin-top: 0.75em; }
    .bubble-nav { display: inline-flex; align-items: center; gap: 8px; align-self: flex-end; margin-top: 14px; font-size: 0.75rem; }
    .bubble-nav button { appearance: none; border: 1px solid #4a4a4a; background: #1e1e1e; color: #d9d9d9; border-radius: 999px; min-width: 28px; height: 28px; padding: 0 8px; cursor: pointer; font: inherit; }
    .bubble-nav button:hover { background: #2a2a2a; border-color: #66ccff; }
    .bubble-nav button:active { transform: translateY(1px); }
    .bubble-nav-status { min-width: 52px; text-align: center; color: #9a9a9a; }
    .breadcrumb { font-size: 0.9rem; margin-bottom: 20px; color: #888; }
    .breadcrumb a { color: #7aadff; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #333; color: #666; font-weight: normal; font-size: 0.85rem; }
    td { padding: 7px 12px; border-bottom: 1px solid #222; font-size: 0.9rem; }
    td:nth-child(2), td:nth-child(3) { color: #777; white-space: nowrap; }
    .file-link { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 999px; font-size: 0.75rem; line-height: 1.4; }
    .badge-dev { background: #473000; color: #ffbf47; border: 1px solid #7a5600; }
    .badge-stable { background: #0f3321; color: #6dd59c; border: 1px solid #215c3f; }
    tr:hover td { background: #242424; }
    a { color: #7aadff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .empty { color: #555; padding: 20px 12px; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="avatar-frame">
      <img class="avatar" src="/avatar.jpg" alt="avatar">
    </div>
    <div class="bubble">
      <div class="bubble-content" id="chat-bubble-content">${CHAT_BUBBLE_HTML_OPTIONS[initialChatBubbleIndex]}</div>
      <div class="bubble-nav">
        <button type="button" id="chat-bubble-prev" aria-label="上一条">&lt;</button>
        <span class="bubble-nav-status" id="chat-bubble-status"></span>
        <button type="button" id="chat-bubble-next" aria-label="下一条">&gt;</button>
      </div>
    </div>
  </section>
  <h1><span>韵律晚八点 Arcaea / dist</span><small>所有软件免费提供，严禁倒卖，如果你是买的请找卖家退款</small></h1>
  <div class="breadcrumb">${renderBreadcrumb(prefix)}</div>
  <table>
    <thead>
      <tr>
        <th>名称</th>
        <th>大小</th>
        <th>修改时间</th>
      </tr>
    </thead>
    <tbody>
      ${folderRows}
      ${fileRows}
      ${isEmpty ? '<tr><td class="empty" colspan="3">空目录</td></tr>' : ''}
    </tbody>
  </table>
  <script>
    const chatBubbleHtmlOptions = ${JSON.stringify(CHAT_BUBBLE_HTML_OPTIONS)};
    let currentChatBubbleIndex = ${initialChatBubbleIndex};
    const chatBubbleContent = document.getElementById('chat-bubble-content');
    const chatBubbleStatus = document.getElementById('chat-bubble-status');
    const chatBubblePrev = document.getElementById('chat-bubble-prev');
    const chatBubbleNext = document.getElementById('chat-bubble-next');

    function renderChatBubble() {
      chatBubbleContent.innerHTML = chatBubbleHtmlOptions[currentChatBubbleIndex];
      chatBubbleStatus.textContent = (currentChatBubbleIndex + 1) + ' / ' + chatBubbleHtmlOptions.length;
    }

    chatBubblePrev.addEventListener('click', () => {
      currentChatBubbleIndex = (currentChatBubbleIndex - 1 + chatBubbleHtmlOptions.length) % chatBubbleHtmlOptions.length;
      renderChatBubble();
    });

    chatBubbleNext.addEventListener('click', () => {
      currentChatBubbleIndex = (currentChatBubbleIndex + 1) % chatBubbleHtmlOptions.length;
      renderChatBubble();
    });

    renderChatBubble();
  </script>
</body>
</html>`;
}
