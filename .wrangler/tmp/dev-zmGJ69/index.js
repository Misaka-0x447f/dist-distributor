var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-7HxlZa/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/download") {
      return handleDownload(url, env);
    }
    if (url.pathname === "/") {
      return handleList(url, env);
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function handleList(url, env) {
  const prefix = url.searchParams.get("prefix") ?? "";
  const result = await env.BUCKET.list({ prefix, delimiter: "/" });
  const folders = result.delimitedPrefixes ?? [];
  const files = result.objects ?? [];
  const html = renderPage(prefix, folders, files);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(handleList, "handleList");
async function handleDownload(url, env) {
  const key = url.searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not Found", { status: 404 });
  const filename = key.split("/").pop();
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": object.size?.toString() ?? ""
    }
  });
}
__name(handleDownload, "handleDownload");
function renderBreadcrumb(prefix) {
  const parts = prefix ? prefix.split("/").filter(Boolean) : [];
  let html = `<a href="/">root</a>`;
  let accumulated = "";
  for (const part of parts) {
    accumulated += part + "/";
    html += ` / <a href="/?prefix=${encodeURIComponent(accumulated)}">${escapeHtml(part)}</a>`;
  }
  return html;
}
__name(renderBreadcrumb, "renderBreadcrumb");
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}
__name(formatSize, "formatSize");
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toISOString().replace("T", " ").slice(0, 19);
}
__name(formatDate, "formatDate");
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml, "escapeHtml");
function getFileBadge(key) {
  if (/\/rc\.\d+\/.*\.exe$/i.test(key)) {
    return '<span class="badge badge-dev">\u5F00\u53D1\u7248</span>';
  }
  if (/\.exe$/i.test(key)) {
    return '<span class="badge badge-stable">\u7A33\u5B9A\u7248</span>';
  }
  return "";
}
__name(getFileBadge, "getFileBadge");
var CHAT_BUBBLE_HTML_OPTIONS = [
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u5F00\u53D1\u7248\u6BD4\u7A33\u5B9A\u7248\u7A33\u5B9A</small>
`,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u672C\u8F6F\u4EF6\u7684\u5F00\u53D1\u8FC7\u7A0B\u4E2D\u6CA1\u6709\u8230\u957F\u53D7\u5230\u4F24\u5BB3\u3002</small>
`,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u6B64\u4E0B\u8F7D\u670D\u52A1\u5668\u6258\u7BA1\u5728\u56FD\u5916(Cloudflare R2)\uFF0C\u56E0\u6B64\u6709\u65F6\u4E0B\u8F7D\u4F1A\u4E0D\u7A33\u5B9A\uFF0C\u5E76\u4E14\u4F5C\u8005\u4E5F\u4E0D\u559C\u6B22\u767E\u5EA6\u7F51\u76D8\uFF0C\u6240\u4EE5\u5982\u679C\u4F60\u4E0B\u8F7D\u901F\u5EA6\u6162\uFF0C\u53EF\u4EE5\u8003\u8651\u4E00\u4E0B\u8FC5\u96F7\u4E4B\u7C7B\u7684\u4F1A\u201C\u7F13\u5B58\u8D44\u6E90\u201D\u7684\u4E0B\u8F7D\u5668\u3002\u5F53\u7136\uFF0C\u88C5\u4E86\u4E4B\u540E\u5F39\u51FA\u8FC5\u96F7\u7684\u5E7F\u544A\u522B\u627E\u6211\u3002</small>
`,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u76EE\u524D\u8F6F\u4EF6\u6CA1\u591A\u5C11\u7528\u6237\u6240\u4EE5\u9047\u5230\u95EE\u9898\u53EF\u4EE5\u76F4\u63A5 b \u7AD9\u79C1\u4FE1\u95EE\uFF0C\u540E\u9762\u4F1A\u51FA\u4E2A\u6587\u6863\u7AD9</small>
  `,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u7262\u53F9\u6253\u8D62\u590D\u6D3B\u8D5B\u5566</small>
  `,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u4F5C\u8005\u662F\u9AD8\u4EFF\u53F7\uFF0C\u4E0D\u8981\u627E\u5230\u6B63\u4E3B\u90A3\u91CC\u53BB\u4E86\uFF0C\u770B\u6E05\u7C89\u4E1D\u6570\uFF0C\u4F5C\u8005\u6CA1\u7C89\u4E1D</small>
  `,
  `
<p>\u4F60\u77E5\u9053\u5417\uFF1F</p>
<small>\u665A\u516B\u70B9\u662F\u56E0\u4E3A\u6B63\u4E3B\u88AB\u79F0\u4E3A\u97F5\u5F8B\u65E9\u516B\u70B9\uFF0C\u800C\u7262\u53F9\u4E4B\u524D\u4E00\u822C\u665A\u4E0A 8 \u70B9\u4E0B\u62E8</small>
  `
];
function getInitialChatBubbleIndex() {
  return Math.floor(Math.random() * CHAT_BUBBLE_HTML_OPTIONS.length);
}
__name(getInitialChatBubbleIndex, "getInitialChatBubbleIndex");
function renderPage(prefix, folders, files) {
  const initialChatBubbleIndex = getInitialChatBubbleIndex();
  const folderRows = folders.slice().sort().map((f) => {
    const name = f.slice(prefix.length);
    return `<tr>
      <td><a href="/?prefix=${encodeURIComponent(f)}">\u{1F4C1} ${escapeHtml(name)}</a></td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }).join("\n");
  const fileRows = files.filter((obj) => obj.key !== prefix).sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded)).map((obj) => {
    const name = obj.key.slice(prefix.length);
    const badge = getFileBadge(obj.key);
    return `<tr>
        <td><a class="file-link" href="/download?key=${encodeURIComponent(obj.key)}"><span>\u{1F4C4} ${escapeHtml(name)}</span>${badge}</a></td>
        <td>${formatSize(obj.size)}</td>
        <td>${formatDate(obj.uploaded)}</td>
      </tr>`;
  }).join("\n");
  const isEmpty = folders.length === 0 && files.filter((o) => o.key !== prefix).length === 0;
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>dist - ${escapeHtml(prefix || "/")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Hack, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '\u5FAE\u8F6F\u96C5\u9ED1', 'DejaVu Sans', 'Liberation Sans', 'WenQuanYi Micro Hei', 'Droid Sans Fallback', ui-monospace, monospace; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #eee; background: #1a1a1a; }
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
        <button type="button" id="chat-bubble-prev" aria-label="\u4E0A\u4E00\u6761">&lt;</button>
        <span class="bubble-nav-status" id="chat-bubble-status"></span>
        <button type="button" id="chat-bubble-next" aria-label="\u4E0B\u4E00\u6761">&gt;</button>
      </div>
    </div>
  </section>
  <h1><span>\u97F5\u5F8B\u665A\u516B\u70B9 Arcaea / dist</span><small>\u6240\u6709\u8F6F\u4EF6\u514D\u8D39\u63D0\u4F9B\uFF0C\u4E25\u7981\u5012\u5356\uFF0C\u5982\u679C\u4F60\u662F\u4E70\u7684\u8BF7\u627E\u5356\u5BB6\u9000\u6B3E</small></h1>
  <div class="breadcrumb">${renderBreadcrumb(prefix)}</div>
  <table>
    <thead>
      <tr>
        <th>\u540D\u79F0</th>
        <th>\u5927\u5C0F</th>
        <th>\u4FEE\u6539\u65F6\u95F4</th>
      </tr>
    </thead>
    <tbody>
      ${folderRows}
      ${fileRows}
      ${isEmpty ? '<tr><td class="empty" colspan="3">\u7A7A\u76EE\u5F55</td></tr>' : ""}
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
  <\/script>
</body>
</html>`;
}
__name(renderPage, "renderPage");

// node_modules/.pnpm/wrangler@4.69.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/.pnpm/wrangler@4.69.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-7HxlZa/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/.pnpm/wrangler@4.69.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-7HxlZa/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
