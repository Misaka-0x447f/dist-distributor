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

function renderPage(prefix, folders, files) {
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
      return `<tr>
        <td><a href="/download?key=${encodeURIComponent(obj.key)}">📄 ${escapeHtml(name)}</a></td>
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
    .breadcrumb { font-size: 0.9rem; margin-bottom: 20px; color: #888; }
    .breadcrumb a { color: #7aadff; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #333; color: #666; font-weight: normal; font-size: 0.85rem; }
    td { padding: 7px 12px; border-bottom: 1px solid #222; font-size: 0.9rem; }
    td:nth-child(2), td:nth-child(3) { color: #777; white-space: nowrap; }
    tr:hover td { background: #242424; }
    a { color: #7aadff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .empty { color: #555; padding: 20px 12px; }
  </style>
</head>
<body>
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
</body>
</html>`;
}
